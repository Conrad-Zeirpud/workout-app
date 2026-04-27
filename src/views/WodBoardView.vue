<template>
  <div class="min-h-screen flex flex-col" style="background:#1a1a2e">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-12 pb-3">
      <button @click="goBack" class="text-white/60 text-sm px-2 py-1">← Retour</button>
      <p class="text-white font-bold uppercase tracking-wide text-sm">{{ session.workout?.name }}</p>
      <div class="w-12" />
    </div>

    <!-- Blackboard WOD -->
    <div class="px-4 mt-2 flex-1 overflow-y-auto pb-32">
      <div class="rounded-2xl p-5 mb-4"
        style="background:linear-gradient(135deg,#0f3d2e,#0a2a1f);box-shadow:inset 0 0 60px rgba(0,0,0,0.5)">
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
        <div class="space-y-2 mb-3">
          <div v-for="(item, i) in wodItems" :key="item.id"
            class="flex items-baseline gap-3 py-1 border-b border-white/5">
            <span class="text-yellow-400 text-sm font-mono w-6 text-right">{{ i + 1 }}.</span>
            <p class="text-white text-base flex-1" style="font-family:'Courier New',monospace">
              <span class="font-bold text-yellow-300">{{ describePrescription(item) }}</span>
              <span class="ml-2">{{ item.exercise?.name }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Timer status -->
      <div v-if="wodTimer.running || wodTimer.finished" class="mb-4">
        <div class="card p-4 text-center"
          :style="`background:${timerBg}`">
          <p class="text-white/70 text-xs uppercase tracking-wide">{{ wodTimer.phaseLabel }}</p>
          <p class="text-white font-bold font-mono leading-tight"
            :style="`font-size:5rem;letter-spacing:-3px;color:${timerColor}`">
            {{ mainTime }}
          </p>
          <p v-if="wodTimer.mode === 'amrap' && wodTimer.phase === 'work'" class="text-white/70 text-sm">
            <span class="text-3xl font-bold text-white">{{ wodTimer.rounds }}</span> rounds
          </p>
          <p v-if="wodTimer.mode === 'emom'" class="text-white/70 text-sm">
            Round {{ wodTimer.currentRound + 1 }} / {{ wodTimer.config.rounds }}
          </p>
          <p v-if="wodTimer.mode === 'tabata' || wodTimer.mode === 'interval'" class="text-white/70 text-sm">
            Round {{ wodTimer.currentRound + 1 }} / {{ wodTimer.config.rounds }}
          </p>
        </div>
      </div>
    </div>

    <!-- Bottom action bar -->
    <div class="fixed bottom-0 left-0 right-0 px-4 py-4"
      style="background:rgba(15,15,30,0.95);padding-bottom:max(1rem,env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,0.1)">
      <!-- Not started -->
      <div v-if="!wodTimer.running && !wodTimer.finished" class="flex gap-3">
        <button @click="startWod"
          class="flex-1 py-4 rounded-xl font-bold text-base text-white"
          style="background:#639922">
          ⏱ Démarrer le WOD
        </button>
      </div>

      <!-- Running -->
      <div v-else-if="wodTimer.running" class="flex gap-3">
        <button @click="togglePause"
          class="flex-1 py-3 rounded-xl font-semibold text-white bg-white/10">
          {{ wodTimer.paused ? '▶ Reprendre' : '⏸ Pause' }}
        </button>
        <button v-if="wodTimer.mode === 'amrap' && wodTimer.phase === 'work'"
          @click="wodTimer.incrementRound()"
          class="flex-1 py-3 rounded-xl font-bold text-white text-xl"
          style="background:#639922">+ Round</button>
        <button v-if="wodTimer.mode === 'fortime' && wodTimer.phase === 'work'"
          @click="wodTimer.finishForTime()"
          class="flex-1 py-3 rounded-xl font-bold text-white"
          style="background:#E24B4A">🏁 Stop</button>
        <button v-if="wodTimer.mode !== 'amrap' && wodTimer.mode !== 'fortime'"
          @click="confirmStop = true"
          class="flex-1 py-3 rounded-xl font-semibold text-white bg-red-500/80">
          ✕ Arrêter
        </button>
      </div>

      <!-- Finished -->
      <div v-else-if="wodTimer.finished" class="flex gap-3 flex-col">
        <p class="text-yellow-400 text-center font-bold">🏆 WOD terminé !</p>
        <p v-if="wodTimer.mode === 'amrap'" class="text-white text-center text-sm">
          {{ wodTimer.rounds }} rounds en {{ formatTime(wodTimer.elapsed) }}
        </p>
        <p v-if="wodTimer.mode === 'fortime'" class="text-white text-center text-sm">
          Temps : {{ formatTime(wodTimer.elapsed) }}
        </p>
        <button @click="finishAndContinue"
          class="w-full py-3 rounded-xl font-semibold text-white"
          style="background:#639922">
          Continuer la séance
        </button>
      </div>
    </div>

    <!-- Confirm stop -->
    <div v-if="confirmStop" class="fixed inset-0 bg-black/70 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="confirmStop = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Arrêter le WOD ?</h3>
        <p class="text-sm text-gray-400 mb-5">La progression sera perdue.</p>
        <div class="flex gap-3">
          <button @click="confirmStop = false" class="btn-ghost flex-1 text-sm py-2">Continuer</button>
          <button @click="stopWod" class="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium">Arrêter</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useWodTimerStore } from '@/stores/wodTimer'
