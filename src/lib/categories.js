export const WORKOUT_CATEGORIES = [
  { value: 'athx',     label: 'ATHX',     color: '#378ADD', bg: '#E6F1FB', text: '#0C447C', icon: '⚡' },
  { value: 'renfo',    label: 'Renfo',    color: '#639922', bg: '#EAF3DE', text: '#3B6D11', icon: '💪' },
  { value: 'hyrox',    label: 'Hyrox',    color: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', icon: '🏃' },
  { value: 'crossfit', label: 'CrossFit', color: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D', icon: '🔥' },
  { value: 'cardio',   label: 'Cardio',   color: '#D946A0', bg: '#FCEBF4', text: '#891B5F', icon: '❤️' },
  { value: 'mobility', label: 'Mobilité', color: '#1D9E75', bg: '#E1F5EE', text: '#085041', icon: '🧘' },
  { value: 'other',    label: 'Autre',    color: '#888780', bg: '#F1EFE8', text: '#444441', icon: '🏋️' },
]

export function getCategory(value) {
  return WORKOUT_CATEGORIES.find(c => c.value === value) || WORKOUT_CATEGORIES[6]
}
