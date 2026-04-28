<template>
  <div class="pb-24">
    <ToastContainer />
    <ResumeSessionModal
      :visible="showResume"
      :snapshot="pendingSnapshot"
      @resume="handleResume"
      @discard="handleDiscard"
      @dismiss="showResume = false"
    />

    <!-- Header -->
    <div class="bg-brand px-5 pt-12 pb-8">
      <p class="text-white/70 text-sm">{{ greeting }}</p>
      <h1 class="text-white text-2xl font-bold mt-1">{{ userName }}</h1>
      <p class="text-white/50 text-xs mt-1">{{ today }}</p>
    </div>

    <div class="px-4 mt-5 space-y-4">
      <!-- Today's scheduled sessions -->
      <div v-if="todaysSessions.length > 0">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">📅 Aujourd'hui</h2>
        <div class="space-y-2">
          <div v-for="s in todaysSessions" :key="s.id"
            class="card p-4 flex items-center gap-3"
            :style="`border-left: 3px solid ${getCat(s.workout?.category).color}`">
            <span class="text-2xl">{{ getCat(s.workout?.category).icon }}</span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 truncate">{{ s.workout?.name }}</p>
              <p class="text-xs text-gray-400">{{ s.workout?.workout_items?.length || 0 }} exercices</p>
            </div>
            <button v-if="!s.completed"
              @click="launchScheduled(s)"
              class="btn-accent text-sm py-2 px-4">▶</button>
            <span v-else class="text-green-500 text-lg">✓</span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-2">
        <div class="card p-3 text-center">
          <p class="text-xl font-bold text-gray-900">{{ stats.weekCount }}</p>
          <p class="text-xs text-gray-400 mt-0.5">cette semaine</p>
        </div>
        <div class="card p-3 text-center">
          <p class="text-xl font-bold text-gray-900">{{ stats.monthCount }}</p>
          <p class="text-xs text-gray-400 mt-0.5">ce mois</p>
        </div>
        <div class="card p-3 text-center">
          <p class="text-xl font-bold text-gray-900">{{ stats.totalCount }}</p>
          <p class="text-xs text-gray-400 mt-0.5">total</p>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-2 gap-3">
        <router-link to="/workouts" class="card p-4 flex flex-col items-center text-center">
          <span class="text-3xl mb-1">📋</span>
          <p class="text-sm font-semibold text-gray-900">Mes séances</p>
          <p class="text-xs text-gray-400">{{ workouts.workouts.length }} programme(s)</p>
        </router-link>
        <router-link to="/timer" class="card p-4 flex flex-col items-center text-center">
          <span class="text-3xl mb-1">⏱</span>
          <p class="text-sm font-semibold text-gray-900">Timer WOD</p>
          <p class="text-xs text-gray-400">AMRAP, EMOM, Tabata…</p>
        </router-link>
      </div>

      <!-- Recent sessions -->
      <div v-if="recent.length > 0">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Dernières séances</h2>
        <div class="space-y-2">
          <div v-for="s in recent.slice(0, 3)" :key="s.id"
            class="card p-3 flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ s.workout?.name || 'Séance' }}</p>
              <p class="text-xs text-gray-400">{{ formatRelative(s.started_at) }} · {{ formatDuration(s.duration_seconds) }}</p>
            </div>
            <span v-if="hasPR(s)" class="text-yellow-500 text-lg" title="Record battu">🏆</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkoutsStore } from '@/stores/workouts'
import { useStatsStore } from '@/stores/stats'
import { useSessionStore } from '@/stores/session'
import { usePlanningStore } from '@/stores/planning'
import { useSessionPersistence } from '@/composables/useSessionPersistence'
import { getCategory } from '@/lib/categories'
import ResumeSessionModal from '@/components/session/ResumeSessionModal.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const auth = useAuthStore()
const workouts = useWorkoutsStore()
const stats = useStatsStore()
const session = useSessionStore()
const planning = usePlanningStore()
const persistence = useSessionPersistence()
const router = useRouter()

const showResume = ref(false)
const pendingSnapshot = ref(null)

const userName = computed(() => auth.user?.email?.split('@')[0] || 'Athlète')
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return 'Tu es matinal'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
})
const today = computed(() =>
  new Date().toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long' })
)

const getCat = getCategory

const recent = computed(() => stats.sessions.slice(0, 5))
const todaysSessions = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return planning.scheduled.filter(s => s.scheduled_date === today)
})

function formatRelative(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffH = Math.floor((now - d) / 3600000)
  if (diffH < 24) return `il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `il y a ${diffD}j`
  return d.toLocaleDateString('fr', { day: '2-digit', month: '2-digit' })
}
function formatDuration(sec) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  return `${m}min`
}
function hasPR(s) {
  return s.session_sets?.some(x => x.pr)
}

function launchScheduled(s) {
  if (!s.workout?.id) return
  const w = workouts.workouts.find(w => w.id === s.workout.id)
  if (!w) return
  session.startSession(w)
  sessionStorage.setItem('scheduledSessionId', s.id)
  router.push(`/session/${w.id}`)
}

async function handleResume() {
  const snapshot = persistence.load()
  if (!snapshot) { showResume.value = false; return }
  // Make sure workouts are fetched so we have full context if needed
  await workouts.fetchWorkouts()
  session.resumeFromSnapshot(snapshot)
  showResume.value = false
  router.push(`/session/${snapshot.workout.id}`)
}

function handleDiscard() {
  persistence.clear()
  showResume.value = false
  pendingSnapshot.value = null
}

onMounted(async () => {
  await Promise.all([
    workouts.fetchWorkouts(),
    stats.fetchSessions(20),
    planning.fetchScheduledForDate(new Date().toISOString().slice(0, 10))
  ])

  // Détecter une séance abandonnée
  const snap = persistence.load()
  if (snap && !session.active) {
    pendingSnapshot.value = snap
    showResume.value = true
  }
})
</script>
