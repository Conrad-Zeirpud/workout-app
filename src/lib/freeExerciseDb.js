// Wrapper pour le dataset free-exercise-db
// Source : https://github.com/yuhonas/free-exercise-db
// Domaine public, 800+ exos avec images (souvent 2 par exo)

const DATASET_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

let cachedDataset = null
let fetchPromise = null

export async function fetchDataset() {
  if (cachedDataset) return cachedDataset
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch(DATASET_URL)
    .then(res => {
      if (!res.ok) throw new Error('Impossible de télécharger le dataset')
      return res.json()
    })
    .then(data => {
      cachedDataset = data
      cachedDataset._index = data.map(ex => ({
        ...ex,
        _normalized: normalize(ex.name)
      }))
      fetchPromise = null
      return cachedDataset
    })
    .catch(e => {
      fetchPromise = null
      throw e
    })

  return fetchPromise
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a, b) {
  if (!a || !b) return 0
  if (a === b) return 1
  const aWords = new Set(a.split(' '))
  const bWords = new Set(b.split(' '))
  if (aWords.size === 0 || bWords.size === 0) return 0
  let intersection = 0
  for (const w of aWords) if (bWords.has(w)) intersection++
  const union = aWords.size + bWords.size - intersection
  return intersection / union
}

/**
 * Cherche le meilleur match.
 * Retourne { name, imageUrls (array de 1 ou 2 URLs), externalId, score } ou null
 */
export async function searchInDataset(name) {
  if (!name) return null

  let dataset
  try {
    dataset = await fetchDataset()
  } catch {
    return null
  }

  const normalizedQuery = normalize(name)
  if (!normalizedQuery) return null

  let best = null
  let bestScore = 0
  for (const ex of dataset._index) {
    const score = similarity(normalizedQuery, ex._normalized)
    if (score > bestScore) {
      bestScore = score
      best = ex
    }
  }

  if (!best || bestScore < 0.5) return null
  if (!best.images || best.images.length === 0) return null

  // Retourne TOUTES les images (généralement 2)
  const imageUrls = best.images.map(p => IMAGE_BASE + p)

  return {
    name: best.name,
    imageUrls,
    externalId: best.id,
    score: bestScore
  }
}
