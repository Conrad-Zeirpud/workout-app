// Logique de matching d'intention pour le bot
// Combine : matching exact mots-clés + similarité Jaccard + bonus catégorie

import { BOT_KNOWLEDGE } from './botKnowledge'

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(s) {
  const norm = normalize(s)
  if (!norm) return []
  return norm.split(' ').filter(t => t.length > 1)  // ignore tokens mono-char
}

// Mots vides peu informatifs (réduisent les faux positifs)
const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'd',
  'et', 'ou', 'a', 'au', 'aux', 'en', 'dans', 'sur', 'par',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'qu', 'que', 'qui', 'quoi', 'comment', 'pourquoi', 'quand',
  'est', 'sont', 'suis', 'es', 'etes', 'sera', 'serait',
  'avoir', 'ai', 'as', 'avez', 'ont', 'avait',
  'faire', 'fait', 'faut', 'falloir',
  'pas', 'plus', 'moins', 'tres', 'bien', 'aussi', 'meme'
])

function meaningful(tokens) {
  return tokens.filter(t => !STOP_WORDS.has(t))
}

/**
 * Calcule un score de match entre input et entry
 */
function scoreEntry(inputTokens, entry) {
  const queryTokens = meaningful(inputTokens)
  if (queryTokens.length === 0) return 0

  // Tokens de référence : keywords + question
  const keywordTokens = entry.keywords
    .flatMap(k => tokenize(k))
    .filter(t => !STOP_WORDS.has(t))
  const questionTokens = meaningful(tokenize(entry.question))
  const allRefTokens = new Set([...keywordTokens, ...questionTokens])

  // 1. Match exact d'un keyword complet (gros bonus)
  let keywordExactBonus = 0
  const inputJoined = queryTokens.join(' ')
  for (const kw of entry.keywords) {
    const kwNorm = normalize(kw)
    if (inputJoined.includes(kwNorm) || kwNorm.includes(inputJoined)) {
      keywordExactBonus = 0.5
      break
    }
  }

  // 2. Score Jaccard sur les tokens
  let intersection = 0
  for (const t of queryTokens) {
    if (allRefTokens.has(t)) intersection++
  }
  const jaccard = intersection / Math.max(queryTokens.length, 1)

  return jaccard + keywordExactBonus
}

/**
 * Trouve la meilleure entrée correspondant à l'input.
 * Retourne { entry, score, alternatives } ou null si rien ne match suffisamment.
 */
export function findBestMatch(input) {
  if (!input || !input.trim()) return null
  const inputTokens = tokenize(input)
  if (inputTokens.length === 0) return null

  const scored = BOT_KNOWLEDGE
    .map(entry => ({ entry, score: scoreEntry(inputTokens, entry) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return null
  if (scored[0].score < 0.3) return null  // seuil de confiance

  return {
    entry: scored[0].entry,
    score: scored[0].score,
    alternatives: scored.slice(1, 4).map(s => s.entry)  // 3 suggestions secondaires
  }
}

/**
 * Récupère toutes les entrées d'une catégorie
 */
export function getEntriesByCategory(categoryId) {
  return BOT_KNOWLEDGE.filter(e => e.category === categoryId)
}
