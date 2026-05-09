<template>
  <div class="pb-24">
    <ToastContainer />
    <PageHeader title="Mes séances" :subtitle="`${workouts.workouts.length} programme(s)`">
      <template #right>
        <router-link to="/workouts/new" class="btn-primary text-sm py-2 px-4">+ Nouveau</router-link>
      </template>
    </PageHeader>

    <div class="px-4 mt-4">
      <!-- Programme actif -->
      <ActiveProgramCard
        v-if="programs.activeSubscription"
        :subscription="programs.activeSubscription"
        :stats="programStats"
        @shift="askShift"
        @cancel="askCancel" />

      <!-- Carte "+ Ajouter un programme" si pas de programme actif -->
      <router-link v-else to="/programs"
        class="block w-full mb-4 active:scale-98 transition-transform">
        <div class="rounded-2xl py-6 px-4 text-center"
          style="border:2px dashed #cbd5e1; background:#fafafa">
          <span class="text-3xl block mb-1">➕</span>
          <p class="text-sm font-medium text-gray-500">Ajouter un programme</p>
          <p class="text-xs text-gray-400 mt-0.5">Hyrox, CrossFit, Force…</p>
        </div>
      </router-link>

      <!-- Skeleton pendant le chargement -->
      <div v-if="workouts.loading" class="space-y-2">
        <div v-for="n in 3" :key="n" class="card p-3 animate-pulse">
          <div class="flex items-center gap-2">
            <div class="w-6 h-10 bg-gray-100 rounded" />
            <div class="w-10 h-10 bg-gray-200 rounded-xl" />
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-gray-200 rounded w-2/3" />
              <div class="h-2 bg-gray-100 rounded w-1/3" />
            </div>
            <div class="w-10 h-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else-if="workouts.workouts.length === 0 && !programs.activeSubscription"
        class="text-center py-16">
        <div class="text-5xl mb-4">📋</div>
        <p class="text-gray-500 font-medium">Aucune séance créée</p>
        <p class="text-gray-400 text-sm mt-1 mb-6">Commence par construire ta première séance</p>
        <router-link to="/workouts/new" class="btn-primary inline-block">Créer une séance</router-link>
      </div>

      <!-- Liste -->
      <div v-else>
        <p v-if="workouts.workouts.length > 0" class="text-xs text-gray-400 mb-2 px-1">
          💡 Glisse vers la gauche pour plus d'actions · Maintiens ⋮⋮ pour réordonner
        </p>
        <div ref="listRef" class="space-y-2">
          <WorkoutListItem v-for="w in localList" :key="w.id"
            :workout="w"
            :reset-signal="resetSignal[w.id] || 0"
            @launch="startWorkout"
            @edit="goToEdit"
            @duplicate="duplicate"
            @delete="confirmDelete"
            @opened="onCardOpened" />
        </div>
      </div>
    </div>

    <!-- Confirm delete modal -->
    <div v-if="toDelete" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="toDelete = null">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Supprimer "{{ toDelete.name }}" ?</h3>
        <p class="text-sm text-gray-400 mb-5">Cette action est irréversible.</p>
        <div class="flex gap-3">
          <button @click="toDelete = null" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button @click="doDelete" class="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium">Supprimer</button>
        </div>
      </div>
    </div>

    <!-- Shift program modal -->
    <div v-if="showShiftModal" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="showShiftModal = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Décaler le programme</h3>
        <p class="text-sm text-gray-400 mb-4">
          Toutes les séances futures non complétées seront décalées de :
        </p>
        <div class="grid grid-cols-4 gap-2 mb-5">
          <button v-for="n in [1, 2, 3, 7]" :key="n"
            @click="shiftDays = n"
            class="py-3 rounded-xl text-sm font-medium transition-all"
            :style="shiftDays === n ? 'background:var(--brand);color:white' : 'background:#f9fafb;color:#475569'">
            {{ n }}j
          </button>
        </div>
        <div class="mb-5">
          <label class="block text-xs text-gray-400 mb-1">Ou personnalisé</label>
          <input v-model.number="shiftDays" type="number" min="1" max="60" class="input text-sm" />
        </div>
        <div class="flex gap-3">
          <button @click="showShiftModal = false" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button @click="doShift" :disabled="!shiftDays || shifting"
            class="btn-primary flex-1 text-sm py-2 disabled:opacity-40">
            <span v-if="shifting" class="animate-spin">⟳</span>
            <span v-else>Décaler</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel program modal -->
    <div v-if="showCancelModal" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="showCancelModal = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Annuler le programme ?</h3>
        <p class="text-sm text-gray-400 mb-5">
          Toutes les séances futures non complétées seront supprimées.
          Les séances déjà faites sont conservées.
        </p>
        <div class="flex gap-3">
          <button @click="showCancelModal = false" class="btn-ghost flex-1 text-sm py-2">Garder</button>
          <button @click="doCancel" :disabled="cancelling"
            class="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-40">
            <span v-if="cancelling" class="animate-spin">⟳</span>
            <span v-else>Annuler le programme</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '@/stores/workouts'
