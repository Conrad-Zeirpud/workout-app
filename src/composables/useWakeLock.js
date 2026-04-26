import { ref, onUnmounted } from 'vue'

export function useWakeLock() {
  const active = ref(false)
  let sentinel = null

  async function request() {
    if (!('wakeLock' in navigator)) return false
    try {
      sentinel = await navigator.wakeLock.request('screen')
      active.value = true
      sentinel.addEventListener('release', () => { active.value = false })
      return true
    } catch {
      return false
    }
  }

  async function release() {
    if (sentinel) {
      try { await sentinel.release() } catch { /* ignore */ }
      sentinel = null
      active.value = false
    }
  }

  // Re-acquire on visibility change (browser may release on tab blur)
  function handleVisibility() {
    if (document.visibilityState === 'visible' && active.value && !sentinel) {
      request()
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibility)
    release()
  })

  return { active, request, release }
}