import { useWakeLock } from '@/composables/useWakeLock'
import { describePrescription } from '@/lib/units'

const router = useRouter()
const session = useSessionStore()
const wodTimer = useWodTimerStore()
const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock()
const confirmStop = ref(false)

const wodItems = computed(() =>
  session.orderedItems.filter(i => i.section === 'wod')
)

const wodModeLabel = computed(() => ({
  amrap: 'AMRAP', emom: 'EMOM', fortime: 'For Time', tabata: 'Tabata', interval: 'Intervalles'
}[session.workout?.wod_mode] || ''))

const modeBigLabel = computed(() => {
  const m = session.workout?.wod_mode
  const c = session.workout?.wod_config || {}
  if (m === 'amrap') return `AMRAP ${Math.floor(c.totalSeconds / 60)}'`
  if (m === 'emom') return `EMOM ${c.rounds}`
  if (m === 'fortime') return c.cap > 0 ? `FOR TIME (cap ${Math.floor(c.cap / 60)}')` : 'FOR TIME'
  if (m === 'tabata') return `TABATA × ${c.rounds}`
  if (m === 'interval') return `${c.workSeconds}s/${c.restSeconds}s × ${c.rounds}`
  return ''
})

const modeSubLabel = computed(() => {
  const m = session.workout?.wod_mode
  const c = session.workout?.wod_config || {}
  if (m === 'amrap') return 'As Many Rounds As Possible'
  if (m === 'emom') return `Toutes les ${formatInterval(c.intervalSeconds || 60)}`
  if (m === 'fortime') return c.cap > 0 ? 'Le plus vite possible' : 'À ton rythme'
  if (m === 'tabata') return `${c.workSeconds}s effort / ${c.restSeconds}s repos`
  if (m === 'interval') return `${c.rounds} rounds`
  return ''
})

const mainTime = computed(() => {
  if (wodTimer.mode === 'fortime' && wodTimer.phase === 'work') {
    return formatTime(wodTimer.elapsed)
  }
  return wodTimer.phaseTimeLabel
})

// Timer color : green by default for visibility, red for last seconds, white when between
const timerColor = computed(() => {
  if (wodTimer.phase === 'countdown' || wodTimer.phase === 'between') return '#fff'
  if (wodTimer.phase === 'rest') return '#FCD34D'  // amber
  if (wodTimer.phaseRemaining > 0 && wodTimer.phaseRemaining <= 3) return '#FCA5A5'  // red on last 3s
  return '#86EFAC'  // green default for visibility
})

const timerBg = computed(() => {
  if (wodTimer.phase === 'countdown') return '#1a1a2e'
  if (wodTimer.phase === 'between' || wodTimer.phase === 'rest') return '#854F0B'
  if (wodTimer.finished) return '#0F6E56'
  return '#0a2a1f'  // dark green to make the green chrono pop
})

function startWod() {
  if (!session.workout?.wod_mode || !session.workout?.wod_config) return
  wodTimer.start(session.workout.wod_mode, [session.workout.wod_config], 0)
  requestWakeLock()
}

function togglePause() {
  if (wodTimer.paused) wodTimer.resume()
  else wodTimer.pause()
}

function stopWod() {
  wodTimer.reset()
  releaseWakeLock()
  confirmStop.value = false
}

function finishAndContinue() {
  wodTimer.reset()
  releaseWakeLock()
  // Mark all WOD sets as done
  wodItems.value.forEach(item => {
    session.getSetsForExercise(item.exercise_id).forEach(s => { s.done = true })
  })
  router.back()
}

function goBack() {
  if (wodTimer.running) confirmStop.value = true
  else router.back()
}

function formatTime(sec) {
  if (sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatInterval(sec) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (s === 0) return `${m} min`
  return `${m}min${s}s`
}

onUnmounted(() => {
  releaseWakeLock()
})
</script>
