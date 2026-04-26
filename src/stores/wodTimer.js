import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { handleCountdownTick, beepTransition, beepGo, vibrateLong } from '@/lib/sound'

// Modes : 'amrap' | 'emom' | 'fortime' | 'tabata' | 'interval' | null
export const useWodTimerStore = defineStore('wodTimer', () => {
  const mode = ref(null)
  const config = ref({})        // mode-specific config
  const running = ref(false)
  const paused = ref(false)
  const finished = ref(false)

  // Time tracking
  const elapsed = ref(0)        // seconds elapsed since start
  const phase = ref('idle')     // 'countdown' | 'work' | 'rest' | 'done'
  const phaseRemaining = ref(0) // seconds left in current phase
  const currentRound = ref(0)
  const rounds = ref(0)         // user-incremented for AMRAP

  let tickInterval = null
  const { settings } = useSettings()

  // ---- Start / Stop / Pause ----
  function start(m, cfg) {
    stop()
    mode.value = m
    config.value = { ...cfg }
    running.value = true
    paused.value = false
    finished.value = false
    elapsed.value = 0
    currentRound.value = 0
    rounds.value = 0

    // All modes start with a 10s prep countdown
    phase.value = 'countdown'
    phaseRemaining.value = cfg.prepSeconds ?? 10
    _startTicking()
  }

  function pause() {
    if (!running.value) return
    paused.value = true
    clearInterval(tickInterval)
  }

  function resume() {
    if (!running.value || !paused.value) return
    paused.value = false
    _startTicking()
  }

  function stop() {
    running.value = false
    paused.value = false
    finished.value = false
    phase.value = 'idle'
    clearInterval(tickInterval)
  }

  function reset() {
    stop()
    mode.value = null
    config.value = {}
    elapsed.value = 0
    currentRound.value = 0
    rounds.value = 0
  }

  function incrementRound() {
    if (mode.value === 'amrap' && phase.value === 'work') {
      rounds.value++
      beepTransition()
    }
  }

  // ---- Core tick loop ----
  function _startTicking() {
    tickInterval = setInterval(() => {
      if (paused.value) return

      // Countdown phase (10..1..GO)
      if (phase.value === 'countdown') {
        phaseRemaining.value--
        handleCountdownTick(phaseRemaining.value, settings)
        if (phaseRemaining.value <= 0) {
          _startMainPhase()
        }
        return
      }

      // Main phase
      elapsed.value++

      if (mode.value === 'amrap') {
        phaseRemaining.value--
        handleCountdownTick(phaseRemaining.value, settings)
        if (phaseRemaining.value <= 0) _finish()
      }
      else if (mode.value === 'emom') {
        phaseRemaining.value--
        handleCountdownTick(phaseRemaining.value, settings)
        if (phaseRemaining.value <= 0) {
          currentRound.value++
          if (currentRound.value >= config.value.rounds) {
            _finish()
          } else {
            phaseRemaining.value = 60
            if (settings.sound) beepTransition()
          }
        }
      }
      else if (mode.value === 'fortime') {
        phaseRemaining.value--  // cap timer (counts down)
        // For Time: chrono monte (elapsed), mais on a aussi un cap
        if (config.value.cap && phaseRemaining.value <= 0) _finish()
      }
      else if (mode.value === 'tabata') {
        phaseRemaining.value--
        handleCountdownTick(phaseRemaining.value, settings)
        if (phaseRemaining.value <= 0) {
          if (phase.value === 'work') {
            phase.value = 'rest'
            phaseRemaining.value = config.value.restSeconds ?? 10
            if (settings.sound) beepTransition()
          } else {
            currentRound.value++
            if (currentRound.value >= (config.value.rounds ?? 8)) {
              _finish()
            } else {
              phase.value = 'work'
              phaseRemaining.value = config.value.workSeconds ?? 20
              if (settings.sound) beepTransition()
            }
          }
        }
      }
      else if (mode.value === 'interval') {
        phaseRemaining.value--
        handleCountdownTick(phaseRemaining.value, settings)
        if (phaseRemaining.value <= 0) {
          if (phase.value === 'work') {
            if (currentRound.value + 1 >= config.value.rounds) {
              _finish()
            } else {
              phase.value = 'rest'
              phaseRemaining.value = config.value.restSeconds
              if (settings.sound) beepTransition()
            }
          } else {
            currentRound.value++
            phase.value = 'work'
            phaseRemaining.value = config.value.workSeconds
            if (settings.sound) beepTransition()
          }
        }
      }
    }, 1000)
  }

  function _startMainPhase() {
    if (mode.value === 'amrap') {
      phase.value = 'work'
      phaseRemaining.value = config.value.totalSeconds
    } else if (mode.value === 'emom') {
      phase.value = 'work'
      phaseRemaining.value = 60
      currentRound.value = 0
      if (settings.sound) beepTransition()
    } else if (mode.value === 'fortime') {
      phase.value = 'work'
      phaseRemaining.value = config.value.cap || 99999
    } else if (mode.value === 'tabata') {
      phase.value = 'work'
      phaseRemaining.value = config.value.workSeconds ?? 20
      currentRound.value = 0
    } else if (mode.value === 'interval') {
      phase.value = 'work'
      phaseRemaining.value = config.value.workSeconds
      currentRound.value = 0
    }
    if (settings.sound) beepGo()
    if (settings.vibration) vibrateLong()
  }

  function _finish() {
    finished.value = true
    phase.value = 'done'
    running.value = false
    clearInterval(tickInterval)
    if (settings.sound) beepGo()
    if (settings.vibration) vibrateLong()
  }

  // ---- Computed for UI ----
  const phaseLabel = computed(() => {
    if (phase.value === 'countdown') return 'Préparation'
    if (phase.value === 'work') {
      if (mode.value === 'tabata') return 'Effort'
      if (mode.value === 'interval') return 'Effort'
      return 'En cours'
    }
    if (phase.value === 'rest') return 'Repos'
    if (phase.value === 'done') return 'Terminé'
    return ''
  })

  const totalTimeLabel = computed(() => _formatTime(elapsed.value))
  const phaseTimeLabel = computed(() => _formatTime(phaseRemaining.value))

  function _formatTime(sec) {
    if (sec < 0) sec = 0
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return {
    mode, config, running, paused, finished,
    elapsed, phase, phaseRemaining, currentRound, rounds,
    phaseLabel, totalTimeLabel, phaseTimeLabel,
    start, pause, resume, stop, reset, incrementRound
  }
})
