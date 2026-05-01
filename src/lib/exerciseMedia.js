// Helpers médias d'exercices

import { searchInDataset } from './freeExerciseDb'

/**
 * Cherche un exercice. Retourne { gifUrl (la 1re), imageUrls (toutes), externalId, name } ou null.
 */
export async function searchExerciseDB(name) {
  if (!name) return null
  try {
    const result = await searchInDataset(name)
    if (!result) return null
    return {
      gifUrl: result.imageUrls[0],     // pour compat avec l'ancien code
      imageUrls: result.imageUrls,     // tableau complet
      externalId: result.externalId,
      name: result.name
    }
  } catch (e) {
    console.warn('Free Exercise DB search failed', e)
    return null
  }
}

export function youtubeToEmbed(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return `https://www.youtube.com/embed/${m[1]}`
  }
  return null
}

export function detectMediaType(url) {
  if (!url) return null
  if (youtubeToEmbed(url)) return 'youtube'
  if (/\.gif(\?|$)/i.test(url)) return 'gif'
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return 'image'
  return 'image'
}

/**
 * Parse une media_url et retourne TOUJOURS un tableau d'URLs.
 * - URL simple → [url]
 * - JSON array → tableau parsé
 * - URL de free-exercise-db finissant par /0.jpg → essaie aussi /1.jpg automatiquement
 */
export function parseMediaUrls(mediaUrl) {
  if (!mediaUrl) return []

  // Cas JSON array : ["url1", "url2"]
  if (mediaUrl.startsWith('[')) {
    try {
      const arr = JSON.parse(mediaUrl)
      if (Array.isArray(arr)) return arr.filter(Boolean)
    } catch { /* ignore */ }
  }

  // Cas free-exercise-db avec /0.jpg → on déduit /1.jpg automatiquement
  // Permet aux exos déjà synchronisés de bénéficier de l'animation
  const match = mediaUrl.match(/^(https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\/main\/exercises\/[^/]+\/)(\d+)(\.\w+)$/)
  if (match) {
    const [, prefix, , ext] = match
    return [`${prefix}0${ext}`, `${prefix}1${ext}`]
  }

  // Cas simple : 1 URL
  return [mediaUrl]
}

/**
 * Sérialise un array d'URLs pour stockage en DB.
 * - 1 URL → URL simple (compat ancienne)
 * - 2+ URLs → JSON array
 */
export function serializeMediaUrls(urls) {
  if (!urls || urls.length === 0) return null
  if (urls.length === 1) return urls[0]
  return JSON.stringify(urls)
}
