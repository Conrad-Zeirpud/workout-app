<template>
  <div class="min-h-screen flex flex-col" :style="`background:${bgColor}`">
    <div class="flex items-center justify-between px-4 pt-12 pb-4">
      <button @click="confirmStop = true" class="text-white/70 text-sm px-2 py-1">✕ Quitter</button>
      <div class="text-center flex-1">
        <p class="text-white font-semibold uppercase text-sm tracking-wide">{{ modeLabel }}</p>
        <p v-if="wod.isMultiSegment" class="text-white/50 text-xs mt-0.5">{{ wod.segmentLabel }}</p>
      </div>
      <button @click="togglePause" class="text-white/70 text-sm px-2 py-1">
        {{ wod.paused ? '▶' : '⏸' }}
      </button>
    </div>

    <div class="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <p class="text-white/60 text-lg font-medium uppercase tracking-widest mb-6">
        {{ wod.phaseLabel }}
      </p>

      <!-- Big chrono in GREEN -->
      <div class="font-bold font-mono leading-none mb-8"
        :style="`font-size:8rem; letter-spacing:-4px; color:${chronoColor}`">
        {{ mainTime }}
      </div>

      <div v-if="wod.phase === 'countdown'" class="text-white/70 text-xl font-medium">
        Préparez-vous…
      </div>

      <div v-else-if="wod.phase === 'between'" class="text-white/70 text-base">
        Repos avant le timer suivant
      </div>

      <div v-else-if="wod.mode === 'amrap'" class="flex flex-col items-center gap-4">
        <div class="text-white text-5xl font-bold">{{ wod.rounds }}</div>
        <div class="text-white/70 text-sm">Rounds</div>
        <button @click="wod.incrementRound()"
          class="bg-white text-gray-900 rounded-full w-24 h-24 text-5xl font-bold shadow-xl active:scale-95 transition-transform mt-4">
          +
        </button>
      </div>

      <div v-else-if="wod.mode === 'emom'" class="text-center">
        <div class="text-white text-4xl font-bold">{{ wod.currentRound + 1 }} / {{ wod.config.rounds }}</div>
        <div class="text-white/70 text-sm mt-1">Round</div>
        <div class="text-white/50 text-xs mt-2">Intervalle : {{ formatInterval(wod.config.intervalSeconds) }}</div>
      </div>

      <div v-else-if="wod.mode === 'fortime' && wod.phase === 'work'" class="text-center">
        <div v-if="wod.config.cap > 0" class="text-white/70 text-sm mb-3">
          Cap : {{ formatTime(wod.config.cap) }} (reste {{ formatTime(wod.phaseRemaining) }})
        </div>
        <div v-else class="text-white/70 text-sm mb-3">Sans limite</div>
        <button @click="wod.finishForTime()"
          class="bg-white text-gray-900 rounded-xl px-8 py-3 font-semibold mt-2 active:scale-95 transition-transform">
          🏁 Stop
        </button>
      </div>

      <div v-else-if="wod.mode === 'tabata' || wod.mode === 'interval'" class="text-center">
        <div class="text-white text-4xl font-bold">{{ wod.currentRound + 1 }} / {{ wod.config.rounds }}</div>
        <div class="text-white/70 text-sm mt-1">Round</div>
      </div>

      <div v-if="wod.finished" class="text-center mt-4">
        <div class="text-white text-2xl font-bold mb-2">🏆 Terminé !</div>
        <div v-if="wod.mode === 'amrap' && wod.segmentRounds.length > 0" class="text-white text-base">
          <span v-if="wod.segmentRounds.length === 1">{{ wod.segmentRounds[0] }} rounds</span>
          <div v-else class="space-y-1">
            <div v-for="(r, i) in wod.segmentRounds" :key="i">
              Timer {{ i + 1 }} : {{ r }} rounds
            </div>
          </div>
        </div>
        <button @click="goBack"
          class="bg-white text-gray-900 rounded-xl px-8 py-3 font-semibold mt-6 active:scale-95 transition-transform">
          Retour
        </button>
      </div>
    </div>

    <div v-if="wod.paused && !wod.finished" class="absolute inset-0 bg-black/60 flex items-center justify-center">
      <div class="text-center">
        <p class="text-white text-3xl font-bold mb-4">⏸ Pause</p>
        <button @click="wod.resume()"
          class="bg-white text-gray-900 rounded-xl px-8 py-3 font-semibold">Reprendre</button>
      </div>
    </div>

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

const mainTime = computed(() => {
  if (wod.mode === 'fortime' && wod.phase === 'work') {
    return formatTime(wod.elapsed)
  }
  return wod.phaseTimeLabel
})

// Chrono COLOR : green by default, red on last 3s, white during countdown
const chronoColor = computed(() => {
  if (wod.phase === 'countdown') return '#fff'
  if (wod.phase === 'between' || wod.phase === 'rest') return '#FCD34D'
  if (wod.phaseRemaining > 0 && wod.phaseRemaining <= 3) return '#FCA5A5'
  if (wod.finished) return '#86EFAC'
  return '#86EFAC'  // green
})

// Background : navy countdown, ambre rest/between, dark green during work, teal done
const bgColor = computed(() => {
  if (wod.phase === 'countdown') return '#1a1a2e'
  if (wod.phase === 'between') return '#854F0B'
  if (wod.phase === 'rest') return '#854F0B'
  if (wod.phase === 'done' || wod.finished) return '#0F6E56'
  return '#0a2a1f'  // dark green to make green chrono pop
})

function togglePause() {
  if (wod.paused) wod.resume()
  else wod.pause()
}

function stopAndExit() {
  wod.reset()
  router.push('/timer')
}

function goBack() {
  wod.reset()
  router.push('/timer')
}

function formatTime(sec) {
  if (sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatInterval(sec) {
  if (!sec) return ''
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (s === 0) return `${m} min`
  return `${m}min${s}s`
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
