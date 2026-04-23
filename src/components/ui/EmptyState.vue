<template>
  <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div class="text-5xl mb-4">{{ icon }}</div>
    <p class="text-gray-700 font-semibold mb-1">{{ title }}</p>
    <p class="text-gray-400 text-sm mb-6">{{ subtitle }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>
