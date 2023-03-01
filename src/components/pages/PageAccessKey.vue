<script lang="ts">
import { defineComponent } from 'vue';
import { Button, Layout } from '@/components';
import { MnemonicPhrase } from '@/types';

const defaultPhrase = ""; // fill this for easy testing
let phrase: string = defaultPhrase;
let count: number = 0;

export default defineComponent({
  components: {
    Button,
    Layout,
  },
  data() {
    return {
      phrase,
      count,
    }
  },
  methods: {
    isValid() {
      return MnemonicPhrase.isValid(this.phrase);
    },

    onChange(event: any) {
      this.phrase = event.target.value;
      this.count = this.phrase.trim().split(/\s+/).length;
    },

    onConfirm() {
      if (!this.isValid()) {
        return;
      }

      this.$bus.emit('goto:search', this.phrase);
    },

    onBack() {
      this.$bus.emit('goto:home');
    }

  },
});
</script>

<template>
  <Layout :header="true">
    <div class="grid h-screen place-items-center mt-0 sm:mt-[-5rem]">
      <div class="max-w-2xl">
        <p class="font-display text-4xl tracking-tight text-white">
          Access Key
        </p>

        <p class="mt-3 mb-2 text-2xl tracking-tight text-slate-400">
          To get started, enter your 12 word Code Access Key.
        </p>

        <textarea :value="phrase" @input="onChange($event)" rows="3"
          class="mt-3 p-5 text-xl tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none"></textarea>

        <div class="flex">
          <Transition>
            <div class="" v-if="count > 1">
              <p v-if="count < 12" class="text-2xs leading-6 text-slate-400">{{ 12 - count }} more words</p>
              <p v-if="count >= 12 && !isValid()" class="text-2xs leading-6 text-slate-400">Invalid access key</p>
            </div>
          </Transition>

          <Transition>
            <div class="" v-if="count <= 1 || isValid()">
              <!-- Making sure the UI doesn't pop -->
              <p>&nbsp;</p>
            </div>
          </Transition>
        </div>

        <div class="mt-5 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
          <Button variant="primary" :disabled="!isValid()" @click="onConfirm()">Find My Accounts</Button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>