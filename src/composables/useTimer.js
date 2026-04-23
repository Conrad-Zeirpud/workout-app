import { ref, computed } from 'vue'
import { useSettings } from './useSettings'

export function useTimer() {
  const { settings } = useSettings()
  const current = ref(0)
  const max = ref(0)
  const running = ref(false)
  let interval = null

  const pct = computed(() => max.value > 0 ? current.value / max.value : 0)
  const formatted = computed(() => {
    const m = Math.floor(current.value / 60)
    const s = current.value % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })

  function start(seconds) {
    stop()
    max.value = seconds
    current.value = seconds
    running.value = true
    interval = setInterval(() => {
      if (current.value <= 0) {
        stop()
        _onFinish()
        return
      }
      current.value--
    }, 1000)
  }

  function stop() {
    clearInterval(interval)
    running.value = false
  }

  function reset() {
    stop()
    current.value = 0
    max.value = 0
  }

  function _onFinish() {
    if (settings.vibration && navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }
    if (settings.sound) {
      _beep()
    }
  }

  function _beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
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
    } catch { /* AudioContext not available */ }
  }

  return { current, max, running, pct, formatted, start, stop, reset }
}
