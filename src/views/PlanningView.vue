<template>
  <div class="pb-24">
    <ToastContainer />
    <PageHeader title="Planning" :subtitle="monthLabel">
      <template #right>
        <router-link to="/timer" class="btn-primary text-sm py-2 px-3 flex items-center gap-1">⏱ Timer</router-link>
      </template>
    </PageHeader>

    <div class="px-4 mt-4 space-y-4">
      <!-- Month navigator -->
      <div class="flex items-center justify-between">
        <button @click="prevMonth" class="w-9 h-9 bg-white rounded-full border border-gray-100 flex items-center justify-center text-gray-600">‹</button>
        <button @click="goToday" class="text-xs text-brand font-medium">Aujourd'hui</button>
        <button @click="nextMonth" class="w-9 h-9 bg-white rounded-full border border-gray-100 flex items-center justify-center text-gray-600">›</button>
      </div>

      <!-- Calendar grid -->
      <div class="card p-3">
        <div class="grid grid-cols-7 gap-1 mb-1">
          <div v-for="d in days" :key="d" class="text-center text-xs text-gray-400 font-medium py-1">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7 gap-1">
          <div v-for="blank in firstDayOfMonth" :key="'b'+blank" />
          <div v-for="day in daysInMonth" :key="day"
            @click="selectDay(day)"
            class="relative aspect-square rounded-lg cursor-pointer transition-all flex flex-col justify-between p-1.5"
            :class="cellClass(day)"
            :style="cellStyle(day)">
            <div class="text-xs font-medium leading-none" :style="cellTextStyle(day)">{{ day }}</div>
            <!-- Multiple sessions : stacked mini bars -->
            <div v-if="getForDay(day).length > 1" class="flex flex-col gap-0.5 mt-auto">
              <div v-for="s in getForDay(day).slice(0, 3)" :key="s.id"
                class="h-1 rounded-full"
                :style="`background:${getCat(s.workout?.category).color};${s.completed ? 'opacity:0.4' : ''}`" />
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="card p-3">
        <p class="text-xs font-semibold text-gray-900 mb-2">Légende</p>
        <div class="flex flex-wrap gap-2">
          <div v-for="cat in categories" :key="cat.value" class="flex items-center gap-1.5 text-xs text-gray-500">
            <span class="w-3 h-3 rounded" :style="`background:${cat.bg};border:1px solid ${cat.color}`" />
            {{ cat.label }}
          </div>
        </div>
      </div>

      <!-- Upcoming sessions -->
      <div>
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Prochaines séances</h2>
        <div v-if="upcoming.length === 0" class="card p-5 text-center text-gray-400 text-sm">
          Aucune séance planifiée
        </div>
        <div v-else class="space-y-2">
          <div v-for="s in upcoming" :key="s.id"
            class="card p-3 flex items-center gap-3"
            :style="`border-left: 3px solid ${getCat(s.workout?.category).color}`">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-900 truncate">{{ s.workout?.name }}</p>
                <WorkoutCategoryBadge :category="s.workout?.category" />
              </div>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatFullDate(s.scheduled_date) }}</p>
            </div>
            <button v-if="!s.completed && isToday(s.scheduled_date)"
              @click="launch(s)" class="btn-accent text-xs py-1.5 px-3">Lancer</button>
            <button @click="remove(s)" class="text-gray-300 hover:text-red-400 text-sm">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Day modal -->
    <div v-if="selectedDay" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-4"
      @click.self="selectedDay = null">
      <div class="bg-white rounded-3xl p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto">
        <h3 class="font-semibold text-gray-900 mb-1">{{ formatFullDate(selectedDayDate) }}</h3>
        <p class="text-xs text-gray-400 mb-4">Sessions planifiées ce jour</p>

        <div v-if="selectedDaySessions.length > 0" class="space-y-2 mb-4">
          <div v-for="s in selectedDaySessions" :key="s.id"
            class="p-3 rounded-xl flex items-center gap-3"
            :style="`background:${getCat(s.workout?.category).bg}`">
            <span class="text-lg">{{ getCat(s.workout?.category).icon }}</span>
            <div class="flex-1">
              <p class="text-sm font-medium" :style="`color:${getCat(s.workout?.category).text}`">{{ s.workout?.name }}</p>
              <p class="text-xs opacity-60" :style="`color:${getCat(s.workout?.category).text}`">
                {{ s.completed ? '✓ terminée' : 'prévue' }}
              </p>
            </div>
            <button v-if="!s.completed && isToday(s.scheduled_date)"
              @click="launch(s)" class="text-xs bg-white/50 rounded-lg px-2 py-1 font-medium"
              :style="`color:${getCat(s.workout?.category).text}`">▶</button>
            <button @click="remove(s)" class="text-gray-400 text-sm">✕</button>
          </div>
        </div>

        <p class="text-xs font-semibold text-gray-500 mb-2">Planifier une séance</p>
        <div v-if="workouts.workouts.length === 0" class="text-xs text-gray-400 py-3 text-center">
          Crée d'abord une séance dans l'onglet Séances
        </div>
        <div v-else class="space-y-1.5 mb-3 max-h-64 overflow-y-auto">
          <button v-for="w in workouts.workouts" :key="w.id"
            @click="addToDay(w)"
            class="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 text-left">
            <span class="text-lg">{{ getCat(w.category).icon }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ w.name }}</p>
              <p class="text-xs text-gray-400">{{ w.workout_items?.length || 0 }} exercices</p>
            </div>
            <WorkoutCategoryBadge :category="w.category" />
          </button>
        </div>

        <button @click="selectedDay = null" class="btn-ghost w-full text-sm py-2">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanningStore } from '@/stores/planning'
