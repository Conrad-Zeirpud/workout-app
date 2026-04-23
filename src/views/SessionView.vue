<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <ToastContainer />

    <template v-if="session.active">
      <!-- Header dark -->
      <div class="px-4 pb-4" style="background:var(--brand); padding-top: max(2.5rem, env(safe-area-inset-top))">
        <div class="flex items-center justify-between mb-4">
          <button @click="confirmCancel = true" class="text-white/50 text-sm px-2 py-1 rounded-lg hover:bg-white/10">✕</button>
          <div class="text-center flex-1">
            <p class="text-white font-bold truncate mx-2">{{ session.workout?.name }}</p>
            <p class="text-white/50 text-xs">ex. {{ session.currentExerciseIndex + 1 }} / {{ session.totalExercises }}</p>
          </div>
          <div class="text-right min-w-16">
            <p class="text-white font-mono font-bold text-lg">{{ session.elapsedFormatted }}</p>
          </div>
        </div>
        <div class="w-full bg-white/20 rounded-full h-1">
          <div class="h-1 rounded-full transition-all duration-500" style="background:var(--accent)"
            :style="`width:${session.progress}%`" />
        </div>
      </div>

      <!-- Exercise tab strip -->
      <div class="flex px-3 pt-3 gap-1.5 overflow-x-auto pb-1 bg-white border-b border-gray-100 flex-shrink-0">
        <button v-for="(item, i) in session.workout?.workout_items" :key="item.id"
          @click="session.currentExerciseIndex = i"
          class="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="i === session.currentExerciseIndex
            ? 'text-white'
            : allSetsDone(item) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
          :style="i === session.currentExerciseIndex ? 'background:var(--accent)' : ''">
          <span v-if="allSetsDone(item) && i !== session.currentExerciseIndex">✓</span>
          {{ item.exercise?.name || `Ex. ${i+1}` }}
        </button>
      </div>

      <!-- Current exercise panel -->
      <div v-if="session.currentExercise" class="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-gray-100">💪</div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-gray-900">{{ session.currentExercise.exercise?.name }}</h2>
            <div class="flex items-center gap-2 flex-wrap mt-0.5">
              <span class="badge bg-gray-100 text-gray-500 text-xs">{{ session.currentExercise.exercise?.muscle_group }}</span>
              <span class="text-xs text-gray-400">{{ session.currentExercise.sets }} × {{ session.currentExercise.reps }} reps · repos {{ session.currentExercise.rest_seconds }}s</span>
            </div>
          </div>
        </div>

        <!-- Previous best -->
        <div v-if="previousBest" class="mb-3 px-3 py-2 bg-blue-50 rounded-xl flex items-center gap-2">
          <span class="text-blue-400 text-sm">📊</span>
          <p class="text-xs text-blue-700">
            Dernière fois : <strong>{{ previousBest.weight_kg }}kg × {{ previousBest.reps_done }} reps</strong>
          </p>
        </div>

        <!-- Set rows -->
        <div class="space-y-2">
          <SetRow
            v-for="set in currentSets"
            :key="set.set_number"
            :set="set"
            @complete="handleCompleteSet"
          />
        </div>

        <div v-if="session.currentExercise.exercise?.notes" class="mt-3 p-3 bg-amber-50 rounded-xl">
          <p class="text-xs text-amber-700">📝 {{ session.currentExercise.exercise.notes }}</p>
        </div>
      </div>

      <!-- Bottom controls -->
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

      <!-- Rest overlay -->
      <RestTimerOverlay :next-exercise-name="nextExerciseName" />
    </template>

    <div v-else class="flex-1 flex items-center justify-center text-gray-400">
      <p class="text-sm">Chargement de la séance…</p>
    </div>

    <!-- Cancel confirm -->
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
import { useToast } from '@/composables/useToast'
import RestTimerOverlay from '@/components/session/RestTimerOverlay.vue'
import SetRow from '@/components/session/SetRow.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const workouts = useWorkoutsStore()
const stats = useStatsStore()
const { show } = useToast()
const confirmCancel = ref(false)
const finishing = ref(false)
const previousBest = ref(null)

const currentSets = computed(() =>
  session.currentExercise ? session.getSetsForExercise(session.currentExercise.exercise_id) : []
)

const nextExerciseName = computed(() => {
  const items = session.workout?.workout_items
  const next = items?.[session.currentExerciseIndex + 1]
  return next?.exercise?.name || null
})

function allSetsDone(item) {
  return session.getSetsForExercise(item.exercise_id).every(s => s.done)
}

async function loadPreviousBest() {
  if (!session.currentExercise?.exercise_id) return
  const history = await stats.fetchExerciseHistory(session.currentExercise.exercise_id)
  previousBest.value = history.length > 0 ? history[history.length - 1] : null
}

function handleCompleteSet(set) {
  session.completeSet(set)
}

async function finish() {
  finishing.value = true
  try {
    const completedSets = session.sets.filter(s => s.done).map(s => ({
      ...s,
      exercise: session.workout?.workout_items?.find(i => i.exercise_id === s.exercise_id)?.exercise
    }))
    const workoutName = session.workout?.name || 'Séance'
    const result = await session.finishSession()
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
