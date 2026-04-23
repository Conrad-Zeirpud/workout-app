<template>
  <div class="pb-24">
    <ToastContainer />
    <!-- Header -->
    <div class="bg-brand px-5 pt-12 pb-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-white/60 text-sm">Bonjour 👋</p>
          <h1 class="text-white text-xl font-bold">{{ greeting }}</h1>
        </div>
        <button @click="auth.signOut()" class="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white text-sm">⏏</button>
      </div>
      <!-- Stats rapides -->
      <div class="grid grid-cols-3 gap-3 mt-5">
        <div class="bg-white/10 rounded-2xl p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ stats.weeklyCount }}</div>
          <div class="text-white/60 text-xs mt-0.5">cette semaine</div>
        </div>
        <div class="bg-white/10 rounded-2xl p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ totalDurationLabel }}</div>
          <div class="text-white/60 text-xs mt-0.5">durée totale</div>
        </div>
        <div class="bg-white/10 rounded-2xl p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ stats.prs.length }}</div>
          <div class="text-white/60 text-xs mt-0.5">records (PR)</div>
        </div>
      </div>
    </div>

    <div class="px-4 mt-5 space-y-5">
      <!-- Calendrier -->
      <div class="card p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Calendrier</h2>
        <CalendarGrid :data="calendarData" />
      </div>

      <!-- Séances rapides -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-900">Mes séances</h2>
          <router-link to="/workouts" class="text-xs text-brand font-medium">Voir tout</router-link>
        </div>
        <div v-if="workouts.loading" class="text-center py-8 text-gray-400 text-sm">Chargement…</div>
        <div v-else-if="workouts.workouts.length === 0" class="card p-6 text-center text-gray-400 text-sm">
          <p class="mb-3">Aucune séance créée</p>
          <router-link to="/workouts/new" class="btn-primary text-sm inline-block">+ Créer une séance</router-link>
        </div>
        <div v-else class="space-y-3">
          <WorkoutCard v-for="w in workouts.workouts.slice(0,3)" :key="w.id" :workout="w"
            @start="startWorkout(w)" />
        </div>
      </div>

      <!-- Derniers PR -->
      <div v-if="stats.prs?.length > 0">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">🏆 Derniers records</h2>
        <div class="space-y-2">
          <div v-for="pr in stats.prs.slice(0,3)" :key="pr.id" class="card p-3 flex items-center gap-3">
            <PRBadge />
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ pr.exercise?.name }}</p>
              <p class="text-xs text-gray-400">{{ pr.weight_kg }}kg × {{ pr.reps_done }} reps</p>
            </div>
            <span class="text-xs text-gray-400">{{ formatDate(pr.session?.started_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkoutsStore } from '@/stores/workouts'
import { useStatsStore } from '@/stores/stats'
import { useSessionStore } from '@/stores/session'
import CalendarGrid from '@/components/ui/CalendarGrid.vue'
import WorkoutCard from '@/components/workout/WorkoutCard.vue'
import PRBadge from '@/components/ui/PRBadge.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const auth = useAuthStore()
const workouts = useWorkoutsStore()
const stats = useStatsStore()
const session = useSessionStore()
const router = useRouter()

const greeting = computed(() => auth.user?.email?.split('@')[0] || 'Athlète')
const totalDurationLabel = computed(() => {
  const h = Math.floor(stats.totalDuration / 3600)
  const m = Math.floor((stats.totalDuration % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m}min`
})
const calendarData = computed(() => {
  const now = new Date()
  return stats.getCalendarData(now.getFullYear(), now.getMonth())
})

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr', { day: '2-digit', month: '2-digit' })
}

function startWorkout(w) {
  session.startSession(w)
  router.push(`/session/${w.id}`)
}

onMounted(async () => {
  await workouts.fetchWorkouts()
  await stats.fetchSessions()
  await stats.fetchPRs()
})
</script>
