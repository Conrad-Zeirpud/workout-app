import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useSessionPersistence } from '@/composables/useSessionPersistence'

export const useSessionStore = defineStore('session', () => {
  const persistence = useSessionPersistence()

  const active = ref(false)
  const sessionId = ref(null)
  const workout = ref(null)
  const currentExerciseIndex = ref(0)
  const sets = ref([])
  const startedAt = ref(null)
  const elapsed = ref(0)
  const restTimer = ref(0)
  const restActive = ref(false)
  let timerInterval = null
  let restInterval = null

  const orderedItems = computed(() => {
    if (!workout.value?.workout_items) return []
    const sectionOrder = { warmup: 0, main: 1, wod: 2 }
    return [...workout.value.workout_items].sort((a, b) => {
      const sa = sectionOrder[a.section || 'main'] ?? 1
      const sb = sectionOrder[b.section || 'main'] ?? 1
      if (sa !== sb) return sa - sb
      return (a.order ?? 0) - (b.order ?? 0)
    })
  })

  const currentExercise = computed(() =>
    orderedItems.value[currentExerciseIndex.value] ?? null
  )

  const currentSection = computed(() =>
    currentExercise.value?.section || 'main'
  )

  const totalExercises = computed(() => orderedItems.value.length)

  const progress = computed(() =>
    totalExercises.value ? Math.round((currentExerciseIndex.value / totalExercises.value) * 100) : 0
  )

  const hasWarmup = computed(() => orderedItems.value.some(i => i.section === 'warmup'))
  const hasMain = computed(() => orderedItems.value.some(i => i.section === 'main' || !i.section))
  const hasWod = computed(() => orderedItems.value.some(i => i.section === 'wod'))

  function startSession(w) {
    workout.value = w
    active.value = true
    startedAt.value = new Date()
    elapsed.value = 0
    currentExerciseIndex.value = 0
    sets.value = []
    _initSets()
    timerInterval = setInterval(() => { elapsed.value++ }, 1000)
    _persist()
  }

  // Resume from a saved snapshot
  function resumeFromSnapshot(snapshot) {
    workout.value = snapshot.workout
    active.value = true
    startedAt.value = new Date(snapshot.startedAt)
    elapsed.value = snapshot.elapsed || 0
    currentExerciseIndex.value = snapshot.currentExerciseIndex || 0
    sets.value = snapshot.sets || []
    timerInterval = setInterval(() => { elapsed.value++; _persist() }, 1000)
  }

  function _initSets() {
    if (!workout.value) return
    orderedItems.value.forEach(item => {
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
    if (item && currentSection.value !== 'wod') {
      startRest(item.rest_seconds || 90)
    }
    _persist()
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
      _persist()
    }
  }

  function prevExercise() {
    if (currentExerciseIndex.value > 0) {
      currentExerciseIndex.value--
      _persist()
    }
  }

  function jumpToSection(section) {
    const idx = orderedItems.value.findIndex(i => (i.section || 'main') === section)
    if (idx >= 0) {
      currentExerciseIndex.value = idx
      stopRest()
      _persist()
    }
  }

  // Persist current state to localStorage
  function _persist() {
    if (!active.value || !workout.value) return
    persistence.save({
      workout: workout.value,
      startedAt: startedAt.value?.toISOString(),
      elapsed: elapsed.value,
      currentExerciseIndex: currentExerciseIndex.value,
      sets: sets.value
    })
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
      const prSetIndices = await _detectPRs(auth.user.id, doneSets)
      const rows = doneSets.map((s, idx) => ({
        session_id: session.id,
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        reps_done: s.reps_done,
        weight_kg: s.weight_kg,
        rpe: s.rpe,
        pr: prSetIndices.has(idx)
      }))
      await supabase.from('session_sets').insert(rows)
    }

    active.value = false
    persistence.clear()  // Important : effacer la sauvegarde locale
    return { sessionId: session.id, duration, setsCount: doneSets.length }
  }

  async function _detectPRs(userId, doneSets) {
    const prIndices = new Set()
    const exerciseIds = [...new Set(doneSets.map(s => s.exercise_id))]
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
    const bestByExercise = {}
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
    persistence.clear()  // Effacer la sauvegarde locale
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
    restTimer, restActive,
    currentExercise, currentSection, totalExercises, progress, orderedItems,
    hasWarmup, hasMain, hasWod,
    startSession, resumeFromSnapshot,
    getSetsForExercise, completeSet, startRest, stopRest,
    nextExercise, prevExercise, jumpToSection, finishSession, cancelSession
  }
})
