<script lang="ts">
import { ref, defineComponent } from 'vue';

import { 
  Button,
  Layout,
  DialogConfirmWaitPeriod,
  SectionAccounts 
} from '@/components';

import {
  Timelock,
  Tray,
  getEstimatedTotalBalance,
  getProvider,
  shortenPubkey
} from '@/types';

const showWaitPeriodDialog = ref(false);
const ataBalance = ref('');

enum AccountState {
  Unkown,
  AllLocked,
  SomeLocked,
  SomeWaiting,
  AllWaiting,
  AllUnlocked,
}

export default defineComponent({
  components: {
    Layout,
    Button,
    SectionAccounts,
    DialogConfirmWaitPeriod,
  },

  props: {
    found: {
      required: true
    },
    tray: {
      type: Tray,
      required: true
    }
  },

  setup(props) {
    return {
      AccountState,
      accounts: props.found as Timelock[],
      showWaitPeriodDialog,
      shortenPubkey,
    };
  },

  mounted() {
    this.fetchAssociatedTokenAccountBalance();
  },

  methods: {
    openWaitPeriodDialog() {
      showWaitPeriodDialog.value = true;
    },
    getTotalBalance(): number {
      return getEstimatedTotalBalance(this.accounts);
    },
    getAtaBalance(): string {
      return ataBalance.value;
    },
    getAtaAddress() {
      return this.tray.getAssociatedTokenAddress();
    },
    async fetchAssociatedTokenAccountBalance() {
      const { connection, commitment } = getProvider();

      const address = this.tray.getAssociatedTokenAddress();
      const balance = await connection().getTokenAccountBalance(address, commitment);

      ataBalance.value = balance.value.uiAmount?.toLocaleString() || '';
    },
    getState(): AccountState {
      if (this.accounts.length === 0) {
        return AccountState.Unkown;
      }

      const allLocked = this.accounts.every((a) => a.isLocked());
      const someLocked = this.accounts.some((a) => a.isLocked());
      const allWaiting = this.accounts.every((a) => a.isWaiting());
      const someWaiting = this.accounts.some((a) => a.isWaiting());

      if (allLocked) {
        return AccountState.AllLocked;
      } else if (someLocked) {
        return AccountState.SomeLocked;
      } else if (someWaiting) {
        return AccountState.SomeWaiting;
      } else if (allWaiting) {
        return AccountState.AllWaiting;
      } else {
        return AccountState.AllUnlocked;
      }
    },
    hasActions(): boolean {
      const state = this.getState()
      return (
          state == AccountState.AllLocked || 
          state == AccountState.SomeLocked || 
          state == AccountState.SomeWaiting
        );
    },
  }
});
</script>

<template>
  <div>
    <Layout :header="true">
      <div class="mx-auto max-w-7xl px-0 sm:px-8 mt-20 pb-[5rem]">

        <div class="px-4 sm:px-6 lg:px-8">
          <p class="font-display text-4xl tracking-tight text-white">
            Discovered Accounts
          </p>

          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <p class="mt-3 text-sm sm:text-xl tracking-tight text-slate-400">
                These accounts might temporarily show a total balance that is
                different from what you might see in the Code App. This can
                occur when you have pre-authorized transactions that haven’t
                been submitted to or confirmed by the blockchain yet.
              </p>
            </div>
          </div>
        </div>

        <div class="px-4 sm:px-6 lg:px-8 mt-10">
          <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt class="truncate text-sm font-medium text-slate-500">Total Timelock Accounts Found</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-slate-700">{{ accounts.length }}</dd>
            </div>

            <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt class="truncate text-sm font-medium text-slate-500">Total Balance Across all Timelock Accounts</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight text-slate-700">{{ getTotalBalance().toLocaleString('en-US') }} Kin</dd>
            </div>

            <div v-if="getAtaBalance()" class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt class="truncate text-sm font-medium text-slate-500">Associated Token Account Balance</dt>
              <dd class="mt-1 text-xl font-semibold tracking-tight text-slate-700">{{ getAtaBalance() }} Kin</dd>

              <a target="_blank" class="mt-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800 no-wrap"
                :href="`https://explorer.solana.com/address/${getAtaAddress().toBase58()}`">
                {{ shortenPubkey(getAtaAddress(), 10) }}
              </a>
            </div>

          </dl>
        </div>

        <div class="">
          <SectionAccounts :accounts="(accounts as Timelock[])" />
        </div>

        <div class="mt-10 px-4 sm:px-6 lg:px-8 flex justify-start" v-if="hasActions()">
          <Button variant="primary" @click="openWaitPeriodDialog">
            <template v-if="getState() === AccountState.AllLocked">Initiate Unlock for All My Accounts</template>
            <template v-if="getState() === AccountState.SomeLocked">Finish Initiating Unlock for All My Accounts</template>
            <template v-if="getState() === AccountState.SomeWaiting">Finish Unlock for All My Accounts</template>
            <template v-if="getState() === AccountState.AllUnlocked">Unlock All My Accounts</template>
          </Button>
        </div>
      </div>

    </Layout>

    <DialogConfirmWaitPeriod v-model="showWaitPeriodDialog" />
  </div>
</template>
