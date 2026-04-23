import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useStatsStore = defineStore('stats', () => {
  const sessions = ref([])
  const prs = ref([])
  const weeklyCount = ref(0)
  const totalDuration = ref(0)
  const loading = ref(false)

  async function fetchSessions(limit = 30) {
    const auth = useAuthStore()
    loading.value = true
    const { data } = await supabase
      .from('sessions')
      .select('*, workout:workouts(name), session_sets(*, exercise:exercises(name, muscle_group))')
      .eq('user_id', auth.user.id)
      .order('started_at', { ascending: false })
      .limit(limit)
    sessions.value = data || []
    _computeStats()
    loading.value = false
  }

  async function fetchPRs() {
    const auth = useAuthStore()
    if (!auth.user) return
    const { data } = await supabase
      .from('session_sets')
      .select('*, exercise:exercises(name, muscle_group), session:sessions!inner(user_id, started_at)')
      .eq('session.user_id', auth.user.id)
      .eq('pr', true)
    // Sort client-side (nested relation ordering not supported)
    prs.value = (data || []).sort((a, b) =>
      new Date(b.session?.started_at || 0) - new Date(a.session?.started_at || 0)
    )
  }

  async function fetchExerciseHistory(exerciseId) {
    const auth = useAuthStore()
    if (!auth.user) return []
    const { data } = await supabase
      .from('session_sets')
      .select('weight_kg, reps_done, session:sessions!inner(started_at, user_id)')
      .eq('exercise_id', exerciseId)
      .eq('session.user_id', auth.user.id)
    return (data || []).sort((a, b) =>
      new Date(a.session?.started_at || 0) - new Date(b.session?.started_at || 0)
    )
  }

  function _computeStats() {
    const now = new Date()
    const weekAgo = new Date(now - 7 * 86400000)
    weeklyCount.value = sessions.value.filter(s => new Date(s.started_at) >= weekAgo).length
    totalDuration.value = sessions.value.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  }

  function getCalendarData(year, month) {
    const map = {}
    sessions.value.forEach(s => {
      const d = new Date(s.started_at)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate()
        map[key] = (map[key] || 0) + 1
      }
    })
    return map
  }

  return { sessions, prs, weeklyCount, totalDuration, loading, fetchSessions, fetchPRs, fetchExerciseHistory, getCalendarData }
})
