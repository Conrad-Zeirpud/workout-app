import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useWorkoutsStore = defineStore('workouts', () => {
  const workouts = ref([])
  const exercises = ref([])
  const loading = ref(false)

  async function fetchWorkouts() {
    const auth = useAuthStore()
    if (!auth.user) return
    loading.value = true
    const { data } = await supabase
      .from('workouts')
      .select('*, workout_items(*, exercise:exercises(*))')
      .eq('user_id', auth.user.id)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    const sorted = (data || []).map(w => ({
      ...w,
      workout_items: (w.workout_items || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }))
    workouts.value = sorted
    loading.value = false
  }

  async function fetchExercises() {
    const auth = useAuthStore()
    if (!auth.user) return
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${auth.user.id},is_default.eq.true`)
      .order('name')
    exercises.value = data || []
  }

  async function createWorkout(workout) {
    const auth = useAuthStore()
    const { data, error } = await supabase
      .from('workouts')
      .insert({ ...workout, user_id: auth.user.id })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function updateWorkout(id, updates) {
    const { error } = await supabase.from('workouts').update(updates).eq('id', id)
    if (error) throw error
  }

  async function deleteWorkout(id) {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) throw error
    workouts.value = workouts.value.filter(w => w.id !== id)
  }

  async function duplicateWorkout(id) {
    const original = workouts.value.find(w => w.id === id)
    if (!original) throw new Error('Workout not found')
    const auth = useAuthStore()
    const { data: newWorkout, error: err1 } = await supabase
      .from('workouts')
      .insert({
        user_id: auth.user.id,
        name: `${original.name} (copie)`,
        description: original.description,
        category: original.category,
        wod_mode: original.wod_mode,
        wod_config: original.wod_config
      })
      .select()
      .single()
    if (err1) throw err1
    if (original.workout_items?.length) {
      const items = original.workout_items.map((item, i) => ({
        workout_id: newWorkout.id,
        exercise_id: item.exercise_id,
        sets: item.sets,
        reps: item.reps,
        weight_kg: item.weight_kg,
        rest_seconds: item.rest_seconds,
        section: item.section || 'main',
        order: i
      }))
      const { error: err2 } = await supabase.from('workout_items').insert(items)
      if (err2) throw err2
    }
    await fetchWorkouts()
    return newWorkout
  }

  async function reorderWorkouts(orderedIds) {
    // Updates display_order for each workout
    const updates = orderedIds.map((id, idx) =>
      supabase.from('workouts').update({ display_order: idx }).eq('id', id)
    )
    await Promise.all(updates)
    // Re-fetch to update local state
    await fetchWorkouts()
  }

  async function saveWorkoutItems(workoutId, items) {
    await supabase.from('workout_items').delete().eq('workout_id', workoutId)
    if (items.length === 0) return
    const rows = items.map((item, i) => ({
      workout_id: workoutId,
      exercise_id: item.exercise_id,
      sets: item.sets,
      reps: item.reps,
      weight_kg: item.weight_kg || null,
      rest_seconds: item.rest_seconds || 90,
      section: item.section || 'main',
      order: i
    }))
    const { error } = await supabase.from('workout_items').insert(rows)
    if (error) throw error
  }

  async function createExercise(exercise) {
    const auth = useAuthStore()
    const { data, error } = await supabase
      .from('exercises')
      .insert({ ...exercise, user_id: auth.user.id })
      .select()
      .single()
    if (error) throw error
    exercises.value.push(data)
    return data
  }

  return {
    workouts, exercises, loading,
    fetchWorkouts, fetchExercises,
    createWorkout, updateWorkout, deleteWorkout, duplicateWorkout, reorderWorkouts,
    saveWorkoutItems, createExercise
  }
})
