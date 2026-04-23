<template>
  <header class="sticky top-0 z-30 bg-white border-b border-gray-100">
    <div class="flex items-center gap-3 px-4 py-3">
      <button v-if="back" @click="router.back()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
        ←
      </button>
      <div class="flex-1">
        <h1 class="text-base font-semibold text-gray-900 leading-tight">{{ title }}</h1>
        <p v-if="subtitle" class="text-xs text-gray-400">{{ subtitle }}</p>
      </div>
      <slot name="right" />
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
defineProps({ title: String, subtitle: String, back: Boolean })
</script>
