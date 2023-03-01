<script setup lang="ts">

import {
  SectionHeader,
  SectionBackground,
} from '@/components';

import blurCyanUrl from '../../assets/blur-cyan.png';
import blurIndigoUrl from '../../assets/blur-indigo.png';

</script>

<template>

  <div class="bg-slate-900">
    <!-- Glow effects -->
    <div class="pointer-events-none">
      <!-- Top Left -->
      <img class="absolute bottom-full right-full -mr-72 -mb-[400px] opacity-50" :src="blurCyanUrl" width="530" height="530" />
      <!-- Bottom Right -->
      <div class="fixed w-full h-full bottom-0 right-0 overflow-hidden opacity-80">
        <img class="absolute -bottom-72 -right-64" :src="blurCyanUrl" alt="" width="530" height="530" />
        <img class="absolute -bottom-40 -right-44" :src="blurIndigoUrl" alt="" width="567" height="567" />
        <!-- Masked Flow Diagram -->
        <div class="opacity-70 md:opacity-100">
          <div class="absolute inset-x-[-50vw] -top-32 -bottom-48 
            [mask-image:linear-gradient(transparent,white,white)] 
            dark:[mask-image:linear-gradient(transparent,white,transparent)] 
            md:left-[75%] 
            md:right-0 md:-top-32 md:-bottom-32 
            md:[mask-image:none]
            md:dark:[mask-image:linear-gradient(white,white,transparent)]">
            <SectionBackground
              class="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 md:translate-y-[-60%]" />
          </div>
        </div>
      </div>
    </div>

    <!-- Header & Content -->
    <div class="relative">
      <SectionHeader/>

      <div class="mt-[-6rem] pt-[4.5rem] lg:mt-[-6rem] lg:pt-[4.75rem] px-5">
        <slot></slot>
      </div>
    </div>
  </div>
</template>