<template>
  <div v-if="data.length > 1" class="w-full">
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" style="height:50px">
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#EFA827" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#EFA827" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path :d="areaPath" :fill="`url(#${gradId})`" />
      <path :d="linePath" fill="none" stroke="#EF9F27" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle v-for="(p, i) in points" :key="i" :cx="p.x" :cy="p.y" r="2" fill="#EF9F27" />
      <!-- Last point highlight -->
      <circle v-if="points.length"
        :cx="points[points.length-1].x" :cy="points[points.length-1].y" r="4"
        fill="#EF9F27" stroke="white" stroke-width="2" />
    </svg>
  </div>
  <div v-else-if="data.length === 1" class="text-xs text-gray-400 text-right">
    Premier record !
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  id: { type: String, required: true }
})

const W = 100
const H = 40
const PAD = 4

const gradId = computed(() => `prgrad-${props.id}`)

const minVal = computed(() => Math.min(...props.data.map(d => d.weight_kg ?? 0)))
const maxVal = computed(() => Math.max(...props.data.map(d => d.weight_kg ?? 0)))

function yScale(v) {
  const range = maxVal.value - minVal.value
  if (range === 0) return H / 2
  return PAD + (1 - (v - minVal.value) / range) * (H - PAD * 2)
}

function xScale(i) {
  const n = props.data.length
  if (n <= 1) return W / 2
  return PAD + (i / (n - 1)) * (W - PAD * 2)
}

const points = computed(() => props.data.map((d, i) => ({
  x: xScale(i),
  y: yScale(d.weight_kg ?? 0)
})))

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
)

const areaPath = computed(() => {
  if (points.value.length < 2) return ''
  const bottom = H - PAD
  return `${linePath.value} L${points.value[points.value.length-1].x},${bottom} L${points.value[0].x},${bottom} Z`
})
</script>
