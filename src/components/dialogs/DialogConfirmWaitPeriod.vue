<script lang="ts">
import { defineComponent } from 'vue';
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle, } from '@headlessui/vue'
import { Button } from '@/components'

export default defineComponent({
  components: {
    Button,
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
  },

  props: {
    modelValue: Boolean
  },

  emits: ['update:modelValue'],

  methods: {
    closeModal() {
      this.$emit('update:modelValue', false);
    },
    cancel() {
      this.closeModal();
    },
    confirm() {
      this.closeModal();
      this.$bus.emit('goto:feepage');
    },
  }
});
</script>

<template>
  <TransitionRoot appear :show="modelValue" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-50">
      <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
        leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95">
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-center text-2xl font-medium leading-6 text-gray-900 mt-2">
                Are you sure?
              </DialogTitle>
              <div class="mt-8">
                <p class="text-md text-lg text-gray-500 text-center">
                  Once you Unlock your Timelock Accounts you will no longer be
                  able to use your Access Key in the Code App. Furthermore,
                  your funds will be inaccesible for 21 days while you wait for
                  the Timelock Waiting Period to elapse.
                </p>
              </div>

              <div class="mt-10 flex gap-4 justify-center">
                <Button @click="cancel" variant="secondary">Nevermind</Button>
                <Button @click="confirm" variant="primary">Yes, continue</Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>