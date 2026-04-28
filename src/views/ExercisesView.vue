<template>
  <div class="pb-24">
    <ToastContainer />
    <PageHeader title="Exercices" back />

    <ExercisePreviewOverlay
      :visible="!!previewExercise"
      :exercise="previewExercise"
      @close="previewExercise = null" />

    <div class="px-4 mt-4">
      <button @click="showForm = true"
        class="w-full mb-4 py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white text-base active:scale-95 transition-transform"
        style="background:linear-gradient(135deg,#1a1a2e,#2d2d5e); box-shadow:0 6px 20px rgba(26,26,46,0.25)">
        <span class="text-xl">➕</span>
        Créer un exercice personnalisé
      </button>

      <input v-model="search" placeholder="Rechercher un exercice…" class="input mb-3" />

      <div class="flex gap-2 overflow-x-auto pb-2 mb-3">
        <button @click="filterSection = ''"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="filterSection === '' ? 'text-white' : 'bg-gray-100 text-gray-600'"
          :style="filterSection === '' ? 'background:var(--brand)' : ''">Tout</button>
        <button @click="filterSection = 'warmup'"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          :style="filterSection === 'warmup' ? 'background:#EF9F27;color:white' : 'background:#FAEEDA;color:#854F0B'">
          🔥 Warmup
        </button>
        <button @click="filterSection = 'main'"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          :style="filterSection === 'main' ? 'background:#639922;color:white' : 'background:#EAF3DE;color:#3B6D11'">
          💪 Exos
        </button>
        <button @click="filterSection = 'wod'"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          :style="filterSection === 'wod' ? 'background:#E24B4A;color:white' : 'background:#FCEBEB;color:#A32D2D'">
          🏁 WOD
        </button>
      </div>

      <p class="text-xs text-gray-400 mb-2">{{ filtered.length }} exercice(s)</p>

      <div v-if="workouts.loading" class="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      <div v-else-if="filtered.length === 0" class="text-center py-12 text-gray-400 text-sm">
        Aucun exercice trouvé
      </div>
      <div v-else class="space-y-2">
        <div v-for="ex in filtered" :key="ex.id" class="card p-3 flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">💪</div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate">{{ ex.name }}</p>
            <p class="text-xs text-gray-400 truncate">
              {{ ex.muscle_group }}<span v-if="ex.equipment"> · {{ ex.equipment }}</span>
            </p>
          </div>
          <div class="flex flex-col gap-1 items-end flex-shrink-0">
            <PreviewButton :exercise="ex" @preview="previewExercise = ex" />
            <button @click="openMediaEdit(ex)"
              class="text-[10px] text-gray-400 underline">
              {{ ex.media_url ? 'Modifier média' : '+ Ajouter média' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create exercise modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="showForm = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-4">Nouvel exercice</h3>
        <div class="space-y-3 mb-5 max-h-[60vh] overflow-y-auto">
          <input v-model="form.name" placeholder="Nom *" class="input" />
          <select v-model="form.muscle_group" class="input">
            <option value="">Groupe musculaire</option>
            <option v-for="g in muscleGroups" :key="g">{{ g }}</option>
          </select>
          <select v-model="form.equipment" class="input">
            <option value="">Équipement</option>
            <option v-for="eq in equipmentList" :key="eq">{{ eq }}</option>
          </select>
          <select v-model="form.unit" class="input">
            <option value="weight">Poids + reps</option>
            <option value="reps">Reps seules</option>
            <option value="calories">Calories</option>
            <option value="meters">Distance (m)</option>
            <option value="seconds">Durée (sec)</option>
          </select>
          <div>
            <p class="text-xs text-gray-500 mb-2">Utilisable en :</p>
            <div class="flex gap-2">
              <button v-for="s in ['warmup','main','wod']" :key="s" type="button"
                @click="toggleSection(s)"
                class="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                :style="form.applicable_sections.includes(s) ? sectionBadgeStyle(s) : 'background:#f9fafb;color:#9ca3af'">
                {{ sectionLabelLong(s) }}
              </button>
            </div>
          </div>
          <textarea v-model="form.notes" placeholder="Notes (optionnel)" rows="2" class="input resize-none" />
        </div>
        <div class="flex gap-3">
          <button @click="showForm = false" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button @click="create" class="btn-primary flex-1 text-sm py-2">Créer</button>
        </div>
      </div>
    </div>

    <!-- Media edit modal -->
    <div v-if="mediaEditTarget" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="closeMediaEdit">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Visuel pour "{{ mediaEditTarget.name }}"</h3>
        <p class="text-xs text-gray-400 mb-4">URL d'un GIF, image ou vidéo YouTube</p>

        <div class="space-y-3 mb-4">
          <input v-model="mediaForm.url" placeholder="https://…" class="input text-sm" />

          <button @click="searchExerciseDb"
            :disabled="searching"
            class="w-full py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium flex items-center justify-center gap-2">
            <span v-if="searching" class="animate-spin">⟳</span>
            🔍 Chercher sur ExerciseDB
          </button>

          <div v-if="searchResult" class="p-3 bg-gray-50 rounded-xl">
            <p class="text-xs font-medium text-gray-700">Trouvé : {{ searchResult.name }}</p>
            <img v-if="searchResult.gifUrl" :src="searchResult.gifUrl"
              class="w-full h-32 object-contain rounded mt-2" />
            <button @click="useSearchResult"
              class="w-full mt-2 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium">
              Utiliser ce visuel
            </button>
          </div>
          <p v-else-if="searchAttempted" class="text-xs text-gray-400 text-center">
            Aucun résultat trouvé sur ExerciseDB
          </p>
        </div>

        <div class="flex gap-3">
          <button @click="closeMediaEdit" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button v-if="mediaEditTarget.media_url" @click="clearMedia"
            class="text-red-500 text-sm font-medium px-3">Retirer</button>
          <button @click="saveMedia"
            class="btn-primary flex-1 text-sm py-2">Enregistrer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWorkoutsStore } from '@/stores/workouts'
import { useToast } from '@/composables/useToast'
import { searchExerciseDB, detectMediaType } from '@/lib/exerciseMedia'
import PageHeader from '@/components/ui/PageHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ExercisePreviewOverlay from '@/components/ui/ExercisePreviewOverlay.vue'
import PreviewButton from '@/components/ui/PreviewButton.vue'

const workouts = useWorkoutsStore()
const { show } = useToast()
const search = ref('')
const filterSection = ref('')
const showForm = ref(false)
const previewExercise = ref(null)

const form = ref({
  name: '', muscle_group: '', equipment: '',
  unit: 'weight', applicable_sections: ['main'], notes: ''
})

const mediaEditTarget = ref(null)
const mediaForm = ref({ url: '' })
const searching = ref(false)
const searchResult = ref(null)
const searchAttempted = ref(false)

const muscleGroups = ['Pectoraux','Dos','Épaules','Biceps','Triceps','Jambes','Fessiers','Abdominaux','Avant-bras','Full Body','Cardio','Mobilité']
const equipmentList = ['Barre','Haltères','Poulie','Machine','Poids du corps','Kettlebell','Aucun']

const filtered = computed(() =>
  workouts.exercises.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.value.toLowerCase())
    const sections = e.applicable_sections || ['main']
    const matchSection = !filterSection.value || sections.includes(filterSection.value)
    return matchSearch && matchSection
  })
)

