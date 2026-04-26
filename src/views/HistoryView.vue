<template>
  <div class="pb-24">
    <PageHeader title="Statistiques" :subtitle="`${stats.sessions.length} séance(s)`" back />
    <div class="px-4 mt-4 space-y-5">
      <!-- PRs avec graphique -->
      <div>
        <h2 class="text-sm font-semibold text-gray-900 mb-3">🏆 Mes records (PR)</h2>
        <div v-if="prsByExercise.length === 0" class="card p-5 text-center text-gray-400 text-sm">
          Aucun record enregistré
        </div>
        <div v-else class="space-y-3">
          <div v-for="pr in prsByExercise.slice(0, showAllPRs ? undefined : 5)" :key="pr.exerciseId"
            class="card p-3">
            <div class="flex items-center gap-3 mb-2">
              <PRBadge />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ pr.name }}</p>
                <p class="text-xs text-gray-400">{{ pr.muscleGroup }}</p>
              </div>
              <div class="text-right">
                <p class="text-base font-bold text-gray-900">{{ pr.bestWeight }}kg</p>
                <p class="text-xs text-gray-400">× {{ pr.bestReps }} reps</p>
              </div>
            </div>
            <PRChart :data="pr.history" :id="pr.exerciseId" />
            <p class="text-xs text-gray-300 text-right mt-1">{{ formatDate(pr.lastDate) }}</p>
          </div>
          <button v-if="prsByExercise.length > 5" @click="showAllPRs = !showAllPRs"
            class="w-full text-center text-xs text-brand font-medium py-2">
            {{ showAllPRs ? 'Voir moins' : `Voir les ${prsByExercise.length - 5} autres` }}
          </button>
        </div>
      </div>

      <!-- Progression libre par exercice -->
      <div class="card p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">📈 Progression par exercice</h2>
        <select v-model="selectedExerciseId" @change="loadChart" class="input text-sm mb-4">
          <option value="">Choisir un exercice…</option>
          <option v-for="ex in exercises" :key="ex.id" :value="ex.id">{{ ex.name }}</option>
        </select>
        <div v-if="chartLoading" class="text-center py-6 text-gray-400 text-sm">Chargement…</div>
        <div v-else-if="chartData.length > 0">
          <ProgressChart :data="chartData" />
          <p class="text-xs text-gray-400 text-center mt-2">Poids max par séance (kg)</p>
        </div>
        <div v-else-if="selectedExerciseId" class="text-center py-4 text-gray-400 text-sm">
          Pas encore de données pour cet exercice
        </div>
      </div>

      <!-- Sessions récentes -->
      <div>
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Séances récentes</h2>
        <div v-if="stats.loading" class="text-center py-8 text-gray-400 text-sm">Chargement…</div>
        <div v-else-if="stats.sessions.length === 0" class="card p-5 text-center text-gray-400 text-sm">
          Aucune séance enregistrée
        </div>
        <div v-else class="space-y-3">
          <div v-for="s in stats.sessions" :key="s.id" class="card p-4">
            <div class="flex items-center justify-between mb-2">
              <p class="font-semibold text-gray-900">{{ s.workout?.name || 'Séance libre' }}</p>
              <span class="text-xs text-gray-400">{{ formatDate(s.started_at) }}</span>
            </div>
            <div class="flex gap-4 text-xs text-gray-500">
              <span>⏱ {{ formatDuration(s.duration_seconds) }}</span>
              <span>💪 {{ s.session_sets?.length || 0 }} séries</span>
              <span v-if="hasPR(s)" class="text-yellow-600 font-semibold">🏆 PR</span>
            </div>
            <div v-if="s.session_sets?.length" class="mt-2 flex flex-wrap gap-1">
              <span v-for="ex in uniqueExercises(s)" :key="ex"
                class="badge bg-gray-100 text-gray-600">{{ ex }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStatsStore } from '@/stores/stats'
import { useWorkoutsStore } from '@/stores/workouts'
import PageHeader from '@/components/ui/PageHeader.vue'
import PRBadge from '@/components/ui/PRBadge.vue'
import PRChart from '@/components/stats/PRChart.vue'
import ProgressChart from '@/components/stats/ProgressChart.vue'

const stats = useStatsStore()
const workouts = useWorkoutsStore()
const showAllPRs = ref(false)
const selectedExerciseId = ref('')
const chartData = ref([])
const chartLoading = ref(false)
const exercises = ref([])
const exerciseHistories = ref({})  // { exerciseId: [{weight_kg, session: {started_at}}] }

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function formatDuration(sec) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}min${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}
function hasPR(session) {
  return session.session_sets?.some(s => s.pr)
}
function uniqueExercises(session) {
  const names = [...new Set(session.session_sets?.map(s => s.exercise?.name).filter(Boolean))]
  return names.slice(0, 4)
}

// Group PRs by exercise + load full history per exercise
const prsByExercise = computed(() => {
  const map = {}
  stats.prs.forEach(pr => {
    const exId = pr.exercise_id
    if (!exId) return
    if (!map[exId] || (pr.weight_kg ?? 0) > (map[exId].bestWeight ?? 0)) {
      map[exId] = {
        exerciseId: exId,
        name: pr.exercise?.name || 'Exercice',
        muscleGroup: pr.exercise?.muscle_group || '',
        bestWeight: pr.weight_kg,
        bestReps: pr.reps_done,
        lastDate: pr.session?.started_at,
        history: exerciseHistories.value[exId] || []
      }
    }
  })
  return Object.values(map).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate))
})

async function loadHistoriesForPRs() {
  // For each PR exercise, load its weight history (max per session)
  const exIds = [...new Set(stats.prs.map(p => p.exercise_id).filter(Boolean))]
  for (const exId of exIds) {
    const raw = await stats.fetchExerciseHistory(exId)
    // Aggregate: max weight per session
    const bySession = {}
    raw.forEach(r => {
      const key = r.session?.started_at
      if (!bySession[key] || (r.weight_kg ?? 0) > (bySession[key].weight_kg ?? 0)) {
        bySession[key] = r
      }
    })
    exerciseHistories.value[exId] = Object.values(bySession).sort((a, b) =>
      new Date(a.session?.started_at) - new Date(b.session?.started_at)
    )
  }
}

async function loadChart() {
  if (!selectedExerciseId.value) { chartData.value = []; return }
  chartLoading.value = true
  const raw = await stats.fetchExerciseHistory(selectedExerciseId.value)
  const bySession = {}
  raw.forEach(r => {
    const key = r.session?.started_at
    if (!bySession[key] || r.weight_kg > bySession[key].weight_kg) bySession[key] = r
  })
  chartData.value = Object.values(bySession).sort((a, b) =>
    new Date(a.session?.started_at) - new Date(b.session?.started_at)
  )
  chartLoading.value = false
}

onMounted(async () => {
  await stats.fetchSessions()
  await stats.fetchPRs()
  await workouts.fetchExercises()
  exercises.value = workouts.exercises
  await loadHistoriesForPRs()
})
</script>
