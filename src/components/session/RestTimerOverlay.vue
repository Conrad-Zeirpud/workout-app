<template>
  <transition name="overlay">
    <div v-if="session.restActive"
      class="fixed inset-0 bg-black/75 z-30 flex flex-col items-center justify-center gap-5 px-6"
      @click.self="session.stopRest()">
      <p class="text-white/60 text-sm font-medium tracking-wide uppercase">Temps de repos</p>

      <TimerRing :current="session.restTimer" :max="restMax" :size="170" :stroke="11" label="restant" />

      <div class="text-center">
        <p class="text-white/50 text-sm">Prochain exercice</p>
        <p class="text-white font-semibold mt-0.5">{{ nextExerciseName || '—' }}</p>
      </div>

      <div class="flex gap-3 mt-2">
        <button @click="addTime(-15)"
          class="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium">−15s</button>
        <button @click="session.stopRest()"
          class="px-6 py-2 rounded-xl bg-white text-gray-900 text-sm font-medium">Passer</button>
        <button @click="addTime(15)"
          class="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium">+15s</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import TimerRing from '@/components/ui/TimerRing.vue'
import { useSessionStore } from '@/stores/session'
import { useSettings } from '@/composables/useSettings'

defineProps({ nextExerciseName: String })

const session = useSessionStore()
const { settings } = useSettings()
const restMax = ref(90)

function addTime(seconds) {
  session.restTimer = Math.max(1, session.restTimer + seconds)
  if (seconds > 0) restMax.value = Math.max(restMax.value, session.restTimer)
}

// Track max when rest starts (for ring progress calculation)
watch(() => session.restActive, (active) => {
  if (active) restMax.value = session.restTimer
})

// Trigger sound/vibration when countdown hits zero
watch(() => session.restTimer, (val, old) => {
  if (session.restActive && old > 0 && val === 0) {
    if (settings.vibration && navigator.vibrate) navigator.vibrate([200, 100, 200])
    if (settings.sound) _beep()
  }
})

function _beep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch { /* ignore */ }
}
</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.25s; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
</style>
