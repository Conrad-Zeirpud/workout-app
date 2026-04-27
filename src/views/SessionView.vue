<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <ToastContainer />

    <template v-if="session.active">
      <div class="px-4 pb-3" :style="`background:${headerColor}; padding-top: max(2.5rem, env(safe-area-inset-top))`">
        <div class="flex items-center justify-between mb-3">
          <button @click="confirmCancel = true" class="text-white/50 text-sm px-2 py-1 rounded-lg hover:bg-white/10">✕</button>
          <div class="text-center flex-1">
            <p class="text-white font-bold truncate mx-2">{{ session.workout?.name }}</p>
            <p class="text-white/60 text-xs">{{ sectionLabel }} · ex. {{ session.currentExerciseIndex + 1 }} / {{ session.totalExercises }}</p>
          </div>
          <div class="text-right min-w-16">
            <p class="text-white font-mono font-bold text-lg">{{ session.elapsedFormatted }}</p>
          </div>
        </div>
        <div class="flex gap-1 mb-2">
          <div v-if="session.hasWarmup" class="flex-1 h-1 rounded-full"
            :style="`background:${getSectionColor('warmup', sectionState('warmup'))}`" />
          <div v-if="session.hasMain" class="flex-1 h-1 rounded-full"
            :style="`background:${getSectionColor('main', sectionState('main'))}`" />
          <div v-if="session.hasWod" class="flex-1 h-1 rounded-full"
            :style="`background:${getSectionColor('wod', sectionState('wod'))}`" />
        </div>
        <div class="w-full bg-white/15 rounded-full h-1">
          <div class="h-1 rounded-full transition-all duration-500 bg-white/70"
            :style="`width:${session.progress}%`" />
        </div>
      </div>

      <!-- WOD entry banner -->
      <div v-if="session.currentSection === 'wod' && session.workout?.wod_mode"
        class="px-4 py-3 flex items-center gap-3" style="background:#FCEBEB; border-bottom:1px solid #fbcaca">
        <span class="text-xl">{{ wodModeIcon }}</span>
        <div class="flex-1">
          <p class="text-xs font-semibold uppercase tracking-wide" style="color:#A32D2D">
            WOD {{ wodModeLabel }}
          </p>
          <p class="text-xs" style="color:#A32D2D;opacity:0.7">{{ wodConfigLabel }}</p>
        </div>
        <button @click="launchWodTimer" class="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
          ⏱ Démarrer
        </button>
      </div>

      <!-- Section tabs -->
      <div class="flex px-3 py-2 gap-1.5 overflow-x-auto bg-white border-b border-gray-100 flex-shrink-0">
        <button v-if="session.hasWarmup"
          @click="session.jumpToSection('warmup')"
          class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
          :class="session.currentSection === 'warmup' ? 'text-white' : 'bg-gray-100 text-gray-500'"
          :style="session.currentSection === 'warmup' ? 'background:#EF9F27' : ''">🔥 Échauffement</button>
        <button v-if="session.hasMain"
          @click="session.jumpToSection('main')"
          class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
          :class="session.currentSection === 'main' ? 'text-white' : 'bg-gray-100 text-gray-500'"
          :style="session.currentSection === 'main' ? 'background:#639922' : ''">💪 Exos</button>
        <button v-if="session.hasWod"
          @click="session.jumpToSection('wod')"
          class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
          :class="session.currentSection === 'wod' ? 'text-white' : 'bg-gray-100 text-gray-500'"
          :style="session.currentSection === 'wod' ? 'background:#E24B4A' : ''">🏁 WOD</button>
      </div>

      <div class="flex px-3 pt-2 gap-1 overflow-x-auto pb-2 bg-white border-b border-gray-100 flex-shrink-0">
        <button v-for="(item, i) in session.orderedItems" :key="item.id"
          @click="session.currentExerciseIndex = i"
          class="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="i === session.currentExerciseIndex
            ? 'text-white'
            : allSetsDone(item) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
          :style="i === session.currentExerciseIndex ? `background:${currentSectionColor}` : ''">
          <span v-if="allSetsDone(item) && i !== session.currentExerciseIndex">✓</span>
          {{ item.exercise?.name || `Ex.` }}
        </button>
      </div>

      <div v-if="session.currentExercise" class="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            :style="`background:${currentSectionBg}`">{{ unitInfo(session.currentExercise).icon }}</div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-gray-900">{{ session.currentExercise.exercise?.name }}</h2>
            <div class="flex items-center gap-2 flex-wrap mt-0.5">
              <span class="badge bg-gray-100 text-gray-500 text-xs">{{ session.currentExercise.exercise?.muscle_group }}</span>
              <span class="text-xs text-gray-400">{{ describePrescription(session.currentExercise) }}</span>
            </div>
          </div>
        </div>

        <div v-if="previousBest" class="mb-3 px-3 py-2 bg-blue-50 rounded-xl flex items-center gap-2">
          <span class="text-blue-400 text-sm">📊</span>
          <p class="text-xs text-blue-700">
            Dernière fois : <strong>{{ describePrevious(previousBest) }}</strong>
          </p>
        </div>

        <div class="space-y-2">
          <SetRow
            v-for="set in currentSets"
            :key="set.set_number"
            :set="set"
            :unit="session.currentExercise.exercise?.unit || 'weight'"
            @complete="handleCompleteSet"
          />
        </div>
      </div>

      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3"
        style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))">
        <div class="flex gap-3">
          <button @click="session.prevExercise()"
            :disabled="session.currentExerciseIndex === 0"
            class="btn-ghost flex-1 text-sm py-3 disabled:opacity-30">← Préc.</button>
          <button v-if="session.currentExerciseIndex < session.totalExercises - 1"
            @click="session.nextExercise()"
            class="btn-accent flex-1 text-sm py-3">Suivant →</button>
          <button v-else @click="finish()" :disabled="finishing"
            class="flex-1 text-sm py-3 font-semibold rounded-xl text-white flex items-center justify-center gap-2"
            style="background:var(--accent)">
            <span v-if="finishing" class="animate-spin text-xs">⟳</span>
            🏁 Terminer
          </button>
        </div>
      </div>

      <RestTimerOverlay :next-exercise-name="nextExerciseName" />
    </template>

    <div v-else class="flex-1 flex items-center justify-center text-gray-400">
      <p class="text-sm">Chargement…</p>
    </div>

    <div v-if="confirmCancel" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="confirmCancel = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Quitter la séance ?</h3>
        <p class="text-sm text-gray-400 mb-5">La progression sera perdue.</p>
        <div class="flex gap-3">
          <button @click="confirmCancel = false" class="btn-ghost flex-1 text-sm py-2">Continuer</button>
          <button @click="cancel()" class="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium">Quitter</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useWorkoutsStore } from '@/stores/workouts'
