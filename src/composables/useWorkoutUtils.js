import { useSettings } from './useSettings'

export function useWorkoutUtils() {
  const { settings } = useSettings()

  function formatWeight(kg) {
    if (settings.unit === 'lbs') return `${Math.round(kg * 2.20462)} lbs`
    return `${kg} kg`
  }

  function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '—'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}min`
    if (m > 0) return `${m}min ${s > 0 ? s + 's' : ''}`
    return `${s}s`
  }

  function formatDate(iso, opts = {}) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('fr', {
      day: '2-digit', month: '2-digit', year: '2-digit', ...opts
    })
  }

  function muscleGroupColor(group) {
    const map = {
      'Pectoraux': '#E6F1FB', 'Dos': '#EAF3DE', 'Épaules': '#EEEDFE',
      'Biceps': '#FAEEDA', 'Triceps': '#FAECE7', 'Jambes': '#E1F5EE',
      'Fessiers': '#FBEAF0', 'Abdominaux': '#F1EFE8', 'Full Body': '#FCEBEB', 'Cardio': '#EAF3DE'
    }
    return map[group] || '#F1EFE8'
  }

  function estimatedDuration(workoutItems) {
    if (!workoutItems?.length) return 0
    return workoutItems.reduce((acc, item) => {
      const setTime = item.sets * (item.reps * 3)
      const restTime = (item.sets - 1) * (item.rest_seconds || 90)
      return acc + setTime + restTime
    }, 0)
  }

  return { formatWeight, formatDuration, formatDate, muscleGroupColor, estimatedDuration }
}
