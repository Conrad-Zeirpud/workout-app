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

  return { workouts, exercises, loading, fetchWorkouts, fetchExercises, createWorkout, updateWorkout, deleteWorkout, saveWorkoutItems, createExercise }
})