import { useStatsStore } from '@/stores/stats'
import { useWodTimerStore } from '@/stores/wodTimer'
import { useToast } from '@/composables/useToast'
import { describePrescription, getUnit } from '@/lib/units'
import RestTimerOverlay from '@/components/session/RestTimerOverlay.vue'
import SetRow from '@/components/session/SetRow.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const workouts = useWorkoutsStore()
const stats = useStatsStore()
const wod = useWodTimerStore()
const { show } = useToast()
const confirmCancel = ref(false)
const finishing = ref(false)
const previousBest = ref(null)

const currentSets = computed(() =>
  session.currentExercise ? session.getSetsForExercise(session.currentExercise.exercise_id) : []
)

const nextExerciseName = computed(() => {
  const next = session.orderedItems[session.currentExerciseIndex + 1]
  return next?.exercise?.name || null
})

const sectionLabel = computed(() => ({
  warmup: 'Échauffement', main: 'Exercices', wod: 'WOD'
}[session.currentSection]))

const headerColor = computed(() => ({
  warmup: '#854F0B',
  main: '#1a1a2e',
  wod: '#A32D2D'
}[session.currentSection] || '#1a1a2e'))

const currentSectionColor = computed(() => ({
  warmup: '#EF9F27', main: '#639922', wod: '#E24B4A'
}[session.currentSection] || '#639922'))

const currentSectionBg = computed(() => ({
  warmup: '#FAEEDA', main: '#EAF3DE', wod: '#FCEBEB'
}[session.currentSection] || '#EAF3DE'))

const wodModeIcon = computed(() => ({
  amrap: '🔁', emom: '⏱️', fortime: '🏁', tabata: '🔥', interval: '🔂'
}[session.workout?.wod_mode] || ''))

