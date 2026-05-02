// Fonction serverless Vercel pour le Coach IA
// Endpoint : POST /api/coach
//
// Sécurité :
//  - La clé Anthropic est lue depuis les env vars (jamais côté client)
//  - Le user_id est vérifié via le token JWT Supabase
//  - Les quotas sont vérifiés côté serveur (5/jour/user)
//
// Variables d'environnement Vercel requises :
//  - ANTHROPIC_API_KEY : clé API Anthropic
//  - SUPABASE_URL : URL de ton projet Supabase
//  - SUPABASE_SERVICE_ROLE_KEY : clé service role (pour bypasser RLS sur l'insertion d'usage)

import { createClient } from '@supabase/supabase-js'

// Constantes
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 2000
const DAILY_QUOTA = 5

// Pricing Sonnet 4.5 (avril 2026) en USD par million de tokens
const PRICE_INPUT_PER_M = 3.0
const PRICE_OUTPUT_PER_M = 15.0

export default async function handler(req, res) {
  // CORS basic (même origine seulement, on est sur le même domaine)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // --- Auth : vérifier le user via le token Supabase ---
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Token invalide' })
    }

    // --- Vérifier les quotas ---
    const { data: quotaData, error: quotaError } = await supabase
      .rpc('get_today_ai_usage', { p_user_id: user.id })

    if (quotaError) {
      console.error('Quota check failed', quotaError)
      return res.status(500).json({ error: 'Erreur de vérification quota' })
    }

    const usedToday = quotaData || 0
    if (usedToday >= DAILY_QUOTA) {
      return res.status(429).json({
        error: 'Quota quotidien atteint',
        used: usedToday,
        limit: DAILY_QUOTA
      })
    }

    // --- Récupérer le payload de la requête ---
    const { action, payload } = req.body
    if (!action || !payload) {
      return res.status(400).json({ error: 'action et payload requis' })
    }

    // --- Construire le prompt selon l'action ---
    let systemPrompt, userPrompt
    if (action === 'generate_workout') {
      ({ systemPrompt, userPrompt } = buildWorkoutPrompt(payload))
    } else {
      return res.status(400).json({ error: `Action inconnue : ${action}` })
    }

    // --- Appeler Anthropic ---
    const startTime = Date.now()
    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    const elapsedMs = Date.now() - startTime

    if (!anthropicResp.ok) {
      const errorText = await anthropicResp.text()
      console.error('Anthropic error', anthropicResp.status, errorText)

      // Track l'échec dans la table usage
      await supabase.from('ai_usage').insert({
        user_id: user.id,
        action,
        success: false,
        error_message: `Anthropic ${anthropicResp.status}: ${errorText.slice(0, 200)}`
      })

      return res.status(502).json({ error: 'Service IA temporairement indisponible' })
    }

    const data = await anthropicResp.json()
    const content = data.content?.[0]?.text || ''
    const usage = data.usage || { input_tokens: 0, output_tokens: 0 }

    // --- Calculer le coût ---
    const costUsd =
      (usage.input_tokens / 1_000_000) * PRICE_INPUT_PER_M +
      (usage.output_tokens / 1_000_000) * PRICE_OUTPUT_PER_M

    // --- Track l'usage ---
    await supabase.from('ai_usage').insert({
      user_id: user.id,
      action,
      prompt_tokens: usage.input_tokens,
      completion_tokens: usage.output_tokens,
      cost_usd: costUsd,
      success: true
    })

    // --- Renvoyer la réponse ---
    return res.status(200).json({
      content,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cost_usd: costUsd
      },
      quota: {
        used: usedToday + 1,
        limit: DAILY_QUOTA
      },
      elapsed_ms: elapsedMs
    })

  } catch (e) {
    console.error('Coach API error', e)
    return res.status(500).json({ error: 'Erreur interne' })
  }
}

