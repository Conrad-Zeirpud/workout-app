<template>
  <div class="pb-24">
    <ToastContainer />
    <PageHeader title="Exercices" back />

    <ExercisePreviewOverlay
      :visible="!!previewExercise"
      :exercise="previewExercise"
      @close="previewExercise = null" />

    <div class="px-4 mt-4">
      <button @click="openCreate"
        class="w-full mb-4 py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white text-base active:scale-95 transition-transform"
        style="background:linear-gradient(135deg,#1a1a2e,#2d2d5e); box-shadow:0 6px 20px rgba(26,26,46,0.25)">
        <span class="text-xl">➕</span>
        {{ isAdmin ? 'Créer un exercice (perso ou public)' : 'Créer un exercice personnalisé' }}
      </button>

      <input v-model="search" placeholder="Rechercher un exercice…" class="input mb-3" />

      <!-- Filtres section -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-2">
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

      <!-- Filtre origine (admin uniquement) -->
      <div v-if="isAdmin" class="flex gap-2 overflow-x-auto pb-2 mb-3">
        <button @click="filterOrigin = ''"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium"
          :class="filterOrigin === '' ? 'text-white' : 'bg-gray-100 text-gray-600'"
          :style="filterOrigin === '' ? 'background:#475569' : ''">Tous</button>
        <button @click="filterOrigin = 'public'"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium"
          :style="filterOrigin === 'public' ? 'background:#0891b2;color:white' : 'background:#cffafe;color:#0e7490'">
          🌐 Publics
        </button>
        <button @click="filterOrigin = 'mine'"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium"
          :style="filterOrigin === 'mine' ? 'background:#475569;color:white' : 'background:#f1f5f9;color:#475569'">
          👤 Mes perso
        </button>
      </div>

      <p class="text-xs text-gray-400 mb-2">{{ filtered.length }} exercice(s)</p>

      <div v-if="workouts.loading" class="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      <div v-else-if="filtered.length === 0" class="text-center py-12 text-gray-400 text-sm">
        Aucun exercice trouvé
      </div>
      <div v-else class="space-y-2">
        <div v-for="ex in filtered" :key="ex.id" class="card p-3 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            :style="ex.media_type === 'video' ? 'background:#EAF3DE' : 'background:#F3F4F6'">
            {{ ex.media_type === 'video' ? '🎥' : '💪' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="font-medium text-gray-900 truncate text-sm">{{ ex.name }}</p>
              <!-- Badge "public" pour les exos par défaut (visible uniquement par admin) -->
              <span v-if="isAdmin && ex.is_default"
                class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style="background:#cffafe;color:#0e7490">
                🌐
              </span>
            </div>
            <p class="text-xs text-gray-400 truncate">
              {{ ex.muscle_group }}<span v-if="ex.equipment"> · {{ ex.equipment }}</span>
            </p>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <PreviewButton :exercise="ex" @preview="previewExercise = ex" />
            <button v-if="canModify(ex)" @click="openEdit(ex)"
              class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-xs"
              aria-label="Modifier">✏️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modale création / édition -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="closeForm">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h3 class="font-semibold text-gray-900 mb-4">
          {{ editingId ? 'Modifier l\'exercice' : 'Nouvel exercice' }}
        </h3>

        <!-- Toggle public (admin uniquement, en création) -->
        <div v-if="isAdmin && !editingId" class="mb-4 p-3 rounded-xl flex items-center justify-between"
          :style="form.isPublic ? 'background:#cffafe' : 'background:#f9fafb'">
          <div>
            <p class="text-sm font-semibold text-gray-900">
              {{ form.isPublic ? '🌐 Exercice public' : '👤 Exercice perso' }}
            </p>
            <p class="text-[11px] text-gray-500 mt-0.5">
              {{ form.isPublic ? 'Visible par tous les utilisateurs' : 'Visible uniquement par toi' }}
            </p>
          </div>
          <button @click="form.isPublic = !form.isPublic"
            class="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
            :style="`background:${form.isPublic ? '#0891b2' : '#cbd5e1'}`">
            <span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
              :style="`left:${form.isPublic ? '1.375rem' : '0.125rem'}`" />
          </button>
        </div>

        <!-- Bandeau infos pour exos publics en édition -->
        <div v-if="editingId && form._isPublic"
          class="mb-4 p-3 rounded-xl text-xs"
          style="background:#cffafe;color:#0e7490">
          🌐 Cet exercice est <strong>public</strong>. Tes modifications seront visibles par tous les utilisateurs.
        </div>

        <div class="space-y-3 mb-5">
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
          <button @click="closeForm" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button v-if="editingId" @click="askDelete"
            class="bg-red-500 text-white rounded-xl py-2 px-3 text-sm font-medium">🗑</button>
          <button @click="save" :disabled="saving"
            class="btn-primary flex-1 text-sm py-2 disabled:opacity-40">
            <span v-if="saving" class="animate-spin">⟳</span>
            <span v-else>{{ editingId ? 'Enregistrer' : 'Créer' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation suppression -->
    <div v-if="confirmDelete" class="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center px-4 pb-8"
      @click.self="confirmDelete = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Supprimer "{{ form.name }}" ?</h3>
        <p class="text-sm text-gray-500 mb-5">
          {{ form._isPublic
            ? 'Cet exercice est public. Sa suppression le retirera pour TOUS les utilisateurs.'
            : 'Cette action est irréversible.' }}
        </p>
        <div class="flex gap-3">
          <button @click="confirmDelete = false" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button @click="doDelete" :disabled="deleting"
            class="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-40">
            <span v-if="deleting" class="animate-spin">⟳</span>
            <span v-else>Supprimer</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWorkoutsStore } from '@/stores/workouts'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useIsAdmin } from '@/composables/useIsAdmin'
import PageHeader from '@/components/ui/PageHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ExercisePreviewOverlay from '@/components/ui/ExercisePreviewOverlay.vue'
import PreviewButton from '@/components/ui/PreviewButton.vue'

const workouts = useWorkoutsStore()
const auth = useAuthStore()
const { isAdmin } = useIsAdmin()
const { show } = useToast()

const search = ref('')
const filterSection = ref('')
const filterOrigin = ref('')   // '' | 'public' | 'mine' (admin only)
const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)
const previewExercise = ref(null)
const confirmDelete = ref(false)
const deleting = ref(false)

const form = ref(blankForm())

function blankForm() {
  return {
    name: '', muscle_group: '', equipment: '',
    unit: 'weight', applicable_sections: ['main'], notes: '',
    isPublic: false,
    _isPublic: false  // pour l'affichage du bandeau en édition
  }
}

const muscleGroups = ['Pectoraux','Dos','Épaules','Biceps','Triceps','Jambes','Fessiers','Abdominaux','Avant-bras','Full Body','Cardio','Mobilité']
const equipmentList = ['Barre','Haltères','Poulie','Machine','Poids du corps','Kettlebell','Aucun']

function canModify(ex) {
  if (isAdmin.value) return true
  return ex.user_id === auth.user?.id
}

const filtered = computed(() => {
  let list = workouts.exercises
  if (isAdmin.value && filterOrigin.value === 'public') {
    list = list.filter(e => e.is_default === true)
  } else if (isAdmin.value && filterOrigin.value === 'mine') {
    list = list.filter(e => e.user_id === auth.user?.id)
  }
  if (filterSection.value) {
    list = list.filter(e => (e.applicable_sections || ['main']).includes(filterSection.value))
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(e => e.name.toLowerCase().includes(q))
  }
  return list
})

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

function openCreate() {
  editingId.value = null
  form.value = blankForm()
  if (isAdmin.value) form.value.isPublic = true
  showForm.value = true
}

function openEdit(ex) {
  editingId.value = ex.id
  form.value = {
    name: ex.name || '',
    muscle_group: ex.muscle_group || '',
    equipment: ex.equipment || '',
    unit: ex.unit || 'weight',
    applicable_sections: ex.applicable_sections || ['main'],
    notes: ex.notes || '',
    isPublic: false,
    _isPublic: ex.is_default === true
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  form.value = blankForm()
}

async function save() {
  if (!form.value.name.trim()) {
    show('Nom requis', 'error')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      muscle_group: form.value.muscle_group || null,
      equipment: form.value.equipment || null,
      unit: form.value.unit,
      applicable_sections: form.value.applicable_sections,
      notes: form.value.notes || null
    }

    if (editingId.value) {
      await workouts.updateExercise(editingId.value, payload)
      show('Exercice modifié ✓')
    } else {
      await workouts.createExercise(payload, { isPublic: form.value.isPublic })
      show(form.value.isPublic ? 'Exercice public créé ✓' : 'Exercice créé ✓')
    }
    closeForm()
  } catch (e) {
    show(e.message || 'Erreur', 'error')
  }
  saving.value = false
}

function askDelete() {
  confirmDelete.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await workouts.deleteExercise(editingId.value)
    show('Exercice supprimé')
    confirmDelete.value = false
    closeForm()
  } catch (e) {
    show(e.message || 'Erreur lors de la suppression', 'error')
  }
  deleting.value = false
}

onMounted(() => workouts.fetchExercises())
</script>
