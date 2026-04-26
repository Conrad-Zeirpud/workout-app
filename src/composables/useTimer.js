import { ref, computed } from 'vue'
import { useSettings } from './useSettings'
import { handleCountdownTick } from '@/lib/sound'

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
        return
      }
      current.value--
      // Beep on 3, 2, 1 and GO at 0
      handleCountdownTick(current.value, settings)
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

  return { current, max, running, pct, formatted, start, stop, reset }
}