import { useSessionStore } from '@/stores/session'
import { useProgramsStore } from '@/stores/programs'
import { useToast } from '@/composables/useToast'
import { useSortable } from '@/composables/useSortable'
import PageHeader from '@/components/ui/PageHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ActiveProgramCard from '@/components/programs/ActiveProgramCard.vue'
import WorkoutListItem from '@/components/workout/WorkoutListItem.vue'

const workouts = useWorkoutsStore()
const session = useSessionStore()
const programs = useProgramsStore()
const router = useRouter()
const { show } = useToast()
const toDelete = ref(null)
const listRef = ref(null)
const localList = ref([])

// Reset signal pour fermer les cartes ouvertes
// On incrémente le numéro associé à un workout.id pour le forcer à se fermer
const resetSignal = ref({})

// Shift modal state
const showShiftModal = ref(false)
const shiftDays = ref(7)
const shifting = ref(false)

// Cancel modal state
const showCancelModal = ref(false)
const cancelling = ref(false)

watch(() => workouts.workouts, (list) => {
  localList.value = [...list]
}, { immediate: true })

// SortableJS configuré pour ne déclencher que sur le handle
useSortable(listRef, {
  handle: '.drag-handle',     // ⚠️ Seul l'élément avec cette classe déclenche le drag
  onEnd: async (oldIdx, newIdx) => {
    const moved = localList.value.splice(oldIdx, 1)[0]
    localList.value.splice(newIdx, 0, moved)
    try {
      await workouts.reorderWorkouts(localList.value.map(w => w.id))
    } catch (e) {
      show('Erreur lors du réordonnancement', 'error')
    }
  }
})

const programStats = computed(() => {
  if (!programs.activeSubscription) return null
  const subId = programs.activeSubscription.id
  const programWorkouts = workouts.workouts.filter(w => w.program_subscription_id === subId)
  const total = programWorkouts.length
  const totalWeeks = programs.activeSubscription.program?.duration_weeks || 0
  const startDate = new Date(programs.activeSubscription.started_at + 'T00:00:00')
  const today = new Date()
  const daysSinceStart = Math.floor((today - startDate) / 86400000)
  const currentWeek = Math.min(Math.floor(daysSinceStart / 7) + 1, totalWeeks)
  return {
    total,
    totalWeeks,
    currentWeek: Math.max(currentWeek, 1),
    progressPct: Math.min(Math.round((currentWeek / Math.max(totalWeeks, 1)) * 100), 100)
  }
})

// Quand une carte s'ouvre, on demande aux autres de se fermer
function onCardOpened(openedId) {
  for (const w of localList.value) {
    if (w.id !== openedId) {
      // Incrémente le signal pour ce workout : la carte se fermera
      resetSignal.value[w.id] = (resetSignal.value[w.id] || 0) + 1
    }
  }
}

function startWorkout(w) {
  session.startSession(w)
  router.push(`/session/${w.id}`)
}

function goToEdit(w) {
  router.push(`/workouts/edit/${w.id}`)
}

function confirmDelete(w) {
  toDelete.value = w
}

async function doDelete() {
  try {
    await workouts.deleteWorkout(toDelete.value.id)
    show('Séance supprimée')
  } catch {
    show('Erreur lors de la suppression', 'error')
  }
  toDelete.value = null
}

async function duplicate(w) {
  try {
    const copy = await workouts.duplicateWorkout(w.id)
    show(`Copie créée : ${copy.name}`)
  } catch (e) {
    show(e.message || 'Erreur lors de la duplication', 'error')
  }
}

function askShift() {
  shiftDays.value = 7
  showShiftModal.value = true
}

async function doShift() {
  if (!shiftDays.value || shiftDays.value < 1) return
  shifting.value = true
  try {
    await programs.shiftActiveProgram(shiftDays.value)
    show(`Programme décalé de ${shiftDays.value} jour(s) ✓`)
    showShiftModal.value = false
    await workouts.fetchWorkouts()
  } catch (e) {
    show(e.message || 'Erreur lors du décalage', 'error')
  }
  shifting.value = false
}

function askCancel() { showCancelModal.value = true }

async function doCancel() {
  cancelling.value = true
  try {
    await programs.cancelActiveProgram()
    show('Programme annulé')
    showCancelModal.value = false
    await workouts.fetchWorkouts()
  } catch (e) {
    show(e.message || 'Erreur lors de l\'annulation', 'error')
  }
  cancelling.value = false
}

onMounted(async () => {
  await Promise.all([
    workouts.fetchWorkouts(),
    programs.fetchActiveSubscription()
  ])
})
</script>
