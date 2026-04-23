<template>
  <div class="pb-28">
    <ToastContainer />
    <PageHeader :title="isEdit ? 'Modifier la séance' : 'Nouvelle séance'" back>
      <template #right>
        <button @click="save" :disabled="saving"
          class="btn-accent text-sm py-2 px-4 flex items-center gap-1">
          <span v-if="saving" class="animate-spin text-xs">⟳</span>
          Enregistrer
        </button>
      </template>
    </PageHeader>

    <div class="px-4 mt-4 space-y-4">
      <!-- Infos séance -->
      <div class="card p-4 space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Nom de la séance *</label>
          <input v-model="form.name" placeholder="ex: Push A, Legs, Full Body…" class="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Catégorie</label>
          <div class="grid grid-cols-4 gap-2">
            <button v-for="cat in categories" :key="cat.value" type="button"
              @click="form.category = cat.value"
              class="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
              :style="form.category === cat.value
                ? `background:${cat.bg};border:2px solid ${cat.color}`
                : 'background:#f9fafb;border:2px solid transparent'">
              <span class="text-lg">{{ cat.icon }}</span>
              <span class="text-xs font-medium"
                :style="form.category === cat.value ? `color:${cat.text}` : 'color:#6b7280'">
                {{ cat.label }}
              </span>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Description (optionnel)</label>
          <input v-model="form.description" placeholder="ex: ~45 min, focus force" class="input" />
        </div>
      </div>

      <!-- Liste des exercices -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-gray-900">Exercices</h2>
          <span class="text-xs text-gray-400">{{ form.items.length }} exercice(s)</span>
        </div>

        <div v-if="form.items.length === 0" class="card p-6 text-center text-gray-400 text-sm mb-3">
          Ajoute des exercices ci-dessous
        </div>

        <div class="space-y-2 mb-3">
          <div v-for="(item, i) in form.items" :key="item._key"
            class="card p-3 flex items-start gap-3">
            <div class="flex flex-col gap-1 pt-1">
              <button @click="moveUp(i)" :disabled="i === 0" class="text-gray-300 disabled:opacity-20 text-xs leading-none">▲</button>
              <button @click="moveDown(i)" :disabled="i === form.items.length-1" class="text-gray-300 disabled:opacity-20 text-xs leading-none">▼</button>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ item.exercise?.name || 'Exercice' }}</p>
              <p class="text-xs text-gray-400 mb-2">{{ item.exercise?.muscle_group }}<span v-if="item.exercise?.equipment"> · {{ item.exercise.equipment }}</span></p>
              <div class="grid grid-cols-4 gap-2">
                <div>
                  <label class="block text-xs text-gray-400 mb-0.5">Séries</label>
                  <input v-model.number="item.sets" type="number" min="1" max="20" class="input py-1.5 text-center text-sm" />
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-0.5">Reps</label>
                  <input v-model.number="item.reps" type="number" min="1" max="100" class="input py-1.5 text-center text-sm" />
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-0.5">Poids (kg)</label>
                  <input v-model.number="item.weight_kg" type="number" min="0" step="0.5" class="input py-1.5 text-center text-sm" />
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-0.5">Repos (s)</label>
                  <input v-model.number="item.rest_seconds" type="number" min="0" step="10" class="input py-1.5 text-center text-sm" />
                </div>
              </div>
            </div>
            <button @click="removeItem(i)" class="text-gray-300 hover:text-red-400 text-lg leading-none pt-0.5">×</button>
          </div>
        </div>

        <!-- Picker exercice -->
        <div class="card p-4">
          <h3 class="text-xs font-semibold text-gray-500 mb-2">Ajouter un exercice</h3>
          <input v-model="search" placeholder="Rechercher…" class="input text-sm mb-3" />
          <div class="space-y-1 max-h-64 overflow-y-auto">
            <button v-for="ex in filteredExercises" :key="ex.id"
              @click="addExercise(ex)"
              class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-left transition-colors">
              <div class="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-sm">💪</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ ex.name }}</p>
                <p class="text-xs text-gray-400 truncate">{{ ex.muscle_group }}<span v-if="ex.equipment"> · {{ ex.equipment }}</span></p>
              </div>
              <span class="text-xs text-brand font-medium">+</span>
            </button>
          </div>
          <button @click="showNewExercise = true"
            class="w-full mt-3 text-center text-xs text-brand font-medium py-2 border border-dashed border-brand/30 rounded-xl">
            + Créer un exercice personnalisé
          </button>
        </div>
      </div>
    </div>

    <!-- New exercise modal -->
    <div v-if="showNewExercise" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 pb-8">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-4">Nouvel exercice</h3>
        <div class="space-y-3 mb-5">
          <input v-model="newEx.name" placeholder="Nom *" class="input" />
          <select v-model="newEx.muscle_group" class="input">
            <option value="">Groupe musculaire</option>
            <option v-for="g in muscleGroups" :key="g">{{ g }}</option>
          </select>
          <select v-model="newEx.equipment" class="input">
            <option value="">Équipement</option>
            <option v-for="eq in equipmentList" :key="eq">{{ eq }}</option>
          </select>
          <textarea v-model="newEx.notes" placeholder="Notes (optionnel)" rows="2" class="input resize-none" />
        </div>
        <div class="flex gap-3">
          <button @click="showNewExercise = false" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button @click="createExercise" class="btn-primary flex-1 text-sm py-2">Créer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkoutsStore } from '@/stores/workouts'
