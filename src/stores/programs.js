import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useProgramsStore = defineStore('programs', () => {
  const programs = ref([])
  const activeSubscription = ref(null)
  const loading = ref(false)

  async function fetchPrograms() {
    loading.value = true
    const { data } = await supabase
      .from('programs')
      .select('*')
      .order('name')
    programs.value = data || []
    loading.value = false
  }

  async function fetchProgramDetail(programId) {
    const { data: prog } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single()
    const { data: templates } = await supabase
      .from('program_templates')
      .select('*')
      .eq('program_id', programId)
      .order('week_number')
      .order('session_index')
    return { program: prog, templates: templates || [] }
  }

  async function fetchActiveSubscription() {
    const auth = useAuthStore()
    if (!auth.user) return null
    const { data } = await supabase
      .from('program_subscriptions')
      .select('*, program:programs(*)')
      .eq('user_id', auth.user.id)
      .eq('active', true)
      .maybeSingle()
    activeSubscription.value = data
    return data
  }

  async function startProgram({ programId, startedAt, preferredDays, allExercises, userPRs }) {
    const auth = useAuthStore()
    if (!auth.user) throw new Error('Connexion requise')

    // Annule l'ancien programme avec ses séances futures non complétées
    if (activeSubscription.value) {
      await cancelActiveProgram()
    }

    // Créer la nouvelle souscription
    const { data: sub, error: subError } = await supabase
      .from('program_subscriptions')
      .insert({
        user_id: auth.user.id,
        program_id: programId,
        started_at: startedAt,
        preferred_days: preferredDays,
        active: true
      })
      .select()
      .single()
    if (subError) throw subError

    const { program, templates } = await fetchProgramDetail(programId)
    const sessionDates = computeSessionDates(startedAt, preferredDays, program.duration_weeks, program.sessions_per_week)

    let totalItemsCreated = 0
    const missingExercises = new Set()

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
      const date = sessionDates[i]
      if (!date) continue

      const { data: workout, error: wErr } = await supabase
        .from('workouts')
        .insert({
          user_id: auth.user.id,
          name: template.name,
          description: template.description || program.description?.slice(0, 100),
          category: template.category || 'other',
          wod_mode: template.wod_mode,
          wod_config: template.wod_config,
          program_subscription_id: sub.id,
          program_week: template.week_number,
          program_session_index: template.session_index
        })
        .select()
        .single()
      if (wErr) throw wErr

      const items = []
      for (let j = 0; j < (template.items || []).length; j++) {
        const item = template.items[j]
        const exercise = findExerciseByName(allExercises, item.exercise_name)
        if (!exercise) {
          missingExercises.add(item.exercise_name)
          continue
        }

        let weightKg = item.weight_kg ?? null
        let prRef = null
        if (item.weight_pct != null) {
          const userPR = userPRs[exercise.id]
          if (userPR && userPR > 0) {
            weightKg = Math.round(userPR * item.weight_pct * 2) / 2
            prRef = userPR
          }
        }

        items.push({
          workout_id: workout.id,
          exercise_id: exercise.id,
          sets: item.sets,
          reps: item.reps,
          weight_kg: weightKg,
          rest_seconds: item.rest_seconds || 90,
          section: item.section || 'main',
          order: j,
          weight_pct: item.weight_pct ?? null,
          pr_reference: prRef
        })
      }

      if (items.length > 0) {
        const { error: itemsErr } = await supabase
          .from('workout_items')
          .insert(items)
        if (itemsErr) throw itemsErr
        totalItemsCreated += items.length
      }

      await supabase
        .from('scheduled_sessions')
        .insert({
          user_id: auth.user.id,
          workout_id: workout.id,
          scheduled_date: date,
          completed: false
        })
    }

    activeSubscription.value = { ...sub, program }

    return {
      subscription: sub,
      totalSessions: templates.length,
      totalItemsCreated,
      missingExercises: [...missingExercises]
    }
  }

  async function cancelActiveProgram() {
    const auth = useAuthStore()
    if (!auth.user || !activeSubscription.value) return

    const subId = activeSubscription.value.id
    const today = new Date().toISOString().slice(0, 10)

    // Trouver les workouts du programme dont la séance n'est pas complétée et dans le futur (ou sans date)
    const { data: scheduledList } = await supabase
      .from('scheduled_sessions')
      .select('id, workout_id, scheduled_date, completed')
      .eq('user_id', auth.user.id)

    if (scheduledList?.length) {
      const workoutsOfProgram = await supabase
        .from('workouts')
        .select('id')
        .eq('program_subscription_id', subId)
      const programWorkoutIds = new Set((workoutsOfProgram.data || []).map(w => w.id))
      const idsToDelete = scheduledList
        .filter(s => programWorkoutIds.has(s.workout_id))
        .filter(s => !s.completed && s.scheduled_date >= today)
        .map(s => s.workout_id)

      if (idsToDelete.length > 0) {
        await supabase.from('workouts').delete().in('id', idsToDelete)
      }
    }

    await supabase
      .from('program_subscriptions')
      .update({ active: false })
      .eq('id', subId)

    activeSubscription.value = null
  }

  /**
   * Décale toutes les séances futures non complétées de N jours.
   */
  async function shiftActiveProgram(days) {
    const auth = useAuthStore()
    if (!auth.user || !activeSubscription.value || !days || days < 1) return

    const subId = activeSubscription.value.id
    const today = new Date().toISOString().slice(0, 10)

    // Récupère toutes les séances du programme avec leurs scheduled_sessions
    const { data: programWorkouts } = await supabase
      .from('workouts')
      .select('id')
      .eq('program_subscription_id', subId)

    if (!programWorkouts?.length) return

    const programWorkoutIds = programWorkouts.map(w => w.id)

    const { data: scheduled } = await supabase
      .from('scheduled_sessions')
      .select('id, scheduled_date, workout_id, completed')
      .in('workout_id', programWorkoutIds)
      .eq('user_id', auth.user.id)

    // Filtrer : futures et non complétées
    const toShift = (scheduled || []).filter(s =>
      !s.completed && s.scheduled_date >= today
    )

    // Update chacune avec la nouvelle date
    for (const s of toShift) {
      const oldDate = new Date(s.scheduled_date + 'T00:00:00')
      oldDate.setDate(oldDate.getDate() + days)
      const newDate = oldDate.toISOString().slice(0, 10)
      await supabase
        .from('scheduled_sessions')
        .update({ scheduled_date: newDate })
        .eq('id', s.id)
    }

    // Mettre à jour le day_offset cumulé
    const newOffset = (activeSubscription.value.day_offset || 0) + days
    await supabase
      .from('program_subscriptions')
      .update({ day_offset: newOffset })
      .eq('id', subId)

    if (activeSubscription.value) {
      activeSubscription.value.day_offset = newOffset
    }

    return toShift.length
  }

  return {
    programs, activeSubscription, loading,
    fetchPrograms, fetchProgramDetail, fetchActiveSubscription,
    startProgram, cancelActiveProgram, shiftActiveProgram
  }
})