import { useWorkoutsStore } from '@/stores/workouts'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { WORKOUT_CATEGORIES, getCategory } from '@/lib/categories'
import PageHeader from '@/components/ui/PageHeader.vue'
import WorkoutCategoryBadge from '@/components/ui/WorkoutCategoryBadge.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const planning = usePlanningStore()
const workouts = useWorkoutsStore()
const session = useSessionStore()
const router = useRouter()
const { show } = useToast()

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth())
const selectedDay = ref(null)

const days = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const categories = WORKOUT_CATEGORIES
const getCat = getCategory

const monthLabel = computed(() => `${monthNames[currentMonth.value]} ${currentYear.value}`)
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const firstDayOfMonth = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return d === 0 ? 6 : d - 1
})
const selectedDayDate = computed(() => selectedDay.value
  ? new Date(currentYear.value, currentMonth.value, selectedDay.value)
  : null)
const selectedDaySessions = computed(() =>
  selectedDayDate.value ? planning.getForDate(selectedDayDate.value) : []
)
const upcoming = computed(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return planning.scheduled
    .filter(s => new Date(s.scheduled_date) >= today && !s.completed)
    .slice(0, 5)
})

function getForDay(day) {
  return planning.getForDate(new Date(currentYear.value, currentMonth.value, day))
}

function cellClass(day) {
  const isToday = day === now.getDate() && currentMonth.value === now.getMonth() && currentYear.value === now.getFullYear()
  return [
    isToday ? 'ring-2 ring-offset-1' : '',
    selectedDay.value === day ? 'ring-2' : '',
  ]
}

function cellStyle(day) {
  const sessions = getForDay(day)
  const isToday = day === now.getDate() && currentMonth.value === now.getMonth() && currentYear.value === now.getFullYear()
  const isSelected = selectedDay.value === day

  let style = ''
  if (sessions.length === 1) {
    // Full color background
    const cat = getCat(sessions[0].workout?.category)
    const opacity = sessions[0].completed ? '0.4' : '1'
    style = `background:${cat.bg};`
    if (sessions[0].completed) style += 'opacity:0.55;'
  } else if (sessions.length === 0) {
    style = 'background:#f9fafb;'
  }
  // else: gradient handled below (leave default bg + stacked bars)

  if (isToday) style += '--tw-ring-color:#1a1a2e;'
  if (isSelected) style += '--tw-ring-color:#378ADD;'
  return style
}

function cellTextStyle(day) {
  const sessions = getForDay(day)
  if (sessions.length === 1) {
    const cat = getCat(sessions[0].workout?.category)
    return `color:${cat.text};font-weight:600;`
  }
  return 'color:#374151;'
}

function selectDay(day) { selectedDay.value = day }

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
  loadMonth()
}
function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
  loadMonth()
}
function goToday() {
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth()
  loadMonth()
}

async function loadMonth() {
  const y = currentYear.value
  const m = currentMonth.value
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const lastDay = new Date(y, m + 1, 0).getDate()
  const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  await planning.fetchScheduled(from, to)
}

async function addToDay(workout) {
  try {
    await planning.schedule(workout.id, selectedDayDate.value)
    show(`${workout.name} ajoutée`)
  } catch (e) {
    if (e.code === '23505') show('Déjà planifiée ce jour-là', 'warning')
    else show('Erreur', 'error')
  }
}

async function remove(s) {
  await planning.unschedule(s.id)
  show('Retirée du planning')
}

function launch(s) {
  if (!s.workout?.id) return
  const w = workouts.workouts.find(w => w.id === s.workout.id)
  if (!w) { show('Séance introuvable', 'error'); return }
  session.startSession(w)
  sessionStorage.setItem('scheduledSessionId', s.id)
  router.push(`/session/${w.id}`)
}

function isToday(dateStr) {
  const today = new Date().toISOString().slice(0, 10)
  return dateStr === today
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr', { weekday: 'long', day: '2-digit', month: 'long' })
}

onMounted(async () => {
  await workouts.fetchWorkouts()
  await loadMonth()
})
</script>

<style scoped>
.ring-2 { box-shadow: 0 0 0 2px var(--tw-ring-color, #1a1a2e); }
.ring-offset-1 { box-shadow: 0 0 0 1px #fff, 0 0 0 3px var(--tw-ring-color, #1a1a2e); }
</style>
