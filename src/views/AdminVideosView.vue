<template>
  <div class="pb-24">
    <ToastContainer />
    <PageHeader title="Admin · Vidéos" subtitle="Gérer les vidéos des exercices" back @back="$router.back()" />

    <!-- Bloc d'accès interdit si pas admin -->
    <div v-if="!isAdmin" class="px-4 mt-12 text-center">
      <div class="text-5xl mb-4">🚫</div>
      <p class="font-bold text-gray-900">Accès réservé</p>
      <p class="text-sm text-gray-500 mt-2">Cette page est réservée aux administrateurs.</p>
    </div>

    <div v-else class="px-4 mt-4">
      <!-- Stats -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="card p-3 text-center">
          <p class="text-xl font-bold text-gray-900">{{ stats.total }}</p>
          <p class="text-xs text-gray-400 mt-0.5">total</p>
        </div>
        <div class="card p-3 text-center">
          <p class="text-xl font-bold" style="color:#639922">{{ stats.withVideo }}</p>
          <p class="text-xs text-gray-400 mt-0.5">avec vidéo</p>
        </div>
        <div class="card p-3 text-center">
          <p class="text-xl font-bold text-gray-300">{{ stats.withoutVideo }}</p>
          <p class="text-xs text-gray-400 mt-0.5">sans</p>
        </div>
      </div>

      <!-- Search + filter -->
      <input v-model="search"
        type="text"
        placeholder="Rechercher un exercice…"
        class="input mb-3" />

      <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button @click="filter = 'all'"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          :class="filter === 'all' ? 'text-white' : 'bg-gray-100 text-gray-600'"
          :style="filter === 'all' ? 'background:var(--brand)' : ''">
          Tous ({{ stats.total }})
        </button>
        <button @click="filter = 'missing'"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          :class="filter === 'missing' ? 'text-white' : 'bg-gray-100 text-gray-600'"
          :style="filter === 'missing' ? 'background:#A32D2D' : ''">
          Sans vidéo ({{ stats.withoutVideo }})
        </button>
        <button @click="filter = 'with'"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          :class="filter === 'with' ? 'text-white' : 'bg-gray-100 text-gray-600'"
          :style="filter === 'with' ? 'background:#639922' : ''">
          Avec vidéo ({{ stats.withVideo }})
        </button>
      </div>

      <!-- Liste -->
      <div class="space-y-2">
        <div v-for="ex in filteredList" :key="ex.id"
          @click="openUploader(ex)"
          class="card p-3 flex items-center gap-3 cursor-pointer active:scale-98 transition-transform">
          <!-- Indicateur visuel -->
          <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
            :style="ex.media_type === 'video' ? 'background:#EAF3DE' : 'background:#F3F4F6'">
            {{ ex.media_type === 'video' ? '🎥' : '📸' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ ex.name }}</p>
            <p class="text-xs text-gray-400 truncate">
              {{ ex.muscle_group }} · {{ ex.equipment || 'PdC' }}
            </p>
          </div>
          <div class="flex-shrink-0">
            <span v-if="ex.media_type === 'video'" class="text-xs font-medium" style="color:#639922">
              ✓ Vidéo
            </span>
            <span v-else class="text-xs text-gray-400">+ Ajouter</span>
          </div>
        </div>

        <div v-if="filteredList.length === 0" class="text-center py-12 text-gray-400 text-sm">
          Aucun exercice ne correspond à ta recherche
        </div>
      </div>
    </div>

    <VideoUploaderModal
      :visible="!!selectedExercise"
      :exercise="selectedExercise"
      @close="selectedExercise = null"
      @updated="onUpdated" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWorkoutsStore } from '@/stores/workouts'
import { useIsAdmin } from '@/composables/useIsAdmin'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import VideoUploaderModal from '@/components/admin/VideoUploaderModal.vue'

const workouts = useWorkoutsStore()
const { isAdmin } = useIsAdmin()
const { show } = useToast()

const search = ref('')
const filter = ref('all')   // 'all' | 'missing' | 'with'
const selectedExercise = ref(null)

const stats = computed(() => {
  const all = workouts.exercises || []
  const withVideo = all.filter(e => e.media_type === 'video').length
  return {
    total: all.length,
    withVideo,
    withoutVideo: all.length - withVideo
  }
})

const filteredList = computed(() => {
  let list = workouts.exercises || []
  // Filtre vidéo
  if (filter.value === 'missing') list = list.filter(e => e.media_type !== 'video')
  if (filter.value === 'with') list = list.filter(e => e.media_type === 'video')
  // Filtre recherche
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.muscle_group?.toLowerCase().includes(q)
    )
  }
  return list.slice().sort((a, b) => a.name.localeCompare(b.name))
})

function openUploader(ex) {
  selectedExercise.value = ex
}

async function onUpdated() {
  // Refresh la liste pour afficher la nouvelle URL
  await workouts.fetchExercises()
  // On garde la modale ouverte avec les nouvelles infos
  if (selectedExercise.value) {
    const fresh = workouts.exercises.find(e => e.id === selectedExercise.value.id)
    if (fresh) selectedExercise.value = fresh
  }
  show('Vidéo mise à jour ✓')
}

onMounted(async () => {
  if (workouts.exercises.length === 0) {
    await workouts.fetchExercises()
  }
})
</script>
