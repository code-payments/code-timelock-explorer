<script lang="ts">
import { computed, defineComponent } from 'vue';

import {
  FromQuarks,
  Timelock,
  TrayAccountType,
  getDerivationPath,
  getHumanTimeRemaining,
  shortenPubkey, 
} from '@/types';

function getPath(account: Timelock): string {
  return getDerivationPath(
    account.getAccountType(),
    account.getDerivationIndex(),
    account.getDerivationOffset(),
    ).toString();
}

function getRole(account: Timelock): string {
  switch (account.getAccountType()) {
    case TrayAccountType.Primary:
      return 'Deposit Account';
    case TrayAccountType.Incoming:
      return 'Incoming Account';
    case TrayAccountType.Outgoing:
      return 'Outgoing Account';
    default:
      return 'Bucket Account';
  }
}

function getBalance(account: Timelock): string {
  return FromQuarks(Number(account.getCachedBalance())).toLocaleString('en-US');
}

export default defineComponent({
  props: {
    accounts: {
      required: true
    }
  },

  setup(props) {
    const accounts = computed(() => props.accounts as Timelock[]);
    return {
      accounts,
      getPath,
      getRole,
      getBalance,
      getHumanTimeRemaining,
      shortenPubkey,
    };
  },

});
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table class="min-w-full divide-y divide-gray-300">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-6 text-left text-sm font-semibold text-gray-900">Derivation Path</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Balance</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Address</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vault</th>
            <th scope="col" class="px-3 py-3.5 pr-6 text-left text-sm font-semibold text-gray-900">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-for="account in accounts" :key="account.getAddress().toBase58()">
            <td class="py-3.5 pl-4 pr-6 text-sm text-gray-500 w-0 align-top">
              <span class="inline-flex items-center rounded-full bg-purple-100 px-3 py-0.5 text-sm font-medium text-purple-800">
              {{ getPath(account) }}
              </span>


              <div v-if="account.isWaiting()">
                <dl class="font-normal" v-if="account.getRemainingTimeUntilUnlock() > 0">
                  <dd class="mt-3 truncate text-gray-500 text-sm">Ready for unlock in {{ getHumanTimeRemaining(account.getUnlockAtTime()) }}</dd>
                </dl>
                <dl class="font-normal" v-else>
                  <dd class="mt-3 truncate text-gray-500 text-sm">Unlocked {{  getHumanTimeRemaining(account.getUnlockAtTime()) }} ago</dd>
                </dl>
              </div>  
              <div v-else>
              <dl class="font-normal">
                <dd class="mt-3 truncate text-gray-500 text-sm">{{ getRole(account) }}</dd>
              </dl>
              </div>
            </td>

            <td class="px-3 py-4 text-sm text-gray-500 w-0 whitespace-nowrap align-top">
              <a target="_blank" class="font-bold text-lg" :href="`https://explorer.solana.com/address/${account.getVault().toBase58()}`">{{ getBalance(account) }}</a> Kin
            </td>

            <td class="px-3 py-4 text-sm text-gray-500 truncate w-0 align-top">
              <a target="_blank" class="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800 no-wrap"
                :href="`https://explorer.solana.com/address/${account.getAddress().toBase58()}`">
                {{ shortenPubkey(account.getAddress(), 10) }}
              </a>
            </td>

            <td class="px-3 py-4 text-sm text-gray-500 truncate w-0 align-top">
              <a target="_blank" class="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800 no-wrap"
                :href="`https://explorer.solana.com/address/${account.getVault().toBase58()}`">
                {{ shortenPubkey(account.getVault(), 10) }}
              </a>
            </td>

            <td class="px-3 py-4 text-sm text-gray-500 w-0 whitespace-nowrap align-top">
              <span v-if="account.isUnlocked()" class="inline-flex items-center rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-medium text-indigo-800">
                Unlocked
              </span>
              <span v-if="account.isLocked()" class="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
                Locked
              </span>
              <span v-if="account.isWaiting() && account.getRemainingTimeUntilUnlock() > 0" class="inline-flex items-center rounded-full bg-yellow-100 px-3 py-0.5 text-sm font-medium text-yellow-800">
                In Wait Period
              </span>
              <span v-if="account.isWaiting() && account.getRemainingTimeUntilUnlock() <= 0" class="inline-flex items-center rounded-full bg-pink-100 px-3 py-0.5 text-sm font-medium text-pink-800">
                Ready for Unlock
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>