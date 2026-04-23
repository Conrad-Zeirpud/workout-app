<template>
  <div class="w-full">
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" style="height:100px">
      <g v-for="(d, i) in data" :key="i">
        <!-- Bar bg -->
        <rect :x="barX(i)" :y="PAD" :width="barW" :height="innerH" rx="4"
          fill="#f3f4f6" />
        <!-- Bar fill -->
        <rect v-if="d.count > 0"
          :x="barX(i)" :y="PAD + innerH - barHeight(d.count)" :width="barW" :height="barHeight(d.count)" rx="4"
          :fill="d.count === maxCount && d.count > 0 ? '#639922' : '#a3c26b'" />
        <!-- Count label -->
        <text v-if="d.count > 0"
          :x="barX(i) + barW / 2" :y="PAD + innerH - barHeight(d.count) - 4"
          text-anchor="middle" font-size="9" fill="#4b7016" font-weight="600">
          {{ d.count }}
        </text>
        <!-- Week label -->
        <text :x="barX(i) + barW / 2" :y="H - 2" text-anchor="middle" font-size="8" fill="#9ca3af">
          {{ d.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ data: { type: Array, default: () => [] } })

const W = 320; const H = 100; const PAD = 14; const PADBOTTOM = 16
const innerH = H - PAD - PADBOTTOM
const barW = computed(() => Math.floor((W - 16) / (props.data.length || 1) - 6))
const maxCount = computed(() => Math.max(...props.data.map(d => d.count), 1))

function barX(i) {
  const total = props.data.length
  const step = (W - 16) / total
  return 8 + i * step + (step - barW.value) / 2
}
function barHeight(count) {
  return Math.max(4, (count / maxCount.value) * innerH)
}
</script>
