<template>
  <transition name="overlay">
    <div v-if="session.restActive"
      class="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 px-6"
      style="background: rgba(15, 20, 30, 0.97); backdrop-filter: blur(8px);"
      @click.self="session.stopRest()">

      <p class="text-white/80 text-sm font-semibold tracking-widest uppercase">Temps de repos</p>

      <div class="relative">
        <TimerRing
          :current="session.restTimer"
          :max="restMax"
          :size="220"
          :stroke="14"
          :text-color="chronoColor"
          ring-color="#86EFAC"
        />
        <div v-if="session.restTimer <= 3 && session.restTimer > 0"
          class="absolute inset-0 rounded-full pointer-events-none animate-pulse"
          style="box-shadow: 0 0 80px 20px rgba(252, 165, 165, 0.5);" />
      </div>

      <div class="text-center bg-white/5 rounded-2xl px-6 py-4 border border-white/10">
        <p class="text-white/50 text-xs uppercase tracking-wide mb-1">Prochain exercice</p>
        <p class="text-white font-semibold text-lg">{{ nextExerciseName || '—' }}</p>
      </div>

      <div class="flex gap-3 mt-2">
        <button @click="addTime(-15)"
          class="px-5 py-3 rounded-2xl bg-white/10 text-white text-sm font-semibold active:scale-95 transition-transform">
          −15s
        </button>
        <button @click="session.stopRest()"
          class="px-8 py-3 rounded-2xl bg-white text-gray-900 text-sm font-bold active:scale-95 transition-transform">
          Passer
        </button>
        <button @click="addTime(15)"
          class="px-5 py-3 rounded-2xl bg-white/10 text-white text-sm font-semibold active:scale-95 transition-transform">
          +15s
        </button>
      </div>

      <div class="text-white/30 text-xs mt-4">Tape hors du cercle pour passer</div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import TimerRing from '@/components/ui/TimerRing.vue'
import { useSessionStore } from '@/stores/session'
import { useSettings } from '@/composables/useSettings'
import { handleCountdownTick } from '@/lib/sound'

defineProps({ nextExerciseName: String })

const session = useSessionStore()
const { settings } = useSettings()
const restMax = ref(90)

const chronoColor = computed(() => {
  if (session.restTimer > 0 && session.restTimer <= 3) return '#FCA5A5'  // red on last 3s
  return '#86EFAC'  // green default
})

function addTime(seconds) {
  session.restTimer = Math.max(1, session.restTimer + seconds)
  if (seconds > 0) restMax.value = Math.max(restMax.value, session.restTimer)
}

watch(() => session.restActive, (active) => {
  if (active) restMax.value = session.restTimer
})

watch(() => session.restTimer, (val) => {
  if (session.restActive) {
    handleCountdownTick(val, settings)
  }
})
</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.3s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.animate-pulse { animation: pulseGlow 1s ease-in-out infinite; }
@keyframes pulseGlow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
