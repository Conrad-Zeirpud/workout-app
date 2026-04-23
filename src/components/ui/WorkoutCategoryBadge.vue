<template>
  <span class="inline-flex items-center gap-1 badge text-xs font-medium"
    :style="`background:${cat.bg};color:${cat.text}`">
    <span>{{ cat.icon }}</span>
    {{ cat.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getCategory } from '@/lib/categories'

const props = defineProps({ category: String })
const cat = computed(() => getCategory(props.category))
</script>
