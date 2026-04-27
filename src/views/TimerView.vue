<template>
  <div class="pb-24">
    <PageHeader title="Timer WOD" subtitle="AMRAP, EMOM, For Time, Tabata, Intervalles" />

    <div class="px-4 mt-4 space-y-3">
      <div v-for="m in modes" :key="m.id"
        @click="selectMode(m.id)"
        class="card p-4 cursor-pointer transition-all"
        :style="selectedMode === m.id ? `border:2px solid ${m.color}` : 'border:2px solid transparent'">

        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            :style="`background:${m.bg}`">
            {{ m.icon }}
          </div>
          <div class="flex-1">
            <p class="font-semibold text-gray-900">{{ m.name }}</p>
            <p class="text-xs text-gray-400">{{ m.description }}</p>
          </div>
          <span v-if="selectedMode === m.id" class="text-sm" :style="`color:${m.color}`">●</span>
        </div>

        <div v-if="selectedMode === m.id" class="mt-4 pt-4 border-t border-gray-100">
          <!-- Segments -->
          <div v-for="(seg, segIdx) in segments" :key="segIdx" class="mb-3">
            <div v-if="segments.length > 1"
              class="flex items-center justify-between mb-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Timer {{ segIdx + 1 }}
              </p>
              <button @click.stop="removeSegment(segIdx)"
                class="text-xs text-red-400">Retirer</button>
            </div>

            <!-- AMRAP -->
            <div v-if="m.id === 'amrap'">
              <p class="text-xs text-gray-500 text-center mb-2">Durée totale</p>
              <div class="flex justify-center">
                <DurationPicker v-model="seg.totalSeconds" :step="30" />
              </div>
            </div>

            <!-- EMOM -->
            <div v-else-if="m.id === 'emom'" class="space-y-3">
              <div>
                <p class="text-xs text-gray-500 text-center mb-2">Intervalle</p>
                <div class="flex justify-center">
                  <NumberWheel v-model="seg.intervalSeconds"
                    :options="emomIntervalOptions"
                    :width="100" />
                </div>
                <p class="text-center text-xs text-gray-400 mt-1">
                  {{ formatInterval(seg.intervalSeconds) }} par round
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 text-center mb-2">Nombre de rounds</p>
                <div class="flex justify-center">
                  <CountWheel v-model="seg.rounds" :min="1" :max="60" suffix="rounds" />
                </div>
              </div>
            </div>

            <!-- For Time -->
            <div v-else-if="m.id === 'fortime'">
              <p class="text-xs text-gray-500 text-center mb-2">Cap (0 = sans limite)</p>
              <div class="flex justify-center">
                <DurationPicker v-model="seg.cap" :step="30" />
              </div>
              <p class="text-xs text-gray-400 text-center mt-2">
                {{ seg.cap > 0 ? 'Stop manuel ou cap atteint' : 'Stop manuel uniquement' }}
              </p>
            </div>

            <!-- Tabata -->
            <div v-else-if="m.id === 'tabata'" class="space-y-3">
              <div>
                <p class="text-xs text-gray-500 text-center mb-2">Effort</p>
                <div class="flex justify-center">
                  <DurationPicker v-model="seg.workSeconds" :step="5" :show-label="false" />
                </div>
              </div>
              <div>
                <p class="text-xs text-gray-500 text-center mb-2">Repos</p>
                <div class="flex justify-center">
                  <DurationPicker v-model="seg.restSeconds" :step="5" :show-label="false" />
                </div>
              </div>
              <div>
                <p class="text-xs text-gray-500 text-center mb-2">Rounds</p>
                <div class="flex justify-center">
                  <CountWheel v-model="seg.rounds" :min="1" :max="30" suffix="rounds" />
                </div>
              </div>
            </div>

            <!-- Interval -->
            <div v-else-if="m.id === 'interval'" class="space-y-3">
              <div>
                <p class="text-xs text-gray-500 text-center mb-2">Effort</p>
                <div class="flex justify-center">
                  <DurationPicker v-model="seg.workSeconds" :step="30" :show-label="false" />
                </div>
              </div>
              <div>
                <p class="text-xs text-gray-500 text-center mb-2">Repos</p>
                <div class="flex justify-center">
                  <DurationPicker v-model="seg.restSeconds" :step="30" :show-label="false" />
                </div>
              </div>
              <div>
                <p class="text-xs text-gray-500 text-center mb-2">Rounds</p>
                <div class="flex justify-center">
                  <CountWheel v-model="seg.rounds" :min="1" :max="60" suffix="rounds" />
                </div>
              </div>
            </div>
          </div>

          <!-- Rest between segments (only if multi-segment) -->
          <div v-if="segments.length > 1"
            class="mt-3 pt-3 border-t border-gray-100">
            <p class="text-xs text-gray-500 text-center mb-2">Récup entre timers</p>
            <div class="flex justify-center">
              <DurationPicker v-model="restBetween" :step="30" />
            </div>
          </div>

          <!-- Add another segment button -->
          <button @click.stop="addSegment"
            class="w-full mt-3 text-center text-xs font-medium py-2 border border-dashed rounded-xl transition-colors"
            :style="`color:${m.color};border-color:${m.color}40`">
            + Ajouter un autre {{ m.name }}
          </button>

          <!-- Prep info (fixed) -->
          <p class="text-xs text-gray-400 text-center mt-3">
            ⏱ Préparation : 10 secondes (fixe)
          </p>

          <button @click.stop="startTimer" class="btn-accent w-full mt-3 py-3 font-semibold text-base">
            ▶ Démarrer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWodTimerStore } from '@/stores/wodTimer'
