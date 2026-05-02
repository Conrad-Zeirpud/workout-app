<template>
  <div class="pb-24">
    <ToastContainer />

    <!-- Mode CATALOGUE -->
    <template v-if="mode === 'catalog'">
      <div class="bg-brand px-5 pt-12 pb-6">
        <p class="text-white/70 text-sm">Programmes</p>
        <h1 class="text-white text-2xl font-bold mt-1">Catalogue</h1>
        <p class="text-white/50 text-xs mt-1">Choisis un programme adapté à tes objectifs</p>
      </div>

      <div class="px-4 mt-5">
        <div v-if="programs.activeSubscription"
          class="card p-4 mb-5"
          style="background:linear-gradient(135deg,#FEF3C7,#FDE68A); border:none">
          <p class="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">📌 En cours</p>
          <p class="font-bold text-gray-900">{{ programs.activeSubscription.program?.name }}</p>
          <p class="text-xs text-gray-600 mt-1">
            Démarré le {{ formatShortDate(programs.activeSubscription.started_at) }}
          </p>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-2 mb-3">
          <button @click="filterType = ''"
            class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            :class="filterType === '' ? 'text-white' : 'bg-gray-100 text-gray-600'"
            :style="filterType === '' ? 'background:var(--brand)' : ''">
            Tous
          </button>
          <button v-for="t in availableTypes" :key="t.value"
            @click="filterType = t.value"
            class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            :class="filterType === t.value ? 'text-white' : 'bg-gray-100 text-gray-600'"
            :style="filterType === t.value ? `background:${t.color}` : ''">
            {{ t.icon }} {{ t.label }}
          </button>
        </div>

        <p class="text-xs text-gray-400 mb-2">{{ filteredPrograms.length }} programme(s)</p>

        <!-- Skeleton de chargement -->
        <div v-if="programs.loading" class="space-y-3">
          <div v-for="n in 4" :key="n" class="card p-4 animate-pulse">
            <div class="flex items-start gap-3">
              <div class="w-12 h-12 bg-gray-200 rounded-xl" />
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 rounded w-2/3" />
                <div class="h-3 bg-gray-100 rounded w-full" />
                <div class="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="filteredPrograms.length === 0" class="text-center py-12 text-gray-400 text-sm">
          Aucun programme dans cette catégorie
        </div>
        <div v-else class="space-y-3">
          <div v-for="p in filteredPrograms" :key="p.id"
            @click="openDetail(p)"
            class="card p-4 cursor-pointer active:scale-98 transition-transform"
            :style="`border-left:4px solid ${p.color || '#1a1a2e'}`">
            <div class="flex items-start gap-3">
              <span class="text-3xl">{{ p.icon || '📋' }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-bold text-gray-900">{{ p.name }}</p>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    :style="`background:${levelBg(p.level)}; color:${levelColor(p.level)}`">
                    {{ levelLabel(p.level) }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ p.description }}</p>
                <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>📅 {{ p.duration_weeks }} sem</span>
                  <span>🏃 {{ p.sessions_per_week }}×/sem</span>
                  <span>{{ equipmentEmoji(p.equipment_required) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Mode DETAIL -->
    <template v-else-if="mode === 'detail' && selectedProgram">
      <PageHeader :title="selectedProgram.name" back @back="mode = 'catalog'" />

      <div class="px-4 mt-4">
        <div class="card p-4 mb-4"
          :style="`background:${selectedProgram.color}11; border-left:4px solid ${selectedProgram.color}`">
          <div class="flex items-start gap-3">
            <span class="text-4xl">{{ selectedProgram.icon }}</span>
            <div class="flex-1">
              <p class="text-sm text-gray-700">{{ selectedProgram.description }}</p>
              <div class="flex items-center gap-3 mt-3 text-xs">
                <span class="px-2 py-1 rounded-full bg-white text-gray-600">
                  📅 {{ selectedProgram.duration_weeks }} semaines
                </span>
                <span class="px-2 py-1 rounded-full bg-white text-gray-600">
                  🏃 {{ selectedProgram.sessions_per_week }}/sem
                </span>
                <span class="px-2 py-1 rounded-full font-medium"
                  :style="`background:${levelBg(selectedProgram.level)}; color:${levelColor(selectedProgram.level)}`">
                  {{ levelLabel(selectedProgram.level) }}
                </span>
              </div>
              <p v-if="selectedProgram.goal" class="text-xs text-gray-500 mt-3 italic">
                🎯 {{ selectedProgram.goal }}
              </p>
            </div>
          </div>
        </div>

        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
          Aperçu ({{ selectedTemplates.length }} séances au total)
        </p>

        <div class="space-y-3 mb-5">
          <div v-for="weekN in displayedWeeks" :key="weekN" class="card overflow-hidden">
            <div class="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p class="text-xs font-semibold text-gray-700">Semaine {{ weekN }}</p>
            </div>
            <div class="divide-y divide-gray-100">
              <div v-for="t in templatesByWeek(weekN)" :key="t.id"
                class="p-3 flex items-start gap-3">
                <span class="text-xs text-gray-400 mt-0.5 w-4">{{ t.session_index + 1 }}.</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ t.name }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ (t.items || []).length }} exercice(s)
                    <span v-if="t.wod_mode" class="ml-2 text-red-600 font-medium">{{ wodModeLabel(t.wod_mode) }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p v-if="selectedProgram.duration_weeks > displayedWeeksCount" class="text-xs text-gray-400 text-center mb-4">
          + {{ selectedProgram.duration_weeks - displayedWeeksCount }} semaine(s) supplémentaire(s)
        </p>

        <button @click="mode = 'configure'"
          class="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
          :style="`background:linear-gradient(135deg,${selectedProgram.color}DD,${selectedProgram.color}); box-shadow:0 6px 20px ${selectedProgram.color}40`">
          <span class="text-xl">▶</span>
          Démarrer ce programme
        </button>

        <p v-if="programs.activeSubscription" class="text-xs text-amber-700 text-center mt-3">
          ⚠️ Tu as déjà un programme en cours ({{ programs.activeSubscription.program?.name }}). Le démarrer remplacera le programme actuel et supprimera ses séances futures non complétées.
        </p>
      </div>
    </template>

    <!-- Mode CONFIGURE -->
    <template v-else-if="mode === 'configure' && selectedProgram">
      <PageHeader :title="`Configurer : ${selectedProgram.name}`" back @back="mode = 'detail'" />

      <div class="px-4 mt-4 space-y-4">
        <div class="card p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date de début</p>
          <input type="date" v-model="config.startedAt"
            :min="todayDate"
            class="input" />
          <p class="text-xs text-gray-400 mt-2">
            Le programme commencera ce jour-là et durera {{ selectedProgram.duration_weeks }} semaines.
          </p>
        </div>

        <div class="card p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Jours préférés ({{ selectedProgram.sessions_per_week }} séance(s)/semaine)
          </p>
          <div class="grid grid-cols-7 gap-1">
            <button v-for="(day, i) in dayLabels" :key="i"
              type="button"
              @click="toggleDay(i + 1)"
              class="py-2 rounded-xl text-xs font-medium transition-all"
              :style="config.preferredDays.includes(i + 1)
                ? 'background:var(--brand);color:white'
                : 'background:#f9fafb;color:#9ca3af'">
              {{ day }}
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-2">
            {{ config.preferredDays.length }} jour(s) sélectionné(s).
            <span v-if="config.preferredDays.length < selectedProgram.sessions_per_week" class="text-amber-600">
              Sélectionne au moins {{ selectedProgram.sessions_per_week }} jour(s).
            </span>
          </p>
        </div>

        <div v-if="previewDates.length > 0" class="card p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Aperçu (3 premières séances)
          </p>
          <ul class="text-sm space-y-1">
            <li v-for="(d, i) in previewDates.slice(0, 3)" :key="i" class="text-gray-700">
              📅 {{ formatShortDate(d) }}
            </li>
          </ul>
        </div>

        <button @click="confirmStart" :disabled="!canConfirm || starting"
          class="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-40"
          style="background:linear-gradient(135deg,#1a1a2e,#2d2d5e)">
          <span v-if="starting" class="animate-spin">⟳</span>
          <span v-else>✓</span>
          Confirmer et générer les séances
        </button>

        <p class="text-xs text-gray-400 text-center">
          Les {{ totalSessions }} séances seront créées dans ton catalogue et placées dans ton planning.
        </p>
      </div>
    </template>

    <!-- Modal récap -->
    <div v-if="missingExercisesReport" class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="dismissReport">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <div class="text-center mb-4">
          <div class="text-4xl mb-2">{{ missingExercisesReport.missing.length === 0 ? '✓' : '⚠️' }}</div>
          <h3 class="font-bold text-gray-900 text-lg">
            {{ missingExercisesReport.missing.length === 0 ? 'Programme démarré' : 'Programme démarré (avec avertissements)' }}
          </h3>
          <p class="text-sm text-gray-500 mt-1">
            {{ missingExercisesReport.totalSessions }} séances créées · {{ missingExercisesReport.totalItems }} exercices configurés
          </p>
        </div>

        <div v-if="missingExercisesReport.missing.length > 0"
          class="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200">
          <p class="text-xs font-semibold text-amber-800 mb-2">
            ⚠️ {{ missingExercisesReport.missing.length }} exercice(s) introuvable(s) dans ta base :
          </p>
          <ul class="text-xs text-amber-700 space-y-0.5 max-h-40 overflow-y-auto">
            <li v-for="m in missingExercisesReport.missing" :key="m">• {{ m }}</li>
          </ul>
          <p class="text-xs text-amber-600 mt-2">
            Tu peux les créer dans Profil → Bibliothèque d'exercices, puis modifier les séances concernées.
          </p>
        </div>

        <button @click="dismissReport" class="btn-accent w-full text-sm py-2 font-semibold">
          OK, j'ai compris
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgramsStore } from '@/stores/programs'
import { useWorkoutsStore } from '@/stores/workouts'
import { useStatsStore } from '@/stores/stats'
import { useToast } from '@/composables/useToast'
import { formatShortDate } from '@/composables/useDateUtils'
import PageHeader from '@/components/ui/PageHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const programs = useProgramsStore()
const workouts = useWorkoutsStore()
const stats = useStatsStore()
const router = useRouter()
const { show } = useToast()

