export const WORKOUT_CATEGORIES = [
  { value: 'push',     label: 'Push',      color: '#378ADD', bg: '#E6F1FB', text: '#0C447C', icon: '💪' },
  { value: 'pull',     label: 'Pull',      color: '#639922', bg: '#EAF3DE', text: '#3B6D11', icon: '🏋️' },
  { value: 'legs',     label: 'Legs',      color: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', icon: '🦵' },
  { value: 'fullbody', label: 'Full Body', color: '#7F77DD', bg: '#EEEDFE', text: '#3C3489', icon: '🔥' },
  { value: 'cardio',   label: 'Cardio',    color: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D', icon: '🏃' },
  { value: 'mobility', label: 'Mobilité',  color: '#1D9E75', bg: '#E1F5EE', text: '#085041', icon: '🧘' },
  { value: 'other',    label: 'Autre',     color: '#888780', bg: '#F1EFE8', text: '#444441', icon: '⚡' },
]

export function getCategory(value) {
  return WORKOUT_CATEGORIES.find(c => c.value === value) || WORKOUT_CATEGORIES[6]
}
