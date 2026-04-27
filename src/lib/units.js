// Configuration of exercise units
// Each unit defines : label, primary input, default value, what to display

export const EXERCISE_UNITS = {
  weight: {
    label: 'Poids',
    icon: '🏋️',
    fields: ['reps', 'weight'],
    defaultReps: 10,
    defaultWeight: 0,
    displayShort: (set) => `${set.reps_done || 0} × ${set.weight_kg || 0}kg`,
    promptFormat: '× {reps} reps @ {weight}kg'
  },
  reps: {
    label: 'Répétitions',
    icon: '🔢',
    fields: ['reps'],
    defaultReps: 10,
    defaultWeight: 0,
    displayShort: (set) => `${set.reps_done || 0} reps`,
    promptFormat: '× {reps} reps'
  },
  calories: {
    label: 'Calories',
    icon: '🔥',
    fields: ['calories'],
    defaultReps: 10,    // stocké en reps_done sous forme de calories
    defaultWeight: 0,
    displayShort: (set) => `${set.reps_done || 0} cal`,
    promptFormat: '{cals} cal'
  },
  meters: {
    label: 'Distance',
    icon: '🏃',
    fields: ['meters'],
    defaultReps: 400,   // stocké en reps_done sous forme de mètres
    defaultWeight: 0,
    displayShort: (set) => `${set.reps_done || 0}m`,
    promptFormat: '{meters}m'
  },
  seconds: {
    label: 'Durée',
    icon: '⏱',
    fields: ['seconds'],
    defaultReps: 30,    // stocké en reps_done sous forme de secondes
    defaultWeight: 0,
    displayShort: (set) => formatDuration(set.reps_done),
    promptFormat: '{seconds}s'
  }
}

export function getUnit(unit) {
  return EXERCISE_UNITS[unit] || EXERCISE_UNITS.weight
}

export function formatDuration(sec) {
  if (!sec) return '0s'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}min${s}` : `${m}min`
}

// For displaying an exercise prescription (the target written in the workout)
export function describePrescription(item) {
  const unit = item.exercise?.unit || 'weight'
  const { sets, reps, weight_kg } = item
  const setsLabel = sets > 1 ? `${sets} × ` : ''
  if (unit === 'weight') {
    return `${setsLabel}${reps} reps${weight_kg > 0 ? ` @ ${weight_kg}kg` : ''}`
  }
  if (unit === 'reps') return `${setsLabel}${reps} reps`
  if (unit === 'calories') return `${setsLabel}${reps} cal`
  if (unit === 'meters') return `${setsLabel}${reps}m`
  if (unit === 'seconds') return `${setsLabel}${formatDuration(reps)}`
  return `${setsLabel}${reps}`
}