const mode = ref('catalog')
const selectedProgram = ref(null)
const selectedTemplates = ref([])
const filterType = ref('')
const starting = ref(false)
const displayedWeeksCount = 2
const missingExercisesReport = ref(null)

const config = ref({
  startedAt: new Date().toISOString().slice(0, 10),
  preferredDays: [1, 3, 5]
})

const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const todayDate = new Date().toISOString().slice(0, 10)

const availableTypes = [
  { value: 'crossfit', label: 'CrossFit', icon: '🔥', color: '#A32D2D' },
  { value: 'hyrox',    label: 'Hyrox',    icon: '🏃', color: '#EF9F27' },
  { value: 'force',    label: 'Force',    icon: '🏋️', color: '#1a1a2e' },
  { value: 'volume',   label: 'Volume',   icon: '💪', color: '#7F77DD' },
  { value: 'athx',     label: 'ATHX',     icon: '⚡', color: '#378ADD' },
  { value: 'haltero',  label: 'Haltéro',  icon: '🥇', color: '#EF9F27' },
  { value: 'renfo',    label: 'Renfo',    icon: '🏠', color: '#639922' },
  { value: 'conditioning', label: 'Conditioning', icon: '🔂', color: '#37BFAD' }
]

const filteredPrograms = computed(() =>
  programs.programs.filter(p => !filterType.value || p.type === filterType.value)
)

