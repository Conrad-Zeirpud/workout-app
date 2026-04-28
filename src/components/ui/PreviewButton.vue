<template>
  <button @click.stop="$emit('preview')"
    type="button"
    class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg active:scale-95 transition-transform"
    :class="hasMedia ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'">
    <span class="text-sm">👁</span>
    Aperçu
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  exercise: Object
})
defineEmits(['preview'])

const hasMedia = computed(() => !!props.exercise?.media_url)
</script>
