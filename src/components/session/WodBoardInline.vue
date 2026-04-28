<template>
  <div class="px-4 py-4 pb-32">
    <div class="rounded-2xl p-5"
      style="background:linear-gradient(135deg,#0f3d2e,#0a2a1f);box-shadow:inset 0 0 60px rgba(0,0,0,0.5)">

      <!-- Header WOD -->
      <div class="flex items-center justify-between mb-4">
        <p class="text-white/40 text-xs uppercase tracking-widest">WOD</p>
        <p class="text-yellow-400 font-bold text-base">{{ wodModeLabel }}</p>
      </div>

      <!-- Mode summary -->
      <div class="text-center mb-5">
        <p class="text-white text-3xl font-black tracking-tight" style="font-family:'Courier New',monospace">
          {{ modeBigLabel }}
        </p>
        <p class="text-white/50 text-sm mt-1">{{ modeSubLabel }}</p>
      </div>

      <!-- Exercises list -->
      <div v-if="wodItems.length > 0" class="space-y-2">
        <div v-for="(item, i) in wodItems" :key="item.id"
          class="flex items-baseline gap-3 py-2 border-b border-white/10 last:border-b-0">
          <span class="text-yellow-400 text-sm font-mono w-6 text-right flex-shrink-0">{{ i + 1 }}.</span>
          <p class="text-white text-base flex-1" style="font-family:'Courier New',monospace">
            <span class="font-bold text-yellow-300">{{ describePrescription(item) }}</span>
            <span class="ml-2">{{ item.exercise?.name }}</span>
          </p>
        </div>
      </div>
      <div v-else class="text-center py-4">
        <p class="text-white/50 text-sm">Aucun exercice dans le WOD</p>
        <p class="text-white/30 text-xs mt-1">Le timer fonctionnera quand même</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { describePrescription } from '@/lib/units'

const props = defineProps({
  workout: { type: Object, required: true },
  wodItems: { type: Array, default: () => [] }
})

const wodModeLabel = computed(() => ({
  amrap: 'AMRAP', emom: 'EMOM', fortime: 'For Time', tabata: 'Tabata', interval: 'Intervalles'
}[props.workout?.wod_mode] || ''))

const modeBigLabel = computed(() => {
  const m = props.workout?.wod_mode
  const c = props.workout?.wod_config || {}
  if (m === 'amrap') return `AMRAP ${Math.floor(c.totalSeconds / 60)}'`
  if (m === 'emom') return `EMOM ${c.rounds}`
  if (m === 'fortime') return c.cap > 0 ? `FOR TIME (cap ${Math.floor(c.cap / 60)}')` : 'FOR TIME'
  if (m === 'tabata') return `TABATA × ${c.rounds}`
  if (m === 'interval') return `${c.workSeconds}s/${c.restSeconds}s × ${c.rounds}`
  return ''
})

const modeSubLabel = computed(() => {
  const m = props.workout?.wod_mode
  const c = props.workout?.wod_config || {}
  if (m === 'amrap') return 'As Many Rounds As Possible'
  if (m === 'emom') return `Toutes les ${formatInterval(c.intervalSeconds || 60)}`
  if (m === 'fortime') return c.cap > 0 ? 'Le plus vite possible' : 'À ton rythme'
  if (m === 'tabata') return `${c.workSeconds}s effort / ${c.restSeconds}s repos`
  if (m === 'interval') return `${c.rounds} rounds`
  return ''
})

function formatInterval(sec) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (s === 0) return `${m} min`
  return `${m}min${s}s`
}
</script>
