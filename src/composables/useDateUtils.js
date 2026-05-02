// Utilitaires de date partagés à travers l'app
// Évite la duplication de code dans plusieurs vues

/**
 * Convertit une Date ou un string en YYYY-MM-DD (timezone locale)
 */
export function toDateStr(date) {
  if (typeof date === 'string') return date.slice(0, 10)
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Format relatif "il y a X" pour des dates récentes
 */
export function formatRelative(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'à l\'instant'
  if (diffMin < 60) return `il y a ${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `il y a ${diffD}j`
  return d.toLocaleDateString('fr', { day: '2-digit', month: '2-digit' })
}

/**
 * Format jour de semaine + jour + mois ("lun. 5 mai")
 */
export function formatShortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('fr', { weekday: 'short', day: 'numeric', month: 'short' })
}

/**
 * Format complet ("lundi 5 mai 2026")
 */
export function formatLongDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Format durée en secondes → "MM:SS" ou "HH:MM:SS"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Format durée courte type "45min" ou "1h30"
 */
export function formatDurationShort(seconds) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  const remM = m % 60
  if (remM === 0) return `${h}h`
  return `${h}h${String(remM).padStart(2, '0')}`
}

/**
 * Vrai si la date est aujourd'hui
 */
export function isToday(dateStr) {
  return toDateStr(dateStr) === toDateStr(new Date())
}
