export const WORKOUT_CATEGORIES = [
  { value: 'athx',         label: 'ATHX',         color: '#378ADD', bg: '#E6F1FB', text: '#0C447C', icon: '⚡' },
  { value: 'renfo',        label: 'Renfo',        color: '#639922', bg: '#EAF3DE', text: '#3B6D11', icon: '💪' },
  { value: 'hyrox',        label: 'Hyrox',        color: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', icon: '🏃' },
  { value: 'crossfit',     label: 'CrossFit',     color: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D', icon: '🔥' },
  { value: 'cardio',       label: 'Cardio',       color: '#D946A0', bg: '#FCEBF4', text: '#891B5F', icon: '❤️' },
  { value: 'mobility',     label: 'Mobilité',     color: '#1D9E75', bg: '#E1F5EE', text: '#085041', icon: '🧘' },
  { value: 'force',        label: 'Force',        color: '#1a1a2e', bg: '#E5E5EC', text: '#1a1a2e', icon: '🏋️' },
  { value: 'volume',       label: 'Volume',       color: '#7F77DD', bg: '#EDEBF8', text: '#3D3787', icon: '🧱' },
  { value: 'haltero',      label: 'Haltéro',      color: '#B8860B', bg: '#FAF1D6', text: '#7A5A0A', icon: '🥇' },
  { value: 'conditioning', label: 'Conditioning', color: '#37BFAD', bg: '#DCF4F0', text: '#1A6358', icon: '🔂' },
  { value: 'other',        label: 'Autre',        color: '#888780', bg: '#F1EFE8', text: '#444441', icon: '🏋️' },
]

export function getCategory(value) {
  return WORKOUT_CATEGORIES.find(c => c.value === value)
    || WORKOUT_CATEGORIES.find(c => c.value === 'other')
}
