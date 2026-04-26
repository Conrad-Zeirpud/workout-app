<template>
  <div class="pb-24">
    <ToastContainer />
    <PageHeader title="Mes séances" :subtitle="`${workouts.workouts.length} programme(s)`">
      <template #right>
        <router-link to="/workouts/new" class="btn-primary text-sm py-2 px-4">+ Nouveau</router-link>
      </template>
    </PageHeader>

    <div class="px-4 mt-4">
      <div v-if="workouts.loading" class="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      <div v-else-if="workouts.workouts.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">📋</div>
        <p class="text-gray-500 font-medium">Aucune séance créée</p>
        <p class="text-gray-400 text-sm mt-1 mb-6">Commence par construire ta première séance</p>
        <router-link to="/workouts/new" class="btn-primary inline-block">Créer une séance</router-link>
      </div>
      <div v-else class="space-y-3">
        <div v-for="w in workouts.workouts" :key="w.id" class="relative">
          <WorkoutCard :workout="w" @start="startWorkout(w)" />
          <div class="absolute top-2 right-2 flex gap-1">
            <button @click="duplicate(w)" :title="'Dupliquer'"
              class="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-brand text-sm">📋</button>
            <button @click="confirmDelete(w)" :title="'Supprimer'"
              class="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 text-xs">✕</button>
          </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '@/stores/workouts'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import WorkoutCard from '@/components/workout/WorkoutCard.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const workouts = useWorkoutsStore()
const session = useSessionStore()
const router = useRouter()
const { show } = useToast()
const toDelete = ref(null)

function startWorkout(w) {
  session.startSession(w)
  router.push(`/session/${w.id}`)
}

function confirmDelete(w) { toDelete.value = w }
async function doDelete() {
  try {
    await workouts.deleteWorkout(toDelete.value.id)
    show('Séance supprimée')
  } catch { show('Erreur lors de la suppression', 'error') }
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

onMounted(() => workouts.fetchWorkouts())
</script>