// =====================================================
// Prompt : génération de séance
// =====================================================
function buildWorkoutPrompt(payload) {
  const {
    objective,         // 'force' | 'cardio' | 'wod' | 'hyrox' | 'mobility'
    duration,          // minutes : 15 | 30 | 45 | 60 | 90
    equipment,         // 'gym' | 'home' | 'bodyweight' | 'outdoor'
    avoidGroups,       // array of muscle groups to avoid (or [])
    availableExercises, // array of { id, name, muscle_group, equipment, applicable_sections, unit }
    userHistory        // optional : { recent_sessions, prs, frequency_per_week }
  } = payload

  const systemPrompt = `Tu es un coach sportif expert en CrossFit, Hyrox, renforcement musculaire et préparation physique.

Tu génères des séances PERSONNALISÉES basées sur :
1. L'objectif et le temps disponibles
2. Le matériel accessible
3. Les exercices disponibles dans la base de l'utilisateur (TU DOIS UTILISER UNIQUEMENT CES EXERCICES)
4. L'historique du user (records, fréquence) pour adapter le niveau

RÈGLES STRICTES :
- Tu réponds UNIQUEMENT en JSON valide, pas de texte avant ou après
- Tu utilises EXCLUSIVEMENT des exercises_id présents dans availableExercises
- Tu structures la séance en 3 sections : warmup (échauffement), main (exercices principaux), wod (optionnel, format CrossFit)
- Pour chaque exercice : sets, reps, weight_kg (0 si poids du corps), rest_seconds
- Tu adaptes les charges aux PR de l'utilisateur s'ils sont fournis (typiquement 60-80% du 1RM pour du volume, 80-90% pour de la force)
- Tu rédiges en français avec un ton motivant mais pas niais

FORMAT DE RÉPONSE (JSON strict) :
{
  "name": "Nom court et évocateur de la séance",
  "description": "Description courte (1-2 phrases) de l'objectif et structure",
  "category": "athx" | "renfo" | "hyrox" | "crossfit" | "cardio" | "mobility" | "other",
  "wod_mode": null | "amrap" | "emom" | "fortime" | "tabata" | "interval",
  "wod_config": null ou objet selon le mode,
  "items": [
    {
      "exercise_id": "<id de availableExercises>",
      "section": "warmup" | "main" | "wod",
      "sets": int,
      "reps": int,
      "weight_kg": number (0 pour poids du corps),
      "rest_seconds": int,
      "order": int
    }
  ],
  "coach_notes": "Conseils du coach (3-5 phrases) sur l'exécution, l'intensité, la progression"
}

CONFIGURATIONS WOD :
- amrap : { totalSeconds: int }
- emom : { intervalSeconds: int, rounds: int }
- fortime : { cap: int (0 = no cap) }
- tabata : { workSeconds: 20, restSeconds: 10, rounds: 8 }
- interval : { workSeconds: int, restSeconds: int, rounds: int }`

  const userPrompt = `Génère-moi une séance avec ces critères :

OBJECTIF : ${labelForObjective(objective)}
DURÉE : ${duration} minutes
MATÉRIEL : ${labelForEquipment(equipment)}
${avoidGroups?.length ? `À ÉVITER : ${avoidGroups.join(', ')}` : 'Pas de restriction'}

EXERCICES DISPONIBLES (utilise UNIQUEMENT ceux-ci, par leur id) :
${availableExercises.map(e => `- ${e.id} : ${e.name} (${e.muscle_group}, ${e.equipment || 'aucun équipement'}, sections: ${(e.applicable_sections || ['main']).join(',')}, unit: ${e.unit || 'weight'})`).join('\n')}

${userHistory ? buildHistoryContext(userHistory) : ''}

Génère la séance en JSON strict.`

  return { systemPrompt, userPrompt }
}

function labelForObjective(o) {
  return ({
    force: 'Force / Hypertrophie (musculation classique)',
    cardio: 'Cardio / Endurance',
    wod: 'WOD CrossFit (intense, métabolique)',
    hyrox: 'Préparation Hyrox (course + stations fonctionnelles)',
    mobility: 'Mobilité / Récupération active'
  }[o] || o)
}

function labelForEquipment(e) {
  return ({
    gym: 'Salle de sport complète (toutes machines + barres + haltères)',
    home: 'Garage / Home gym (barre + haltères + kettlebell)',
    bodyweight: 'Poids du corps uniquement',
    outdoor: 'Extérieur (course + poids du corps)'
  }[e] || e)
}

function buildHistoryContext(history) {
  let txt = '\nCONTEXTE DE L\'UTILISATEUR :\n'
  if (history.frequency_per_week) {
    txt += `- Fréquence : ${history.frequency_per_week} séance(s)/semaine\n`
  }
  if (history.recent_sessions?.length) {
    txt += `- Dernières séances :\n`
    history.recent_sessions.slice(0, 3).forEach(s => {
      txt += `  • ${s.name} (${s.category}, ${s.days_ago}j)\n`
    })
  }
  if (history.prs?.length) {
    txt += `- Records principaux :\n`
    history.prs.slice(0, 8).forEach(pr => {
      txt += `  • ${pr.exercise_name} : ${pr.weight_kg}kg × ${pr.reps_done} reps\n`
    })
  }
  return txt
}
