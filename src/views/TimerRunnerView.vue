<template>
  <div class="min-h-screen flex flex-col" :style="`background:${bgColor}`">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-12 pb-4">
      <button @click="confirmStop = true" class="text-white/70 text-sm px-2 py-1">✕ Quitter</button>
      <p class="text-white font-semibold uppercase text-sm tracking-wide">{{ modeLabel }}</p>
      <button @click="togglePause" class="text-white/70 text-sm px-2 py-1">
        {{ wod.paused ? '▶' : '⏸' }}
      </button>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <!-- Phase label -->
      <p class="text-white/60 text-lg font-medium uppercase tracking-widest mb-6">
        {{ wod.phaseLabel }}
      </p>

      <!-- Main number -->
      <div class="text-white font-bold font-mono leading-none mb-8"
        style="font-size:8rem; letter-spacing:-4px;">
        {{ wod.phaseTimeLabel }}
      </div>

      <!-- Secondary info -->
      <div v-if="wod.phase === 'countdown'" class="text-white/70 text-xl font-medium">
        Préparez-vous…
      </div>

      <div v-else-if="wod.mode === 'amrap'" class="flex flex-col items-center gap-4">
        <div class="text-white/70 text-sm">Temps total : {{ wod.totalTimeLabel }}</div>
        <div class="text-white text-5xl font-bold">{{ wod.rounds }}</div>
        <div class="text-white/70 text-sm">Rounds</div>
        <button @click="wod.incrementRound()"
          class="bg-white text-gray-900 rounded-full w-24 h-24 text-5xl font-bold shadow-xl active:scale-95 transition-transform mt-4">
          +
        </button>
      </div>

      <div v-else-if="wod.mode === 'emom'" class="text-center">
        <div class="text-white text-4xl font-bold">{{ wod.currentRound + 1 }} / {{ wod.config.rounds }}</div>
        <div class="text-white/70 text-sm mt-1">Minutes</div>
      </div>

      <div v-else-if="wod.mode === 'fortime'" class="text-center">
        <div class="text-white text-2xl font-bold">Chrono : {{ wod.totalTimeLabel }}</div>
        <div v-if="wod.config.cap" class="text-white/70 text-sm mt-1">Cap : {{ formatCap(wod.config.cap) }}</div>
        <button @click="finishForTime"
          class="bg-white text-gray-900 rounded-xl px-8 py-3 font-semibold mt-6 active:scale-95 transition-transform">
          🏁 Stop
        </button>
      </div>

      <div v-else-if="wod.mode === 'tabata' || wod.mode === 'interval'" class="text-center">
        <div class="text-white text-4xl font-bold">{{ wod.currentRound + 1 }} / {{ wod.config.rounds }}</div>
        <div class="text-white/70 text-sm mt-1">Round</div>
        <div class="text-white/50 text-xs mt-2">Temps total : {{ wod.totalTimeLabel }}</div>
      </div>

      <!-- Done screen -->
      <div v-if="wod.finished" class="text-center mt-4">
        <div class="text-white text-2xl font-bold mb-2">🏆 Terminé !</div>
        <div v-if="wod.mode === 'amrap'" class="text-white text-lg">
          {{ wod.rounds }} round{{ wod.rounds > 1 ? 's' : '' }}
        </div>
        <div v-else class="text-white/70 text-sm">Temps total : {{ wod.totalTimeLabel }}</div>
        <button @click="goBack"
          class="bg-white text-gray-900 rounded-xl px-8 py-3 font-semibold mt-6 active:scale-95 transition-transform">
          Retour
        </button>
      </div>
    </div>

    <!-- Paused overlay -->
    <div v-if="wod.paused" class="absolute inset-0 bg-black/60 flex items-center justify-center">
      <div class="text-center">
        <p class="text-white text-3xl font-bold mb-4">⏸ Pause</p>
        <button @click="wod.resume()"
          class="bg-white text-gray-900 rounded-xl px-8 py-3 font-semibold">Reprendre</button>
      </div>
    </div>

    <!-- Confirm stop modal -->
    <div v-if="confirmStop" class="fixed inset-0 bg-black/60 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="confirmStop = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Arrêter le timer ?</h3>
        <p class="text-sm text-gray-400 mb-5">La progression sera perdue.</p>
        <div class="flex gap-3">
          <button @click="confirmStop = false" class="btn-ghost flex-1 text-sm py-2">Continuer</button>
          <button @click="stopAndExit" class="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium">Arrêter</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWodTimerStore } from '@/stores/wodTimer'
import { useWakeLock } from '@/composables/useWakeLock'

const wod = useWodTimerStore()
const router = useRouter()
const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock()
const confirmStop = ref(false)

const modeLabel = computed(() => ({
  amrap: 'AMRAP', emom: 'EMOM', fortime: 'For Time', tabata: 'Tabata', interval: 'Intervalles'
}[wod.mode] || ''))

// Background color : green for work, amber for rest, dark navy for countdown & done
const bgColor = computed(() => {
  if (wod.phase === 'countdown') return '#1a1a2e'
  if (wod.phase === 'rest') return '#854F0B'
  if (wod.phase === 'done' || wod.finished) return '#0F6E56'
  return '#3B6D11'  // work (green)
})

function togglePause() {
  if (wod.paused) wod.resume()
  else wod.pause()
}

function finishForTime() {
  wod.stop()
  wod.finished = true
  wod.phase = 'done'
}

function stopAndExit() {
  wod.reset()
  router.push('/timer')
}

function goBack() {
  wod.reset()
  router.push('/timer')
}

function formatCap(sec) {
  const m = Math.floor(sec / 60)
  return `${m}:00`
}

onMounted(() => {
  if (!wod.running && !wod.finished) { router.push('/timer'); return }
  requestWakeLock()
})

onUnmounted(() => {
  releaseWakeLock()
})
</script>

<style scoped>
.absolute { position: absolute; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
</style>