import { useToast } from '@/composables/useToast'
import { WORKOUT_CATEGORIES } from '@/lib/categories'
import PageHeader from '@/components/ui/PageHeader.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const route = useRoute()
const router = useRouter()
const workouts = useWorkoutsStore()
const { show } = useToast()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const search = ref('')
const showNewExercise = ref(false)
let keyCounter = 0

const form = ref({ name: '', description: '', category: 'other', items: [] })
const newEx = ref({ name: '', muscle_group: '', equipment: '', notes: '' })
const categories = WORKOUT_CATEGORIES
const muscleGroups = ['Pectoraux','Dos','Épaules','Biceps','Triceps','Jambes','Fessiers','Abdominaux','Avant-bras','Full Body','Cardio','Mobilité']
const equipmentList = ['Barre','Haltères','Poulie','Machine','Poids du corps','Kettlebell','Aucun']

const filteredExercises = computed(() =>
  workouts.exercises.filter(e =>
    e.name.toLowerCase().includes(search.value.toLowerCase()) ||
    (e.muscle_group || '').toLowerCase().includes(search.value.toLowerCase()) ||
    (e.equipment || '').toLowerCase().includes(search.value.toLowerCase())
  )
)

function addExercise(ex) {
  form.value.items.push({ _key: keyCounter++, exercise_id: ex.id, exercise: ex, sets: 3, reps: 10, weight_kg: 0, rest_seconds: 90 })
}
function removeItem(i) { form.value.items.splice(i, 1) }
function moveUp(i) { if (i > 0) { const a = form.value.items; [a[i-1], a[i]] = [a[i], a[i-1]] } }
function moveDown(i) { const a = form.value.items; if (i < a.length-1) [a[i], a[i+1]] = [a[i+1], a[i]] }

async function createExercise() {
  if (!newEx.value.name.trim()) return show('Nom requis', 'error')
  try {
    const ex = await workouts.createExercise(newEx.value)
    addExercise(ex)
    showNewExercise.value = false
    newEx.value = { name: '', muscle_group: '', equipment: '', notes: '' }
  } catch { show('Erreur lors de la création', 'error') }
}

async function save() {
  if (!form.value.name.trim()) return show('Nom de séance requis', 'error')
  saving.value = true
  try {
    let id = route.params.id
    if (isEdit.value) {
      await workouts.updateWorkout(id, { name: form.value.name, description: form.value.description, category: form.value.category })
    } else {
      const w = await workouts.createWorkout({ name: form.value.name, description: form.value.description, category: form.value.category })
      id = w.id
    }
    await workouts.saveWorkoutItems(id, form.value.items)
    await workouts.fetchWorkouts()
    show('Séance enregistrée ✓')
    router.push('/workouts')
  } catch (e) { show(e.message || 'Erreur', 'error') }
  saving.value = false
}

onMounted(async () => {
  await workouts.fetchExercises()
  if (isEdit.value) {
    await workouts.fetchWorkouts()
    const w = workouts.workouts.find(w => w.id === route.params.id)
    if (w) {
      form.value.name = w.name
      form.value.description = w.description || ''
      form.value.category = w.category || 'other'
      form.value.items = (w.workout_items || [])
        .sort((a, b) => a.order - b.order)
        .map(item => ({ _key: keyCounter++, ...item }))
    }
  }
})
</script>
