<template>
  <div class="pb-24">
    <ToastContainer />
    <PageHeader title="Exercices">
      <template #right>
        <button @click="showForm = true" class="btn-primary text-sm py-2 px-4">+ Nouveau</button>
      </template>
    </PageHeader>

    <div class="px-4 mt-4">
      <input v-model="search" placeholder="Rechercher un exercice…" class="input mb-4" />

      <div class="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button @click="filterGroup = ''" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="filterGroup === '' ? 'text-white' : 'bg-gray-100 text-gray-600'"
          :style="filterGroup === '' ? 'background:var(--brand)' : ''">Tous</button>
        <button v-for="g in muscleGroups" :key="g" @click="filterGroup = g"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="filterGroup === g ? 'text-white' : 'bg-gray-100 text-gray-600'"
          :style="filterGroup === g ? 'background:var(--brand)' : ''">{{ g }}</button>
      </div>

      <div v-if="workouts.loading" class="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      <div v-else-if="filtered.length === 0" class="text-center py-12 text-gray-400 text-sm">
        Aucun exercice trouvé
      </div>
      <div v-else class="space-y-2">
        <div v-for="ex in filtered" :key="ex.id" class="card p-4 flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">💪</div>
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ ex.name }}</p>
            <p class="text-xs text-gray-400">{{ ex.muscle_group }}</p>
            <p v-if="ex.notes" class="text-xs text-gray-300 mt-0.5">{{ ex.notes }}</p>
          </div>
          <span v-if="!ex.is_default" class="badge bg-brand/10 text-brand text-xs">Perso</span>
        </div>
      </div>
    </div>

    <!-- New exercise modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-4">Nouvel exercice</h3>
        <div class="space-y-3 mb-5">
          <input v-model="form.name" placeholder="Nom *" class="input" />
          <select v-model="form.muscle_group" class="input">
            <option value="">Groupe musculaire</option>
            <option v-for="g in muscleGroups" :key="g">{{ g }}</option>
          </select>
          <textarea v-model="form.notes" placeholder="Notes (optionnel)" rows="2" class="input resize-none" />
        </div>
        <div class="flex gap-3">
          <button @click="showForm = false" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button @click="create" class="btn-primary flex-1 text-sm py-2">Créer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWorkoutsStore } from '@/stores/workouts'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const workouts = useWorkoutsStore()
const { show } = useToast()
const search = ref('')
const filterGroup = ref('')
const showForm = ref(false)
const form = ref({ name: '', muscle_group: '', notes: '' })
const muscleGroups = ['Pectoraux','Dos','Épaules','Biceps','Triceps','Jambes','Fessiers','Abdominaux','Full Body','Cardio']

const filtered = computed(() =>
  workouts.exercises.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.value.toLowerCase())
    const matchGroup = !filterGroup.value || e.muscle_group === filterGroup.value
    return matchSearch && matchGroup
  })
)

async function create() {
  if (!form.value.name.trim()) return show('Nom requis', 'error')
  try {
    await workouts.createExercise({ ...form.value })
    showForm.value = false
    form.value = { name: '', muscle_group: '', notes: '' }
    show('Exercice créé ✓')
  } catch { show('Erreur', 'error') }
}

onMounted(() => workouts.fetchExercises())
</script>
