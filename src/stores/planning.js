import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const usePlanningStore = defineStore('planning', () => {
  const scheduled = ref([])
  const loading = ref(false)

  async function fetchScheduled(from = null, to = null) {
    const auth = useAuthStore()
    if (!auth.user) return
    loading.value = true
    let q = supabase
      .from('scheduled_sessions')
      .select('*, workout:workouts(id, name, category, workout_items(count))')
      .eq('user_id', auth.user.id)
      .order('scheduled_date', { ascending: true })
    if (from) q = q.gte('scheduled_date', from)
    if (to) q = q.lte('scheduled_date', to)
    const { data } = await q
    scheduled.value = data || []
    loading.value = false
  }

  async function schedule(workoutId, date) {
    const auth = useAuthStore()
    const dateStr = _toDateStr(date)
    const { data, error } = await supabase
      .from('scheduled_sessions')
      .insert({ user_id: auth.user.id, workout_id: workoutId, scheduled_date: dateStr })
      .select('*, workout:workouts(id, name, category, workout_items(count))')
      .single()
    if (error) throw error
    scheduled.value.push(data)
    return data
  }

  async function unschedule(id) {
    const { error } = await supabase.from('scheduled_sessions').delete().eq('id', id)
    if (error) throw error
    scheduled.value = scheduled.value.filter(s => s.id !== id)
  }

  async function markCompleted(scheduledId, sessionId) {
    const { error } = await supabase
      .from('scheduled_sessions')
      .update({ completed: true, session_id: sessionId })
      .eq('id', scheduledId)
    if (error) throw error
    const item = scheduled.value.find(s => s.id === scheduledId)
    if (item) { item.completed = true; item.session_id = sessionId }
  }

  function getForDate(date) {
    const dateStr = _toDateStr(date)
    return scheduled.value.filter(s => s.scheduled_date === dateStr)
  }

  function getTodaysSessions() {
    return getForDate(new Date())
  }

  function _toDateStr(date) {
    if (typeof date === 'string') return date
    const d = new Date(date)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  return { scheduled, loading, fetchScheduled, schedule, unschedule, markCompleted, getForDate, getTodaysSessions }
})
