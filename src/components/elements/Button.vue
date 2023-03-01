<script lang="ts">
import { computed, defineComponent } from 'vue';

const styles = {
  primary:
    'rounded-full bg-sky-300 py-2 px-4 text-sm whitespace-nowrap disabled:opacity-25 disabled:cursor-not-allowed font-semibold text-slate-900 hover:bg-sky-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300/50 active:bg-sky-500',
  secondary:
    'rounded-full bg-slate-800 py-2 px-4 text-sm whitespace-nowrap disabled:opacity-25 disabled:cursor-not-allowed font-medium text-white hover:bg-slate-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 active:text-slate-400',
}

export default defineComponent({
  props: {
    variant: {
      type: String,
      required: false,
      default: 'primary'
    },

    href: {
      type: String,
      required: false
    },

    class: {
      type: String,
      required: false
    }
  },

  setup(props) {
    const className = computed(() => {
      return styles[props.variant as keyof typeof styles] + ' ' + props.class;
    });

    return {
      className
    }
  },

  methods: {
    isLink() {
      return this.href !== undefined;
    }
  }
});
</script>

<template>
  <a v-if="isLink()" :href="href" :class="className" v-bind="$attrs">
    <slot />
  </a>

  <button v-else :class="className" v-bind="$attrs">
    <slot />
  </button>
</template>