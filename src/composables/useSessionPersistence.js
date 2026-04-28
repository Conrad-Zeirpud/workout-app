// Persistance de la séance en cours via localStorage
// Expire après 6h pour éviter de proposer de reprendre une vieille séance oubliée

const STORAGE_KEY = 'workout-app:active-session'
const EXPIRY_HOURS = 6

export function useSessionPersistence() {

  function save(snapshot) {
    try {
      const payload = {
        ...snapshot,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (e) {
      // localStorage peut planter (mode privé, quota, etc.) - on ignore
      console.warn('Session persistence save failed', e)
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw)
      // Vérifier expiration
      if (data.savedAt) {
        const ageMs = Date.now() - new Date(data.savedAt).getTime()
        const ageHours = ageMs / (1000 * 60 * 60)
        if (ageHours > EXPIRY_HOURS) {
          clear()
          return null
        }
      }
      return data
    } catch {
      return null
    }
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }

  function hasPending() {
    return load() !== null
  }

  return { save, load, clear, hasPending }
}
