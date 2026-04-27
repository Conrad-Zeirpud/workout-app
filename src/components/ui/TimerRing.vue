<template>
  <div class="relative flex items-center justify-center" :style="`width:${size}px;height:${size}px`">
    <svg :width="size" :height="size" class="-rotate-90 absolute inset-0">
      <circle :cx="size/2" :cy="size/2" :r="radius" fill="none" :stroke="trackColor" :stroke-width="stroke" />
      <circle :cx="size/2" :cy="size/2" :r="radius" fill="none" :stroke="ringColor" :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="circumference - (circumference * pct)" />
    </svg>
    <div class="relative text-center">
      <div class="font-bold" :style="`font-size:${size*0.22}px;color:${textColor}`">{{ formatted }}</div>
      <div v-if="label" class="leading-none mt-1" :style="`font-size:${size*0.1}px;color:${labelColor}`">{{ label }}</div>
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
  label: String,
  textColor: { type: String, default: '#1a1a2e' },
  labelColor: { type: String, default: '#9ca3af' },
  ringColor: { type: String, default: 'var(--accent)' },
  trackColor: { type: String, default: '#f3f4f6' },
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
