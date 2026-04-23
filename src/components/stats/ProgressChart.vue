<template>
  <div class="w-full">
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" style="height:140px">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <template v-if="points.length > 1">
        <path :d="areaPath" fill="url(#chartGrad)" />
        <path :d="linePath" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle v-for="(p,i) in points" :key="i" :cx="p.x" :cy="p.y" r="4" fill="var(--accent)" />
      </template>
      <text v-if="points.length < 2" x="50%" y="50%" text-anchor="middle" fill="#9ca3af" font-size="12">Pas assez de données</text>
      <!-- Y labels -->
      <text v-for="(v,i) in yLabels" :key="'y'+i" :x="PAD-4" :y="yScale(v)+4" text-anchor="end" font-size="10" fill="#9ca3af">{{ v }}</text>
      <!-- X labels -->
      <text v-for="(p,i) in xPoints" :key="'x'+i" :x="p.x" :y="H-2" text-anchor="middle" font-size="9" fill="#9ca3af">{{ p.label }}</text>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ data: { type: Array, default: () => [] } })

const W = 320; const H = 120; const PAD = 30; const PADRIGHT = 10; const PADTOP = 10; const PADBOTTOM = 20

const maxVal = computed(() => Math.max(...props.data.map(d => d.weight_kg || 0), 1))
const minVal = computed(() => Math.min(...props.data.map(d => d.weight_kg || 0), 0))

function yScale(v) {
  return PADTOP + (1 - (v - minVal.value) / (maxVal.value - minVal.value || 1)) * (H - PADTOP - PADBOTTOM)
}
function xScale(i) {
  const n = props.data.length
  return PAD + (i / (n - 1 || 1)) * (W - PAD - PADRIGHT)
}

const points = computed(() => props.data.map((d, i) => ({ x: xScale(i), y: yScale(d.weight_kg || 0) })))

const linePath = computed(() => points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '))
const areaPath = computed(() => {
  if (points.value.length < 2) return ''
  const bottom = H - PADBOTTOM
  return `${linePath.value} L${points.value[points.value.length-1].x},${bottom} L${points.value[0].x},${bottom} Z`
})

const yLabels = computed(() => {
  const range = maxVal.value - minVal.value
  if (range === 0) return [minVal.value]
  return [minVal.value, minVal.value + range / 2, maxVal.value].map(v => Math.round(v))
})

const xPoints = computed(() => {
  if (props.data.length === 0) return []
  const step = Math.max(1, Math.floor(props.data.length / 4))
  return props.data
    .map((d, i) => ({ i, label: new Date(d.session?.started_at || Date.now()).toLocaleDateString('fr', { day: '2-digit', month: '2-digit' }) }))
    .filter((_, i) => i % step === 0 || i === props.data.length - 1)
    .map(d => ({ x: xScale(d.i), label: d.label }))
})
</script>
