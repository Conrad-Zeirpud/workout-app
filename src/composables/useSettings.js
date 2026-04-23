import { reactive, watch } from 'vue'

const STORAGE_KEY = 'workout_settings'

const defaults = {
  vibration: true,
  sound: true,
  unit: 'kg'
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
  } catch {
    return { ...defaults }
  }
}

const settings = reactive(load())

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* ignore */ }
}

watch(settings, save, { deep: true })

export function useSettings() {
  return { settings, save }
}
