<template>
  <div class="relative flex items-center justify-center" :style="`width:${size}px;height:${size}px`">
    <svg :width="size" :height="size" class="-rotate-90 absolute inset-0">
      <circle :cx="size/2" :cy="size/2" :r="radius" fill="none" stroke="#f3f4f6" :stroke-width="stroke" />
      <circle :cx="size/2" :cy="size/2" :r="radius" fill="none" stroke="var(--accent)" :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="circumference - (circumference * pct)" />
    </svg>
    <div class="relative text-center">
      <div class="font-bold text-gray-900" :style="`font-size:${size*0.22}px`">{{ formatted }}</div>
      <div v-if="label" class="text-gray-400 leading-none" :style="`font-size:${size*0.1}px`">{{ label }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  current: { type: Number, default: 0 },
  max: { type: Number, default: 90 },
  size: { type: Number, default: 120 },
  stroke: { type: Number, default: 8 },
  label: String
})
const radius = computed(() => props.size / 2 - props.stroke)
const circumference = computed(() => 2 * Math.PI * radius.value)
const pct = computed(() => props.max > 0 ? props.current / props.max : 0)
const formatted = computed(() => {
  const m = Math.floor(props.current / 60)
  const s = props.current % 60
  return `${m}:${String(s).padStart(2, '0')}`
})
</script>
