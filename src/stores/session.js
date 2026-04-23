import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useSessionStore = defineStore('session', () => {
  const active = ref(false)
  const sessionId = ref(null)
  const workout = ref(null)
  const currentExerciseIndex = ref(0)
  const sets = ref([])   // { exercise_id, set_number, reps_done, weight_kg, rpe, done }
  const startedAt = ref(null)
  const elapsed = ref(0)
  const restTimer = ref(0)
  const restActive = ref(false)
  let timerInterval = null
  let restInterval = null

  const currentExercise = computed(() =>
    workout.value?.workout_items?.[currentExerciseIndex.value] ?? null
  )

  const totalExercises = computed(() =>
    workout.value?.workout_items?.length ?? 0
  )

  const progress = computed(() =>
    totalExercises.value ? Math.round((currentExerciseIndex.value / totalExercises.value) * 100) : 0
  )

  function startSession(w) {
    workout.value = w
    active.value = true
    startedAt.value = new Date()
    elapsed.value = 0
    currentExerciseIndex.value = 0
    sets.value = []
    _initSets()
    timerInterval = setInterval(() => { elapsed.value++ }, 1000)
  }

  function _initSets() {
    if (!workout.value) return
    workout.value.workout_items.forEach(item => {
      for (let i = 1; i <= item.sets; i++) {
        sets.value.push({
          exercise_id: item.exercise_id,
          workout_item_id: item.id,
          set_number: i,
          reps_done: item.reps,
          weight_kg: item.weight_kg || 0,
          rpe: null,
          done: false
        })
      }
    })
  }

  function getSetsForExercise(exerciseId) {
    return sets.value.filter(s => s.exercise_id === exerciseId)
  }

  function completeSet(set) {
    set.done = true
    const item = currentExercise.value
    if (item) startRest(item.rest_seconds || 90)
  }

  function startRest(seconds) {
    restActive.value = true
    restTimer.value = seconds
    clearInterval(restInterval)
    restInterval = setInterval(() => {
      if (restTimer.value <= 0) { stopRest(); return }
      restTimer.value--
    }, 1000)
  }

  function stopRest() {
    restActive.value = false
    restTimer.value = 0
    clearInterval(restInterval)
  }

  function nextExercise() {
    if (currentExerciseIndex.value < totalExercises.value - 1) {
      currentExerciseIndex.value++
      stopRest()
    }
  }

  function prevExercise() {
    if (currentExerciseIndex.value > 0) currentExerciseIndex.value--
  }

  async function finishSession() {
    const auth = useAuthStore()
    clearInterval(timerInterval)
    stopRest()
    const duration = elapsed.value

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: auth.user.id,
        workout_id: workout.value.id,
        started_at: startedAt.value.toISOString(),
        finished_at: new Date().toISOString(),
        duration_seconds: duration
      })
      .select()
      .single()
    if (error) throw error

    const doneSets = sets.value.filter(s => s.done)
    if (doneSets.length > 0) {
      const prSetIds = await _detectPRs(auth.user.id, doneSets)
      const rows = doneSets.map((s, idx) => ({
        session_id: session.id,
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        reps_done: s.reps_done,
        weight_kg: s.weight_kg,
        rpe: s.rpe,
        pr: prSetIds.has(idx)
      }))
      await supabase.from('session_sets').insert(rows)
    }

    active.value = false
    return { sessionId: session.id, duration, setsCount: doneSets.length }
  }

  async function _detectPRs(userId, doneSets) {
    // Returns Set of indices in doneSets that are PRs
    const prIndices = new Set()
    const exerciseIds = [...new Set(doneSets.map(s => s.exercise_id))]
    // Use inner join to filter by user_id properly
    const { data: history } = await supabase
      .from('session_sets')
      .select('exercise_id, weight_kg, session:sessions!inner(user_id)')
      .in('exercise_id', exerciseIds)
      .eq('session.user_id', userId)
    const maxByExercise = {}
    ;(history || []).forEach(r => {
      const cur = maxByExercise[r.exercise_id] ?? -Infinity
      if ((r.weight_kg ?? 0) > cur) maxByExercise[r.exercise_id] = r.weight_kg ?? 0
    })
    // For each exercise in the session, find the heaviest set — if it beats history, mark only that one
    const bestByExercise = {}  // exercise_id -> { idx, weight }
    doneSets.forEach((s, idx) => {
      const best = bestByExercise[s.exercise_id]
      if (!best || (s.weight_kg ?? 0) > best.weight) {
        bestByExercise[s.exercise_id] = { idx, weight: s.weight_kg ?? 0 }
      }
    })
    Object.values(bestByExercise).forEach(({ idx, weight }) => {
      const exId = doneSets[idx].exercise_id
      const historyMax = maxByExercise[exId] ?? -Infinity
      if (weight > historyMax && weight > 0) prIndices.add(idx)
    })
    return prIndices
  }

  function cancelSession() {
    clearInterval(timerInterval)
    stopRest()
    active.value = false
    workout.value = null
    sets.value = []
  }

  const elapsedFormatted = computed(() => {
    const h = Math.floor(elapsed.value / 3600)
    const m = Math.floor((elapsed.value % 3600) / 60)
    const s = elapsed.value % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  return {
    active, sessionId, workout, currentExerciseIndex, sets, elapsed, elapsedFormatted,
    restTimer, restActive, currentExercise, totalExercises, progress,
    startSession, getSetsForExercise, completeSet, startRest, stopRest,
    nextExercise, prevExercise, finishSession, cancelSession
  }
})