const displayedWeeks = computed(() => {
  if (!selectedProgram.value) return []
  return Array.from({ length: Math.min(displayedWeeksCount, selectedProgram.value.duration_weeks) }, (_, i) => i + 1)
})

function templatesByWeek(weekN) {
  return selectedTemplates.value.filter(t => t.week_number === weekN)
}

const totalSessions = computed(() => selectedTemplates.value.length)

const previewDates = computed(() => {
  if (!selectedProgram.value || config.value.preferredDays.length === 0) return []
  return computePreviewDates(
    config.value.startedAt,
    [...config.value.preferredDays].sort((a, b) => a - b),
    Math.min(2, selectedProgram.value.duration_weeks),
    selectedProgram.value.sessions_per_week
  ).slice(0, 3)
})

const canConfirm = computed(() =>
  selectedProgram.value &&
  config.value.startedAt &&
  config.value.preferredDays.length > 0
)

function levelLabel(l) { return ({ beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' }[l] || l) }
function levelColor(l) { return ({ beginner: '#3B6D11', intermediate: '#854F0B', advanced: '#A32D2D' }[l] || '#374151') }
function levelBg(l) { return ({ beginner: '#EAF3DE', intermediate: '#FAEEDA', advanced: '#FCEBEB' }[l] || '#F3F4F6') }
function equipmentEmoji(eq) { return ({ gym: '🏋️ Salle', home: '🏠 Maison', bodyweight: '💪 PdC', outdoor: '🌳 Outdoor' }[eq] || '🏋️') }
function wodModeLabel(m) { return ({ amrap: '🔁 AMRAP', emom: '⏱️ EMOM', fortime: '🏁 For Time', tabata: '🔥 Tabata', interval: '🔂 Interval' }[m] || m) }

function toggleDay(d) {
  const idx = config.value.preferredDays.indexOf(d)
  if (idx >= 0) config.value.preferredDays.splice(idx, 1)
  else config.value.preferredDays.push(d)
}

async function openDetail(program) {
  selectedProgram.value = program
  mode.value = 'detail'
  const detail = await programs.fetchProgramDetail(program.id)
  selectedTemplates.value = detail.templates
}

async function confirmStart() {
  if (!canConfirm.value) return
  starting.value = true
  try {
    if (workouts.exercises.length === 0) await workouts.fetchExercises()
    if ((stats.sessions || []).length === 0) await stats.fetchSessions(50)

    const userPRs = {}
    for (const session of stats.sessions || []) {
      for (const set of session.session_sets || []) {
        if (set.pr) {
          if (!userPRs[set.exercise_id] || set.weight_kg > userPRs[set.exercise_id]) {
            userPRs[set.exercise_id] = set.weight_kg
          }
        }
      }
    }

    const result = await programs.startProgram({
      programId: selectedProgram.value.id,
      startedAt: config.value.startedAt,
      preferredDays: [...config.value.preferredDays].sort((a, b) => a - b),
      allExercises: workouts.exercises,
      userPRs
    })

    await workouts.fetchWorkouts()

    missingExercisesReport.value = {
      missing: result.missingExercises || [],
      totalSessions: result.totalSessions,
      totalItems: result.totalItemsCreated
    }
  } catch (e) {
    console.error(e)
    show(e.message || 'Erreur lors du démarrage', 'error')
  }
  starting.value = false
}

function dismissReport() {
  missingExercisesReport.value = null
  mode.value = 'catalog'
  router.push('/workouts')
}

function computePreviewDates(startDateStr, preferredDays, weeks, sessionsPerWeek) {
  const dates = []
  const days = [...preferredDays]
  while (days.length < sessionsPerWeek) {
    days.push((days[days.length - 1] % 7) + 1)
  }
  const startDate = new Date(startDateStr + 'T00:00:00')
  for (let w = 0; w < weeks; w++) {
    for (let s = 0; s < sessionsPerWeek; s++) {
      const targetWeekday = days[s] % 8 || 1
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7)
      const currentWeekday = ((date.getDay() + 6) % 7) + 1
      let diff = targetWeekday - currentWeekday
      if (diff < 0) diff += 7
      date.setDate(date.getDate() + diff)
      dates.push(date.toISOString().slice(0, 10))
    }
  }
  return dates
}

onMounted(async () => {
  await Promise.all([
    programs.fetchPrograms(),
    programs.fetchActiveSubscription()
  ])
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.active\:scale-98:active { transform: scale(0.98); }
</style>
