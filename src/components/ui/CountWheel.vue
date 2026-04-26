<template>
  <div class="flex items-center justify-center bg-white rounded-2xl border border-gray-100 px-4 py-3">
    <NumberWheel
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :min="min"
      :max="max"
      :step="step"
      :width="80" />
    <div v-if="suffix" class="ml-2 text-xs text-gray-400 font-medium">{{ suffix }}</div>
  </div>
</template>

<script setup>
import NumberWheel from './NumberWheel.vue'
defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 60 },
  step: { type: Number, default: 1 },
  suffix: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>
