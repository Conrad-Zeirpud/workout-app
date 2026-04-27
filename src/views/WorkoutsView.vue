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

      <div v-else>
        <p class="text-xs text-gray-400 mb-2">💡 Maintiens un appui long sur une carte pour la réordonner</p>
        <div ref="listRef" class="space-y-3">
          <div v-for="w in localList" :key="w.id"
            class="card p-4 flex items-center gap-3 drag-handle"
            :data-id="w.id"
            :style="`border-left: 3px solid ${getCat(w.category).color}`">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              :style="`background:${getCat(w.category).bg}`">
              {{ getCat(w.category).icon }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 truncate">{{ w.name }}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ w.workout_items?.length || 0 }} exercices
                <span v-if="w.description"> · {{ w.description }}</span>
              </p>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button @click.stop="duplicate(w)" :title="'Dupliquer'"
                class="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">📋</button>
              <button @click.stop="confirmDelete(w)" :title="'Supprimer'"
                class="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center text-red-500 text-sm">🗑</button>
              <router-link :to="`/workouts/${w.id}/edit`" @click.stop
                class="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">✏️</router-link>
              <button @click.stop="startWorkout(w)" :title="'Lancer'"
                class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm"
                style="background:var(--accent)">▶</button>
            </div>
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
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '@/stores/workouts'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { useSortable } from '@/composables/useSortable'
import { getCategory } from '@/lib/categories'
import PageHeader from '@/components/ui/PageHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const workouts = useWorkoutsStore()
const session = useSessionStore()
const router = useRouter()
const { show } = useToast()
const toDelete = ref(null)
const listRef = ref(null)
const localList = ref([])
const getCat = getCategory

watch(() => workouts.workouts, (list) => {
  localList.value = [...list]
}, { immediate: true })

useSortable(listRef, {
  onEnd: async (oldIdx, newIdx) => {
    const moved = localList.value.splice(oldIdx, 1)[0]
    localList.value.splice(newIdx, 0, moved)
    // Save new order to DB (display_order column needed - see SQL)
    try {
      await workouts.reorderWorkouts(localList.value.map(w => w.id))
    } catch (e) {
      show('Erreur lors du réordonnancement', 'error')
    }
  }
})

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