// ============================================================
// MATCHING D'EXERCICES (très tolérant)
// ============================================================

const EXERCISE_SYNONYMS = {
  'Soulevé de terre': ['Soulevé de terre conventionnel', 'Deadlift', 'Soulevé de terre barre', 'Soulevé de terre classique'],
  'Squat': ['Back squat', 'Barbell back squat', 'Squat barre', 'Squat dos'],
  'Front squat': ['Squat avant', 'Front squat barre'],
  'Développé couché': ['Bench press', 'Bench', 'Développé couché barre', 'Barbell bench press'],
  'Développé couché incliné': ['Bench incliné', 'Incline bench press', 'Développé incliné'],
  'Développé militaire': ['Overhead press', 'OHP', 'Développé épaules barre', 'Strict press', 'Military press'],
  'Tractions': ['Pull up', 'Pull-up', 'Tractions pronation', 'Pullups'],
  'Tractions supination': ['Chin up', 'Chin-up'],
  'Rowing barre': ['Bent over row', 'Rowing penché', 'Barbell row'],
  'Rowing T-bar': ['T-bar row', 'Tirage T-bar'],
  'Tirage poitrine': ['Lat pulldown', 'Tirage vertical'],
  'Tirage horizontal': ['Seated cable row', 'Rowing horizontal poulie'],
  'Curl barre': ['Bicep curl barbell', 'Curl barbell'],
  'Curl haltères': ['Bicep curl dumbbell', 'Curl dumbbell'],
  'Curl marteau': ['Hammer curl'],
  'Skull crusher': ['Lying triceps extension', 'Barre au front'],
  'Extensions poulie': ['Tricep pushdown', 'Triceps poulie'],
  'Hip thrust': ['Hip thrust barre', 'Barbell hip thrust'],
  'Walking lunges': ['Fentes marchées', 'Lunges'],
  'Bulgarian split squat': ['Split squat bulgare', 'Bulgarian squat'],
  'Box jump': ['Box jump up', 'Saut sur box'],
  'Wall ball': ['Wall ball shot', 'Wall ball squat'],
  'Burpee': ['Burpees'],
  'Push up': ['Pompes', 'Pushups', 'Push-up'],
  'Air squat': ['Bodyweight squat', 'Squat poids du corps', 'Squats au poids du corps'],
  'Kettlebell swing': ['KB swing', 'Russian swing', 'American swing'],
  'Power clean': ['Clean', 'Épaulé puissance'],
  'Snatch': ['Arraché', 'Power snatch', 'Barbell snatch'],
  'Thruster': ['Thrusters'],
  'Run libre': ['Course libre', 'Course', 'Running'],
  'Easy run': ['Course lente', 'Course facile', 'Footing'],
  'Tempo run': ['Course tempo', 'Course allure soutenue'],
  'Hill sprint': ['Sprint en côte'],
  'Dips': ['Dips parallel bar', 'Dips barres parallèles'],
  'Mollets debout': ['Standing calf raises', 'Mollets'],
  'Mollets assis': ['Seated calf raise'],
  'Leg press': ['Presse à cuisses'],
  'Leg curl': ['Lying leg curl', 'Leg curl couché', 'Ischio machine'],
  'Leg extension': ['Leg extensions'],
  'Hyperextension': ['Hyperextensions', 'Lombaires banc'],
  'Plank': ['Planche', 'Gainage'],
  'Mountain climbers': ['Mountain climber'],
  'Glute bridge': ['Pont fessiers'],
  'Pike push up': ['Pike pushup'],
  'Face pull': ['Face pulls'],
  'Élévations latérales': ['Side lateral raise', 'Élévations latérales haltères'],
  'Soulevé de terre roumain': ['Romanian deadlift', 'RDL', 'Stiff leg deadlift'],
  'Développé épaules haltères': ['Dumbbell shoulder press', 'Développé épaules DB'],
  'Développé haltères incliné': ['Incline dumbbell press', 'DB incline press'],
  'Écarté haltères': ['Dumbbell fly', 'Pec fly'],
}

