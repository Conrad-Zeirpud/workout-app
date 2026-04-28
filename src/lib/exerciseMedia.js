// Helpers pour récupérer des visuels d'exercices.
// On utilise l'endpoint public ExerciseDB v2 (pas besoin de clé).
// Si l'endpoint est down ou ne trouve rien, on retourne null et l'utilisateur peut coller une URL manuelle.

const EXERCISEDB_BASE = 'https://exercisedb-api.vercel.app/api/v1'

/**
 * Cherche un exercice par nom dans ExerciseDB.
 * Retourne { gifUrl, externalId, name } ou null.
 */
export async function searchExerciseDB(name) {
  if (!name) return null
  try {
    // Endpoint search by name (case insensitive)
    const url = `${EXERCISEDB_BASE}/exercises/search?q=${encodeURIComponent(name)}&offset=0&limit=5`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    })
    if (!res.ok) return null
    const data = await res.json()
    const items = data?.data?.exercises || data?.exercises || data?.data || []
    if (!items || items.length === 0) return null

    // Take the closest match (first result is usually the best)
    const item = items[0]
    return {
      gifUrl: item.gifUrl || item.gif_url || item.imageUrl || null,
      externalId: item.id || item.exerciseId || null,
      name: item.name
    }
  } catch (e) {
    console.warn('ExerciseDB search failed', e)
    return null
  }
}

/**
 * Convertit une URL YouTube (long ou short) en embed URL.
 * Retourne null si ce n'est pas une URL YouTube reconnue.
 */
export function youtubeToEmbed(url) {
  if (!url) return null
  // Patterns possibles :
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://youtube.com/shorts/VIDEO_ID
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

/**
 * Détecte le type de média à partir d'une URL
 */
export function detectMediaType(url) {
  if (!url) return null
  if (youtubeToEmbed(url)) return 'youtube'
  if (/\.gif(\?|$)/i.test(url)) return 'gif'
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return 'image'
  return 'image'  // default fallback
}
