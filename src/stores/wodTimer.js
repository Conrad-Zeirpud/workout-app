import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { handleCountdownTick, beepTransition, beepGo, vibrateLong } from '@/lib/sound'

// Modes : 'amrap' | 'emom' | 'fortime' | 'tabata' | 'interval' | null
// Sequence : array of timer configs, each one is the same mode, separated by rest periods.
//   ex: [{ totalSeconds: 720 }, { totalSeconds: 300 }] for 2 AMRAPs
//   `restBetween` = seconds of rest between segments

export const useWodTimerStore = defineStore('wodTimer', () => {
  const mode = ref(null)
  const sequence = ref([])      // array of segment configs
  const restBetween = ref(0)    // seconds between segments
  const segmentIndex = ref(0)
  const config = ref({})        // current segment config

  const running = ref(false)
  const paused = ref(false)
  const finished = ref(false)

  const elapsed = ref(0)        // elapsed in current segment
  const phase = ref('idle')     // 'countdown' | 'work' | 'rest' | 'between' | 'done'
  const phaseRemaining = ref(0)
  const currentRound = ref(0)
  const rounds = ref(0)         // user-incremented for AMRAP
  const segmentRounds = ref([]) // history of rounds per segment (for AMRAP recap)

  const PREP_SECONDS = 10       // fixed prep countdown

  let tickInterval = null
  const { settings } = useSettings()

  function start(m, seq, restBtw = 0) {
    stop()
    mode.value = m
    sequence.value = seq
    restBetween.value = restBtw
    segmentIndex.value = 0
    config.value = { ...seq[0] }
    running.value = true
    paused.value = false
    finished.value = false
    elapsed.value = 0
    currentRound.value = 0
    rounds.value = 0
    segmentRounds.value = []

    phase.value = 'countdown'
    phaseRemaining.value = PREP_SECONDS
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
    sequence.value = []
    config.value = {}
    elapsed.value = 0
    currentRound.value = 0
    rounds.value = 0
    segmentIndex.value = 0
    segmentRounds.value = []
  }

  function incrementRound() {
    if (mode.value === 'amrap' && phase.value === 'work') {
      rounds.value++
      beepTransition()
    }
  }

  function _startTicking() {
    tickInterval = setInterval(() => {
      if (paused.value) return

      // Countdown phase (10..1..GO)
      if (phase.value === 'countdown') {
        phaseRemaining.value--
        handleCountdownTick(phaseRemaining.value, settings)
        if (phaseRemaining.value <= 0) _startSegment()
        return
      }

      // Between segments (rest)
      if (phase.value === 'between') {
        phaseRemaining.value--
        handleCountdownTick(phaseRemaining.value, settings)
        if (phaseRemaining.value <= 0) {
          // Move to next segment
          segmentIndex.value++
          config.value = { ...sequence.value[segmentIndex.value] }
          // Reset segment-level state but keep total elapsed
          rounds.value = 0
          currentRound.value = 0
          phase.value = 'countdown'
          phaseRemaining.value = PREP_SECONDS
          if (settings.sound) beepTransition()
        }
        return
      }

      // Main phase
      elapsed.value++

      if (mode.value === 'amrap') {
        phaseRemaining.value--
        handleCountdownTick(phaseRemaining.value, settings)
        if (phaseRemaining.value <= 0) _segmentDone()
      }
      else if (mode.value === 'emom') {
        const interval = config.value.intervalSeconds || 60
        phaseRemaining.value--
        handleCountdownTick(phaseRemaining.value, settings)
        if (phaseRemaining.value <= 0) {
          currentRound.value++
          if (currentRound.value >= config.value.rounds) {
            _segmentDone()
          } else {
            phaseRemaining.value = interval
            if (settings.sound) beepTransition()
          }
        }
      }
      else if (mode.value === 'fortime') {
        // Chrono monte (elapsed). phaseRemaining = cap restant si cap > 0
        if (config.value.cap > 0) {
          phaseRemaining.value--
          if (phaseRemaining.value <= 0) _segmentDone()
        }
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
              _segmentDone()
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
              _segmentDone()
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

  function _startSegment() {
    if (mode.value === 'amrap') {
      phase.value = 'work'
      phaseRemaining.value = config.value.totalSeconds
    } else if (mode.value === 'emom') {
      phase.value = 'work'
      phaseRemaining.value = config.value.intervalSeconds || 60
      currentRound.value = 0
      if (settings.sound) beepTransition()
    } else if (mode.value === 'fortime') {
      phase.value = 'work'
      elapsed.value = 0
      phaseRemaining.value = config.value.cap > 0 ? config.value.cap : 0
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

  function _segmentDone() {
    // Save AMRAP rounds for recap
    if (mode.value === 'amrap') {
      segmentRounds.value.push(rounds.value)
    }
    // Check if there's another segment
    const hasNext = segmentIndex.value < sequence.value.length - 1
    if (hasNext && restBetween.value > 0) {
      phase.value = 'between'
      phaseRemaining.value = restBetween.value
      if (settings.sound) beepTransition()
    } else if (hasNext) {
      // No rest between, start next segment immediately
      segmentIndex.value++
      config.value = { ...sequence.value[segmentIndex.value] }
      rounds.value = 0
      currentRound.value = 0
      phase.value = 'countdown'
      phaseRemaining.value = PREP_SECONDS
    } else {
      _finish()
    }
  }

  function finishForTime() {
    // Manual finish for For Time mode
    if (mode.value === 'fortime' && phase.value === 'work') {
      _segmentDone()
    }
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
    if (phase.value === 'between') return 'Récup entre timers'
    if (phase.value === 'work') {
      if (mode.value === 'tabata' || mode.value === 'interval') return 'Effort'
      return 'En cours'
    }
    if (phase.value === 'rest') return 'Repos'
    if (phase.value === 'done') return 'Terminé'
    return ''
  })

  const totalTimeLabel = computed(() => _formatTime(elapsed.value))
  const phaseTimeLabel = computed(() => _formatTime(phaseRemaining.value))
  const isMultiSegment = computed(() => sequence.value.length > 1)
  const segmentLabel = computed(() => {
    if (!isMultiSegment.value) return ''
    return `Timer ${segmentIndex.value + 1} / ${sequence.value.length}`
  })

  function _formatTime(sec) {
    if (sec < 0) sec = 0
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return {
    mode, config, sequence, segmentIndex, restBetween,
    running, paused, finished,
    elapsed, phase, phaseRemaining, currentRound, rounds, segmentRounds,
    phaseLabel, totalTimeLabel, phaseTimeLabel, isMultiSegment, segmentLabel,
    PREP_SECONDS,
    start, pause, resume, stop, reset, incrementRound, finishForTime
  }
})