const wodModeLabel = computed(() => ({
  amrap: 'AMRAP', emom: 'EMOM', fortime: 'For Time', tabata: 'Tabata', interval: 'Intervalles'
}[session.workout?.wod_mode] || ''))

const wodConfigLabel = computed(() => {
  const m = session.workout?.wod_mode
  const c = session.workout?.wod_config || {}
  if (m === 'amrap') return `${Math.floor(c.totalSeconds / 60)} min`
  if (m === 'emom') return `${c.rounds} rounds × ${formatInterval(c.intervalSeconds || 60)}`
  if (m === 'fortime') return c.cap > 0 ? `Cap ${Math.floor(c.cap / 60)} min` : 'Sans limite'
  if (m === 'tabata' || m === 'interval')
    return `${c.workSeconds}s / ${c.restSeconds}s × ${c.rounds}`
  return ''
})

function formatInterval(sec) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (s === 0) return `${m} min`
  return `${m}min${s}s`
}

function unitInfo(item) { return getUnit(item.exercise?.unit) }

function describePrevious(prev) {
  if (!prev) return ''
  const u = session.currentExercise?.exercise?.unit || 'weight'
  if (u === 'weight') return `${prev.weight_kg}kg × ${prev.reps_done} reps`
  if (u === 'reps') return `${prev.reps_done} reps`
  if (u === 'calories') return `${prev.reps_done} cal`
  if (u === 'meters') return `${prev.reps_done}m`
  if (u === 'seconds') return `${prev.reps_done}s`
  return `${prev.reps_done}`
}

function sectionState(section) {
  const items = session.orderedItems.filter(i => (i.section || 'main') === section)
  if (items.length === 0) return 'absent'
  const allDone = items.every(i => allSetsDone(i))
  if (allDone) return 'done'
  if (section === session.currentSection) return 'current'
  const sectionOrder = { warmup: 0, main: 1, wod: 2 }
  if (sectionOrder[section] < sectionOrder[session.currentSection]) return 'done'
  return 'pending'
}

function getSectionColor(section, state) {
  const baseColors = { warmup: '#EF9F27', main: '#639922', wod: '#E24B4A' }
  if (state === 'done') return baseColors[section]
  if (state === 'current') return 'rgba(255,255,255,0.7)'
  return 'rgba(255,255,255,0.2)'
}

function allSetsDone(item) {
  return session.getSetsForExercise(item.exercise_id).every(s => s.done)
}

function launchWodTimer() {
  if (!session.workout?.wod_mode || !session.workout?.wod_config) return
  wod.start(session.workout.wod_mode, [session.workout.wod_config], 0)
  router.push('/timer/run')
}

async function loadPreviousBest() {
  if (!session.currentExercise?.exercise_id) return
  const history = await stats.fetchExerciseHistory(session.currentExercise.exercise_id)
  previousBest.value = history.length > 0 ? history[history.length - 1] : null
}

function handleCompleteSet(set) { session.completeSet(set) }

async function finish() {
  finishing.value = true
  try {
    const completedSets = session.sets.filter(s => s.done).map(s => ({
      ...s,
      exercise: session.orderedItems.find(i => i.exercise_id === s.exercise_id)?.exercise
    }))
    const workoutName = session.workout?.name || 'Séance'
    const result = await session.finishSession()
    const scheduledId = sessionStorage.getItem('scheduledSessionId')
    if (scheduledId && result.sessionId) {
      const { usePlanningStore } = await import('@/stores/planning')
      const planning = usePlanningStore()
      try { await planning.markCompleted(scheduledId, result.sessionId) } catch {}
      sessionStorage.removeItem('scheduledSessionId')
    }
    router.push({
      name: 'session-summary',
      state: { duration: result.duration, workoutName, setsCount: result.setsCount, sessionId: result.sessionId, completedSets }
    })
  } catch (e) {
    show(e.message || 'Erreur lors de la sauvegarde', 'error')
    finishing.value = false
  }
}

function cancel() {
  session.cancelSession()
  router.push('/')
}

watch(() => session.currentExerciseIndex, loadPreviousBest)

onMounted(async () => {
  if (!session.active) {
    await workouts.fetchWorkouts()
    const w = workouts.workouts.find(w => w.id === route.params.workoutId)
    if (w) session.startSession(w)
    else { router.push('/'); return }
  }
  loadPreviousBest()
})
</script>
