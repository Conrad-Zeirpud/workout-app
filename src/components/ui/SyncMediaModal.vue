<template>
  <transition name="modal">
    <div v-if="visible" class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="cancelOrClose">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">

        <div v-if="state === 'idle'">
          <div class="text-center mb-4">
            <div class="text-4xl mb-2">🔄</div>
            <h3 class="font-bold text-gray-900 text-lg">Synchroniser les médias</h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ exercisesToSync.length }} exercice(s) sans visuel
            </p>
          </div>

          <div class="bg-gray-50 rounded-2xl p-4 mb-5 text-xs text-gray-600 space-y-1">
            <p>• Source : free-exercise-db (800+ exos, domaine public)</p>
            <p>• 2 images animées par exo (effet GIF)</p>
            <p>• Téléchargement du dataset une fois (~500 Ko)</p>
            <p>• Tu peux annuler à tout moment</p>
          </div>

          <div class="flex gap-3">
            <button @click="cancelOrClose" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
            <button @click="startSync" class="btn-accent flex-1 text-sm py-2 font-semibold">
              ▶ Lancer
            </button>
          </div>
        </div>

        <div v-else-if="state === 'loading'">
          <div class="text-center mb-4">
            <div class="text-3xl mb-2 animate-spin inline-block">⟳</div>
            <h3 class="font-bold text-gray-900 text-lg">Chargement du dataset…</h3>
            <p class="text-sm text-gray-500 mt-1">Cela peut prendre quelques secondes</p>
          </div>
        </div>

        <div v-else-if="state === 'running'">
          <div class="text-center mb-4">
            <div class="text-3xl mb-2 animate-spin inline-block">⟳</div>
            <h3 class="font-bold text-gray-900 text-lg">Matching en cours…</h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ progress.done }} / {{ progress.total }}
            </p>
          </div>

          <div class="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
            <div class="h-2 rounded-full transition-all"
              :style="`width:${progressPct}%;background:var(--accent)`" />
          </div>

          <div class="text-xs text-gray-400 text-center mb-4 truncate">
            {{ progress.current || '...' }}
          </div>

          <div class="grid grid-cols-3 gap-2 mb-5 text-center">
            <div class="p-2 bg-green-50 rounded-lg">
              <p class="text-xl font-bold text-green-600">{{ progress.found }}</p>
              <p class="text-xs text-gray-500">trouvés</p>
            </div>
            <div class="p-2 bg-gray-50 rounded-lg">
              <p class="text-xl font-bold text-gray-400">{{ progress.notFound }}</p>
              <p class="text-xs text-gray-500">non trouvés</p>
            </div>
            <div class="p-2 bg-red-50 rounded-lg">
              <p class="text-xl font-bold text-red-500">{{ progress.errors }}</p>
              <p class="text-xs text-gray-500">erreurs</p>
            </div>
          </div>

          <button @click="cancelSync" class="btn-ghost w-full text-sm py-2">
            ✕ Annuler
          </button>
        </div>

        <div v-else-if="state === 'done'">
          <div class="text-center mb-4">
            <div class="text-4xl mb-2">✓</div>
            <h3 class="font-bold text-gray-900 text-lg">Synchronisation terminée</h3>
          </div>

          <div class="grid grid-cols-3 gap-2 mb-5 text-center">
            <div class="p-3 bg-green-50 rounded-lg">
              <p class="text-2xl font-bold text-green-600">{{ progress.found }}</p>
              <p class="text-xs text-gray-500 mt-0.5">trouvés</p>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-2xl font-bold text-gray-400">{{ progress.notFound }}</p>
              <p class="text-xs text-gray-500 mt-0.5">non trouvés</p>
            </div>
            <div class="p-3 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-500">{{ progress.errors }}</p>
              <p class="text-xs text-gray-500 mt-0.5">erreurs</p>
            </div>
          </div>

          <p v-if="progress.notFound > 0" class="text-xs text-gray-400 text-center mb-4">
            Tu peux ajouter manuellement les visuels des non trouvés via leur fiche
          </p>

          <button @click="cancelOrClose" class="btn-accent w-full text-sm py-2 font-semibold">
            Fermer
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { fetchDataset, searchInDataset } from '@/lib/freeExerciseDb'
import { exerciseNameToQuery, SKIP_EXERCISES } from '@/lib/exerciseNameMap'
import { serializeMediaUrls } from '@/lib/exerciseMedia'
import { useWorkoutsStore } from '@/stores/workouts'

const props = defineProps({
  visible: Boolean,
  exercises: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'done'])

const workouts = useWorkoutsStore()

const state = ref('idle')
const progress = ref({
  total: 0, done: 0,
  found: 0, notFound: 0, errors: 0,
  current: ''
})
let cancelRequested = false

const exercisesToSync = computed(() =>
  props.exercises.filter(ex =>
    !ex.media_url && !SKIP_EXERCISES.has(ex.name)
  )
)

const progressPct = computed(() =>
  progress.value.total > 0
    ? Math.round((progress.value.done / progress.value.total) * 100)
    : 0
)

watch(() => props.visible, (v) => {
  if (v && state.value === 'done') {
    state.value = 'idle'
    progress.value = { total: 0, done: 0, found: 0, notFound: 0, errors: 0, current: '' }
  }
})

async function startSync() {
  state.value = 'loading'
  cancelRequested = false

  try {
    await fetchDataset()
  } catch (e) {
    console.error('Failed to load dataset', e)
    progress.value.errors = 1
    state.value = 'done'
    return
  }

  state.value = 'running'
  progress.value = {
    total: exercisesToSync.value.length,
    done: 0, found: 0, notFound: 0, errors: 0,
    current: ''
  }

  for (const ex of exercisesToSync.value) {
    if (cancelRequested) break

    progress.value.current = ex.name
    const query = exerciseNameToQuery(ex.name)

    try {
      const result = await searchInDataset(query)
      if (result?.imageUrls?.length > 0) {
        // Sérialise toutes les URLs (1 ou 2) en JSON ou string simple
        await workouts.updateExerciseMedia(ex.id, {
          media_url: serializeMediaUrls(result.imageUrls),
          media_type: 'image',
          external_id: result.externalId || null
        })
        progress.value.found++
      } else {
        progress.value.notFound++
      }
    } catch (e) {
      console.warn(`Sync failed for ${ex.name}:`, e.message)
      progress.value.errors++
    }

    progress.value.done++
    await new Promise(r => setTimeout(r, 10))
  }

  state.value = 'done'
  emit('done', { ...progress.value })
}

function cancelSync() {
  cancelRequested = true
  state.value = 'done'
}

function cancelOrClose() {
  if (state.value === 'running' || state.value === 'loading') {
    cancelSync()
  } else {
    emit('close')
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active > div, .modal-leave-active > div { transition: transform 0.25s; }
.modal-enter-from > div, .modal-leave-to > div { transform: translateY(20px); }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