function normalizeName(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findExerciseByName(exercises, name) {
  if (!name || !exercises?.length) return null

  const normalized = normalizeName(name)
  if (!normalized) return null

  let ex = exercises.find(e => normalizeName(e.name) === normalized)
  if (ex) return ex

  const synonyms = EXERCISE_SYNONYMS[name] || []
  for (const syn of synonyms) {
    const synNorm = normalizeName(syn)
    ex = exercises.find(e => normalizeName(e.name) === synNorm)
    if (ex) return ex
  }

  for (const [canonical, syns] of Object.entries(EXERCISE_SYNONYMS)) {
    if (normalizeName(canonical) === normalized) {
      for (const syn of syns) {
        const synNorm = normalizeName(syn)
        ex = exercises.find(e => normalizeName(e.name) === synNorm)
        if (ex) return ex
      }
    }
  }

  const queryTokens = normalized.split(' ').filter(t => t.length > 2)
  if (queryTokens.length === 0) return null

  let bestMatch = null
  let bestScore = 0
  for (const e of exercises) {
    const exTokens = normalizeName(e.name).split(' ').filter(t => t.length > 2)
    if (exTokens.length === 0) continue
    let common = 0
    for (const qt of queryTokens) {
      if (exTokens.some(et => et === qt || et.startsWith(qt) || qt.startsWith(et))) common++
    }
    const score = common / Math.max(queryTokens.length, exTokens.length)
    if (score > bestScore) {
      bestScore = score
      bestMatch = e
    }
  }

  return bestScore >= 0.5 ? bestMatch : null
}

function computeSessionDates(startDateStr, preferredDays, weeks, sessionsPerWeek) {
  const dates = []
  const days = [...preferredDays].sort((a, b) => a - b)
  while (days.length < sessionsPerWeek) {
    const next = (days[days.length - 1] % 7) + 1
    if (!days.includes(next)) days.push(next)
    else days.push(days[0] + 7)
  }

  const startDate = new Date(startDateStr + 'T00:00:00')

  for (let w = 0; w < weeks; w++) {
    for (let s = 0; s < sessionsPerWeek; s++) {
      const targetWeekday = days[s] % 8 || 1
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7)
      const currentWeekday = ((date.getDay() + 6) % 7) + 1
      let diff = targetWeekday - currentWeekday
      if (w === 0 && s === 0 && diff < 0) {
        diff += 7
      } else if (diff < 0) {
        diff += 7
      }
      date.setDate(date.getDate() + diff)
      dates.push(date.toISOString().slice(0, 10))
    }
  }
  return dates
}
