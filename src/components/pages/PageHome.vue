<script setup lang="ts">
import { ref } from 'vue'
import { Button, Layout, DialogRiskConsent } from '@/components';

const showRiskConsent = ref(false);
function openRiskConsent() {
  showRiskConsent.value = true;
}
</script>

<template>
  <div>
    <Layout>
      <div class="grid h-screen place-items-center text-center mt-0 sm:mt-[-5rem]">
        <div class="max-w-2xl">
          <p
            class="inline bg-gradient-to-r from-indigo-200 via-sky-400 to-indigo-200 bg-clip-text font-display text-5xl tracking-tight text-transparent">
            Timelock Explorer
          </p>
          <p class="mt-10 text-xl sm:text-2xl tracking-tight text-slate-400">
            The Timelock Explorer allows you to unlock the Smart Contract based
            Timelock Accounts that are owned by the Code Wallet App account so
            that you can use your Access Key in other Solana Wallets, and move
            your funds using them. To learn more please visit <a
            href="http://www.getcode.com/technicalFAQ" target="_blank"
            class="text-slate-200">www.getcode.com/technicalFAQ</a>
          </p>

          <div class="mt-8 flex gap-4 justify-center ">
            <Button href="https://github.com/code-wallet/timelock-explorer" variant="secondary">View on GitHub</Button>
            <Button @click="openRiskConsent()">Get started</Button>
          </div>

        </div>
      </div>
    </Layout>

    <DialogRiskConsent v-model="showRiskConsent" /> 
  </div>
</template>
