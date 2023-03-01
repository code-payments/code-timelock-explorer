<script lang="ts">
import { defineComponent } from 'vue';
import { WalletMultiButton, useWallet } from "solana-wallets-vue";
import { Button, Layout } from '@/components';

export default defineComponent({
  components: {
    Button,
    Layout,
    WalletMultiButton
  },
  setup() {
    const wallet = useWallet();
    return {
      wallet
    }
  },
  methods: {
    isConnected() {
      return this.wallet.connected.value;
    },

    onConfirm() {
      this.$bus.emit('goto:getsignatures');
    },

    onBack() {
      this.$bus.emit('goto:accountlist');
    }

  },
});
</script>

<template>
  <Layout :header="true">
    <div class="grid h-screen place-items-center mt-0 sm:mt-[-5rem]">
      <div class="max-w-2xl">

        <p class="font-display text-4xl tracking-tight text-white">
          Fee Wallet
        </p>

        <p class="mt-3 mb-2 text-sm sm:text-2xl tracking-tight text-slate-400">
          In order to unlock your accounts, you'll need to submit several
          transactions to the Solana blockchain. Please connect a wallet to fund
          the SOL transaction fees for the unlock transactions.<br/> Learn more
          at <a href="https://docs.solana.com/transaction_fees" target="_blank"
          class="text-slate-200">https://docs.solana.com/transaction_fees</a>.
        </p>

        <div class="mt-10 mb-2 justify-start flex">
          <WalletMultiButton />
        </div>

        <div class="mt-10 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
          <Button variant="primary"  @click="onConfirm()" :disabled="!isConnected()">Confirm Wallet</Button>
        </div>
      </div>
    </div>
  </Layout>
</template>
