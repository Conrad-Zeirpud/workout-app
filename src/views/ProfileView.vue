<template>
  <div class="pb-24">
    <ToastContainer />
    <div class="bg-brand px-5 pt-12 pb-8 flex flex-col items-center text-center">
      <div class="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl mb-3">
        {{ avatarEmoji }}
      </div>
      <h1 class="text-white text-lg font-bold">{{ auth.user?.email?.split('@')[0] }}</h1>
      <p class="text-white/50 text-sm">{{ auth.user?.email }}</p>
      <p class="text-white/40 text-xs mt-1">Membre depuis {{ memberSince }}</p>
    </div>

    <div class="px-4 mt-5 space-y-4">
      <!-- Stats globales -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-4 text-center">
          <div class="text-3xl font-bold text-gray-900">{{ stats.sessions.length }}</div>
          <div class="text-xs text-gray-400 mt-0.5">séances totales</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-3xl font-bold text-gray-900">{{ totalHours }}</div>
          <div class="text-xs text-gray-400 mt-0.5">heures d'entraînement</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-3xl font-bold text-gray-900">{{ stats.prs.length }}</div>
          <div class="text-xs text-gray-400 mt-0.5">records (PR)</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-3xl font-bold text-gray-900">{{ totalSets }}</div>
          <div class="text-xs text-gray-400 mt-0.5">séries complétées</div>
        </div>
      </div>

      <!-- Activité hebdo (7 dernières semaines) -->
      <div class="card p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">Activité — 7 dernières semaines</h2>
        <WeeklyBarChart :data="weeklyData" />
      </div>

      <!-- Muscles les plus travaillés -->
      <div class="card p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Muscles les plus travaillés</h2>
        <div v-if="muscleRanking.length === 0" class="text-gray-400 text-sm text-center py-2">
          Pas encore de données
        </div>
        <div v-else class="space-y-2">
          <div v-for="(m, i) in muscleRanking.slice(0, 6)" :key="m.name" class="flex items-center gap-3">
            <span class="text-xs text-gray-400 w-4 text-right">{{ i + 1 }}</span>
            <div class="flex-1">
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">{{ m.name }}</span>
                <span class="text-xs text-gray-400">{{ m.count }} séries</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-1.5">
                <div class="h-1.5 rounded-full transition-all" style="background:var(--accent)"
                  :style="`width:${(m.count / muscleRanking[0].count) * 100}%`" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Paramètres -->
      <div class="card divide-y divide-gray-50">
        <div class="p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900">Notifications de repos</p>
            <p class="text-xs text-gray-400">Vibration à la fin du timer</p>
          </div>
          <button @click="settings.vibration = !settings.vibration; saveSettings()"
            class="relative w-11 h-6 rounded-full transition-colors"
            :style="`background:${settings.vibration ? 'var(--accent)' : '#e5e7eb'}`">
            <span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
              :style="`left:${settings.vibration ? '1.375rem' : '0.125rem'}`" />
          </button>
        </div>
        <div class="p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900">Son du timer</p>
            <p class="text-xs text-gray-400">Bip à la fin du repos</p>
          </div>
          <button @click="settings.sound = !settings.sound; saveSettings()"
            class="relative w-11 h-6 rounded-full transition-colors"
            :style="`background:${settings.sound ? 'var(--accent)' : '#e5e7eb'}`">
            <span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
              :style="`left:${settings.sound ? '1.375rem' : '0.125rem'}`" />
          </button>
        </div>
        <div class="p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900">Unité de poids</p>
          </div>
          <select v-model="settings.unit" @change="saveSettings" class="text-sm border border-gray-200 rounded-lg px-2 py-1">
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
          </select>
        </div>
      </div>
      <!-- Lien Exercices -->
      <router-link to="/exercises" class="w-full card p-4 flex items-center gap-3 hover:bg-gray-50">
        <span class="text-xl">💪</span>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">Bibliothèque d'exercices</p>
          <p class="text-xs text-gray-400">Voir et gérer mes exercices</p>
        </div>
        <span class="text-gray-300">›</span>
      </router-link>
      <!-- Déconnexion -->
      <button @click="confirmLogout = true"
        class="w-full card p-4 text-red-500 text-sm font-medium text-center">
        Se déconnecter
      </button>
      <p class="text-center text-xs text-gray-300 pb-2">WorkoutApp v0.1.0</p>
    </div>

    <!-- Confirm logout -->
    <div v-if="confirmLogout" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="confirmLogout = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Se déconnecter ?</h3>
        <p class="text-sm text-gray-400 mb-5">Tu devras te reconnecter pour accéder à tes données.</p>
        <div class="flex gap-3">
          <button @click="confirmLogout = false" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button @click="logout" class="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium">Déconnexion</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStatsStore } from '@/stores/stats'
import { useToast } from '@/composables/useToast'
import { useSettings } from '@/composables/useSettings'
import WeeklyBarChart from '@/components/stats/WeeklyBarChart.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const auth = useAuthStore()
const stats = useStatsStore()
const router = useRouter()
const { show } = useToast()
const { settings, save: saveSettings } = useSettings()
const confirmLogout = ref(false)

const emojis = ['🏋️','💪','🤸','🦾','🧗','🚴','🏊','⚡']
const avatarEmoji = computed(() => {
  const i = (auth.user?.email?.charCodeAt(0) || 0) % emojis.length
  return emojis[i]
})

const memberSince = computed(() => {
  const d = auth.user?.created_at
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr', { month: 'long', year: 'numeric' })
})

const totalHours = computed(() => {
  const sec = stats.sessions.reduce((a, s) => a + (s.duration_seconds || 0), 0)
  return Math.round(sec / 3600)
})

const totalSets = computed(() =>
  stats.sessions.reduce((a, s) => a + (s.session_sets?.length || 0), 0)
)

const muscleRanking = computed(() => {
  const map = {}
  stats.sessions.forEach(s => {
    s.session_sets?.forEach(set => {
      const g = set.exercise?.muscle_group || 'Autre'
      map[g] = (map[g] || 0) + 1
    })
  })
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const weeklyData = computed(() => {
  const weeks = []
  const now = new Date()
  for (let w = 6; w >= 0; w--) {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay() - w * 7 + 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const count = stats.sessions.filter(s => {
      const d = new Date(s.started_at)
      return d >= start && d < end
    }).length
    const label = start.toLocaleDateString('fr', { day: '2-digit', month: '2-digit' })
    weeks.push({ label, count })
  }
  return weeks
})

async function logout() {
  await auth.signOut()
  router.push('/auth')
}

onMounted(async () => {
  await stats.fetchSessions(100)
  await stats.fetchPRs()
})
</script>
