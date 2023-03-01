<script lang="ts">
import { defineComponent } from 'vue';
import Button from '../elements/Button.vue'

import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { WalletMultiButton } from "solana-wallets-vue";
import { getConfig } from "@/types";

export default defineComponent({
  components: {
    Button,
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
    WalletMultiButton,
  },

  props: {
    modelValue: Boolean
  },

  emits: ['update:modelValue'],

  data() {
    return {
      config: getConfig().value
    }
  },

  methods: {
    closeModal() {
      this.$emit('update:modelValue', false);
    },
  },

  watch: {
    config: {
      handler: function (config) {
        localStorage.setItem("rpcUrl", config.rpcUrl);
      },
      deep: true
    }
  }
})
</script>

<template>
  <TransitionRoot appear :show="modelValue" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-50">
      <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
        leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 z-50 flex items-start overflow-y-auto bg-slate-900/50 backdrop-blur justify-end">
        <div class="min-h-full w-full max-w-sm bg-white px-2 dark:bg-slate-900">
          <TransitionChild as="template" enter="duration-500 ease-out"
            enter-from="opacity-0 translate-x-full origin-right" enter-to="opacity-100 translate-x-0"
            leave="duration-300 ease-in origin-right" leave-from="opacity-100 translate-x-0"
            leave-to="opacity-0 translate-x-full">
            <DialogPanel class="w-full max-w-md transform overflow-hidden p-6 text-left align-middle transition-all">

              <div class="flex items-center">
                <button @click="closeModal" type="button" aria-label="Close navigation" tabindex="0">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"
                    class="h-6 w-6 stroke-slate-500">
                    <path d="M5 5l14 14M19 5l-14 14"></path>
                  </svg>
                </button>
              </div>

              <h3 class="text-2xl font-medium leading-6 text-white mt-10">Fee Wallet</h3>
              <nav class="text-base mt-5 px-1">
                <WalletMultiButton />
              </nav>

              <h3 class="text-2xl font-medium leading-6 text-white mt-10">Network Config</h3>
              <div class="text-md text-slate-400 mt-5">RPC Endpoint</div>
              <input v-model="config.rpcUrl"
                class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

              <h3 class="text-2xl font-medium leading-6 text-white mt-10">Address Derivation</h3>

              <div class="text-md text-slate-400 mt-5">Base Path</div>
              <input v-model="config.defaultPath"
                class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

              <div class="text-md text-slate-400 mt-5">Token Mint</div>
              <input v-model="config.mint"
                class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

              <div class="text-md text-slate-400 mt-5">Time Authority</div>
              <input v-model="config.timeAuthority"
                class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

              <div class="text-md text-slate-400 mt-5">Unlock Duration (days)</div>
              <input v-model="config.unlockDuration"
                class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

              <div class="mt-10 flex gap-4 justify-end">
                <Button variant="secondary" @click="closeModal">Done</Button>
              </div>

            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>