import PageHeader from '@/components/ui/PageHeader.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import CountWheel from '@/components/ui/CountWheel.vue'
import NumberWheel from '@/components/ui/NumberWheel.vue'

const router = useRouter()
const wod = useWodTimerStore()
const selectedMode = ref(null)

const modes = [
  { id: 'amrap',    name: 'AMRAP',     icon: '🔁', color: '#378ADD', bg: '#E6F1FB', description: 'Max de rounds dans le temps imparti' },
  { id: 'emom',     name: 'EMOM',      icon: '⏱️', color: '#7F77DD', bg: '#EEEDFE', description: 'Une série au début de chaque intervalle' },
  { id: 'fortime',  name: 'For Time',  icon: '🏁', color: '#639922', bg: '#EAF3DE', description: 'Le plus vite possible, chrono qui monte' },
  { id: 'tabata',   name: 'Tabata',    icon: '🔥', color: '#E24B4A', bg: '#FCEBEB', description: '20s effort / 10s repos × 8 rounds' },
  { id: 'interval', name: 'Intervalles', icon: '🔂', color: '#EF9F27', bg: '#FAEEDA', description: 'Effort / Repos personnalisables × N rounds' },
]

// EMOM interval options : 15s, 30s, 45s, 1min, 1min30, ..., 12min
const emomIntervalOptions = (() => {
  const arr = []
  for (let s = 15; s <= 60 * 12; s += 15) {
    if (s <= 60 || s % 30 === 0) arr.push(s)  // 15s/30s/45s/60s puis pas de 30s
  }
  return arr
})()

function formatInterval(sec) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (s === 0) return `${m} min`
  return `${m}min${s}s`
}

// Default config per mode
function defaultSegment(modeId) {
  return ({
    amrap:    { totalSeconds: 12 * 60 },
    emom:     { intervalSeconds: 60, rounds: 10 },
    fortime:  { cap: 0 },
    tabata:   { workSeconds: 20, restSeconds: 10, rounds: 8 },
    interval: { workSeconds: 40, restSeconds: 20, rounds: 10 },
  })[modeId]
}

const segments = ref([])
const restBetween = ref(60)

function selectMode(modeId) {
  if (selectedMode.value === modeId) return
  selectedMode.value = modeId
  segments.value = [defaultSegment(modeId)]
  restBetween.value = 60
}

function addSegment() {
  segments.value.push(defaultSegment(selectedMode.value))
}

function removeSegment(idx) {
  if (segments.value.length > 1) segments.value.splice(idx, 1)
}

function startTimer() {
  if (!selectedMode.value || segments.value.length === 0) return
  wod.start(selectedMode.value, segments.value, restBetween.value)
  router.push('/timer/run')
}
</script>
