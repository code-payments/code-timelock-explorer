<script lang="ts">
import { defineComponent } from 'vue';
import { Button, Layout } from '@/components';
import { 
    Tray, 
    TrayAccountType, 
    Timelock, 
    getProvider, 
    getEstimatedTotalBalance 
} from '@/types';

const searchTimeout = 1000;
const accountsPerTick = 5;

async function getAccountSet(
    tray: Tray,
    accountType: TrayAccountType,
    offset: number,
    count: number): Promise<Timelock[]> {

    const res = [];
    for (let i = 0; i < count; i++) {
        res.push(await tray.getAccountByIndex(accountType, offset + i));
    }
    return res;
}

async function getTimelockAndTokenStates(accounts: Timelock[]) {
    const { connection, commitment } = getProvider();

    const addresses = [
        ...accounts.map(a => a.getAddress()),
        ...accounts.map(a => a.getVault()),
    ];

    return await connection().getMultipleAccountsInfo(addresses, commitment);
}

export default defineComponent({
    components: {
        Layout,
        Button,
    },
    props: {
        tray: {
            type: Tray,
            required: false
        }
    },
    data() {
        const offset = 1;
        const numRejected = 0;
        const found = [] as Timelock[];
        const hasFoundBaseAccounts = false;

        const interval = setInterval(() => {
            const tray = this.$props.tray;
            if (tray) {
                this.update(tray);
            }
        }, searchTimeout);

        return {
            interval,
            found,
            offset,
            numRejected,
            hasFoundBaseAccounts,
        };
    },
    unmounted() {
        clearInterval(this.interval);
    },
    methods: {

        async find(accounts: Timelock[]): Promise<void> {
            const res = await getTimelockAndTokenStates(accounts);

            for (let i = 0; i < res.length / 2; i++) {
                const stateInfo = res[i];
                const tokenInfo = res[accounts.length + i];
                if (stateInfo !== null && tokenInfo !== null) {
                    const timelock = accounts[i];
                    timelock.updateFromAccountInfo(stateInfo);
                    timelock.updateBalance(tokenInfo);

                    this.found.push(timelock);
                } else {
                    this.numRejected++;
                }
            }
        },

        async findBaseAccounts(tray: Tray): Promise<void> {
            await this.find(tray.getAllAccounts());
        },

        async findNextAccounts(tray: Tray): Promise<void> {
            const accounts: Timelock[] = [
                ...await getAccountSet(tray, TrayAccountType.Incoming, this.offset, accountsPerTick),
                ...await getAccountSet(tray, TrayAccountType.Outgoing, this.offset, accountsPerTick),
            ];
            this.offset += accountsPerTick;
            await this.find(accounts);
        },

        async update(tray: Tray): Promise<void> {
            if (!this.hasFoundBaseAccounts) {
                await this.findBaseAccounts(tray);
                this.hasFoundBaseAccounts = true;
            } else {
                await this.findNextAccounts(tray);
            }
        },

        onBack() {
            this.$bus.emit('goto:accesskey');
        },
        onContinue() {
            this.$bus.emit('goto:accountlist', this.found, false);
        },
        getTotalBalance(): number {
            return getEstimatedTotalBalance(this.found as Timelock[]);
        }
    }
});
</script>

<template>
    <Layout :header="true">
        <div class="grid h-screen place-items-center text-center mt-0 sm:mt-[-5rem]">
            <div class="absolute top-1/2 left-20 -translate-y-1/2 sm:left-1/2 sm:-translate-x-1/2 hidden sm:block">
                <svg viewBox="0 0 558 558" width="558" height="558" fill="none" aria-hidden="true"
                    class="animate-spin-slower">
                    <defs>
                        <linearGradient id=":rg:" x1="79" y1="16" x2="105" y2="237" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#fff"></stop>
                            <stop offset="1" stop-color="#fff" stop-opacity="0"></stop>
                        </linearGradient>
                    </defs>
                    <path opacity=".2"
                        d="M1 279C1 125.465 125.465 1 279 1s278 124.465 278 278-124.465 278-278 278S1 432.535 1 279Z"
                        stroke="#fff"></path>
                    <path d="M1 279C1 125.465 125.465 1 279 1" stroke="url(#:rg:)" stroke-linecap="round"></path>
                </svg>
            </div>
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                <div class="mx-auto max-w-md sm:text-center">
                    <h2 class="text-5xl font-medium tracking-tight text-white">Searching...</h2>
                    <p class="mt-5 text-lg text-gray-300">
                        It can take a few minutes to derive all of your possible
                        accounts and verify them against the Solana network.
                        <br />
                        Please be patient.
                    </p>

                    <div v-if="found.length > 0">
                        <p class="mt-10 text-2xl text-gray-300">Found {{ found.length }} active, out of {{ numRejected }}
                            addresses</p>
                        <p class="mt-1 text-sm text-gray-300">Estimated balance {{ getTotalBalance().toLocaleString('en-US') }}
                            Kin</p>
                    </div>

                    <div class="mt-10 flex gap-4 justify-center ">
                        <Button v-if="found.length > 0" class="text-lg" @click="onContinue()">Stop searching and
                            continue</Button>
                        <Button v-else variant="secondary" class="text-lg" @click="onBack()">Go Back</Button>
                    </div>
                </div>
            </div>
        </div>

    </Layout>
</template>

<style scoped>
.animate-spin-slower {
    animation: spin 6s linear infinite
}

@keyframes spin {
    to {
        transform: rotate(1turn)
    }
}
</style>