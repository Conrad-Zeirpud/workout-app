<template>
  <div class="flex items-center justify-center gap-1 bg-white rounded-2xl border border-gray-100 px-4 py-3">
    <NumberWheel
      :model-value="minutes"
      @update:model-value="updateMinutes"
      :min="0"
      :max="60"
      :step="1"
      :width="60" />
    <span class="text-2xl font-bold text-gray-400 px-1">:</span>
    <NumberWheel
      :model-value="seconds"
      @update:model-value="updateSeconds"
      :options="secondOptions"
      :width="60" />
    <div v-if="showLabel" class="ml-2 text-xs text-gray-400 font-medium">
      <p>min</p>
      <p class="mt-7">sec</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import NumberWheel from './NumberWheel.vue'

const props = defineProps({
  modelValue: { type: Number, required: true },  // total seconds
  step: { type: Number, default: 30 },           // 30 = pas de 30s sur les secondes
  showLabel: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const secondOptions = computed(() => {
  const arr = []
  for (let s = 0; s < 60; s += props.step) arr.push(s)
  return arr
})

const minutes = computed(() => Math.floor(props.modelValue / 60))
const seconds = computed(() => {
  // Snap to nearest valid step option
  const remainder = props.modelValue % 60
  return secondOptions.value.reduce((closest, opt) =>
    Math.abs(opt - remainder) < Math.abs(closest - remainder) ? opt : closest,
    secondOptions.value[0])
})

function updateMinutes(m) { emit('update:modelValue', m * 60 + seconds.value) }
function updateSeconds(s) { emit('update:modelValue', minutes.value * 60 + s) }
</script>