function sectionLabelLong(s) { return ({ warmup: '🔥 Warmup', main: '💪 Exos', wod: '🏁 WOD' }[s] || s) }
function sectionBadgeStyle(s) {
  return ({
    warmup: 'background:#FAEEDA;color:#854F0B',
    main:   'background:#EAF3DE;color:#3B6D11',
    wod:    'background:#FCEBEB;color:#A32D2D'
  }[s] || 'background:#f3f4f6;color:#6b7280')
}

function toggleSection(s) {
  const arr = form.value.applicable_sections
  const idx = arr.indexOf(s)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(s)
  if (arr.length === 0) arr.push('main')
}

async function create() {
  if (!form.value.name.trim()) return show('Nom requis', 'error')
  try {
    await workouts.createExercise({ ...form.value })
    showForm.value = false
    form.value = { name: '', muscle_group: '', equipment: '', unit: 'weight', applicable_sections: ['main'], notes: '' }
    show('Exercice créé ✓')
  } catch { show('Erreur', 'error') }
}

function openMediaEdit(ex) {
  mediaEditTarget.value = ex
  mediaForm.value.url = ex.media_url || ''
  searchResult.value = null
  searchAttempted.value = false
}

function closeMediaEdit() {
  mediaEditTarget.value = null
  mediaForm.value.url = ''
  searchResult.value = null
  searchAttempted.value = false
}

async function searchExerciseDb() {
  if (!mediaEditTarget.value?.name) return
  searching.value = true
  searchAttempted.value = true
  searchResult.value = await searchExerciseDB(mediaEditTarget.value.name)
  searching.value = false
}

function useSearchResult() {
  if (searchResult.value?.gifUrl) {
    mediaForm.value.url = searchResult.value.gifUrl
  }
}

async function saveMedia() {
  if (!mediaEditTarget.value) return
  const url = mediaForm.value.url.trim() || null
  const mediaType = url ? detectMediaType(url) : null
  try {
    await workouts.updateExerciseMedia(mediaEditTarget.value.id, {
      media_url: url,
      media_type: mediaType,
      external_id: searchResult.value?.externalId || mediaEditTarget.value.external_id || null
    })
    show('Visuel enregistré ✓')
    closeMediaEdit()
  } catch (e) {
    show(e.message || 'Erreur', 'error')
  }
}

async function clearMedia() {
  if (!mediaEditTarget.value) return
  try {
    await workouts.updateExerciseMedia(mediaEditTarget.value.id, {
      media_url: null, media_type: null, external_id: null
    })
    show('Visuel retiré')
    closeMediaEdit()
  } catch { show('Erreur', 'error') }
}

onMounted(() => workouts.fetchExercises())
</script>
