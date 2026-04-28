<template>
  <div class="pb-28">
    <ToastContainer />
    <ExercisePreviewOverlay :visible="!!previewExercise" :exercise="previewExercise" @close="previewExercise = null" />

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
      <div class="card p-4 space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Nom de la séance *</label>
          <input v-model="form.name" placeholder="ex: ATHX poussée, Hyrox simulation…" class="input" />
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
          <input v-model="form.description" placeholder="ex: ~45 min, focus puissance" class="input" />
        </div>
      </div>

      <p class="text-xs text-gray-400 px-1">💡 Maintiens un appui long sur un exercice pour le déplacer</p>

      <SectionEditor section="warmup" title="Échauffement" icon="🔥" color="#EF9F27" bg="#FAEEDA"
        :items="warmupItems"
        @add="openPicker('warmup')" @remove="removeItem"
        @reorder="(e) => reorderInSection('warmup', e.oldIdx, e.newIdx)"
        @preview="ex => previewExercise = ex" />

      <SectionEditor section="main" title="Exercices" icon="💪" color="#639922" bg="#EAF3DE"
        :items="mainItems"
        @add="openPicker('main')" @remove="removeItem"
        @reorder="(e) => reorderInSection('main', e.oldIdx, e.newIdx)"
        @preview="ex => previewExercise = ex" />

      <div class="card overflow-hidden">
        <div class="p-3 flex items-center gap-3" style="background:#FCEBEB">
          <span class="text-2xl">🏁</span>
          <div class="flex-1">
            <p class="font-semibold" style="color:#A32D2D">WOD</p>
            <p class="text-xs" style="color:#A32D2D;opacity:0.7">{{ wodItems.length }} exercice(s)</p>
          </div>
          <button @click="showWodConfig = !showWodConfig"
            class="text-xs px-2 py-1 rounded-lg" style="background:#A32D2D;color:white">
            {{ form.wod_mode ? wodModeLabel : '+ Mode' }}
          </button>
        </div>

        <div v-if="showWodConfig" class="p-3 border-t border-red-100 bg-white space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-2">Mode du WOD</label>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="m in wodModes" :key="m.id" type="button"
                @click="setWodMode(m.id)"
                class="p-2 rounded-lg text-xs font-medium transition-all"
                :class="form.wod_mode === m.id ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'">
                <div class="text-base">{{ m.icon }}</div>
                {{ m.name }}
              </button>
            </div>
            <button v-if="form.wod_mode" @click="clearWodMode"
              class="mt-2 text-xs text-gray-400 underline">Retirer le mode</button>
          </div>

          <div v-if="form.wod_mode === 'amrap'">
            <p class="text-xs text-gray-500 mb-2 text-center">Durée totale</p>
            <div class="flex justify-center">
              <DurationPicker v-model="form.wod_config.totalSeconds" :step="30" />
            </div>
          </div>
          <div v-else-if="form.wod_mode === 'emom'" class="space-y-3">
            <div>
              <p class="text-xs text-gray-500 text-center mb-2">Intervalle</p>
              <div class="flex justify-center">
                <NumberWheel v-model="form.wod_config.intervalSeconds"
                  :options="emomIntervalOptions" :width="100" />
              </div>
              <p class="text-center text-xs text-gray-400 mt-1">
                {{ formatInterval(form.wod_config.intervalSeconds) }} par round
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 text-center mb-2">Rounds</p>
              <div class="flex justify-center">
                <CountWheel v-model="form.wod_config.rounds" :min="1" :max="60" suffix="rounds" />
              </div>
            </div>
          </div>
          <div v-else-if="form.wod_mode === 'fortime'">
            <p class="text-xs text-gray-500 mb-2 text-center">Cap (0 = sans limite)</p>
            <div class="flex justify-center">
              <DurationPicker v-model="form.wod_config.cap" :step="30" />
            </div>
          </div>
          <div v-else-if="form.wod_mode === 'tabata' || form.wod_mode === 'interval'" class="space-y-3">
            <div>
              <p class="text-xs text-gray-500 mb-2 text-center">Effort</p>
              <div class="flex justify-center">
                <DurationPicker v-model="form.wod_config.workSeconds"
                  :step="form.wod_mode === 'tabata' ? 5 : 30" :show-label="false" />
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2 text-center">Repos</p>
              <div class="flex justify-center">
                <DurationPicker v-model="form.wod_config.restSeconds"
                  :step="form.wod_mode === 'tabata' ? 5 : 30" :show-label="false" />
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2 text-center">Rounds</p>
              <div class="flex justify-center">
                <CountWheel v-model="form.wod_config.rounds" :min="1" :max="60" suffix="rounds" />
              </div>
            </div>
          </div>

          <p v-if="form.wod_mode" class="text-xs text-gray-400 text-center mt-3">
            ⏱ Préparation : 10 secondes (fixe)
          </p>
        </div>

        <SectionEditor section="wod" :items="wodItems" :embedded="true"
          @add="openPicker('wod')" @remove="removeItem"
          @reorder="(e) => reorderInSection('wod', e.oldIdx, e.newIdx)"
          @preview="ex => previewExercise = ex" />
      </div>
    </div>

    <ExercisePickerModal :visible="!!pickerSection" :section="pickerSection"
      :exercises="workouts.exercises"
      @select="confirmAddExercise" @close="pickerSection = null"
      @preview="ex => previewExercise = ex" />
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
import SectionEditor from '@/components/workout/SectionEditor.vue'
import ExercisePickerModal from '@/components/workout/ExercisePickerModal.vue'
import ExercisePreviewOverlay from '@/components/ui/ExercisePreviewOverlay.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import CountWheel from '@/components/ui/CountWheel.vue'
import NumberWheel from '@/components/ui/NumberWheel.vue'

const route = useRoute()
const router = useRouter()
const workouts = useWorkoutsStore()
const { show } = useToast()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const pickerSection = ref(null)
const showWodConfig = ref(false)
const previewExercise = ref(null)
let keyCounter = 0

const form = ref({
  name: '', description: '', category: 'renfo',
  items: [], wod_mode: null, wod_config: {}
})

const categories = WORKOUT_CATEGORIES
const wodModes = [
  { id: 'amrap', name: 'AMRAP', icon: '🔁' },
  { id: 'emom', name: 'EMOM', icon: '⏱️' },
  { id: 'fortime', name: 'For Time', icon: '🏁' },
  { id: 'tabata', name: 'Tabata', icon: '🔥' },
  { id: 'interval', name: 'Intervalles', icon: '🔂' },
]
const wodModeLabel = computed(() => {
  const m = wodModes.find(m => m.id === form.value.wod_mode)
  return m ? `${m.icon} ${m.name}` : '+ Mode'
})
const emomIntervalOptions = (() => {
  const arr = []
  for (let s = 15; s <= 60 * 12; s += 15) {
    if (s <= 60 || s % 30 === 0) arr.push(s)
  }
  return arr
})()

function formatInterval(sec) {
  if (!sec) return ''
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (s === 0) return `${m} min`
  return `${m}min${s}s`
}

const warmupItems = computed(() => form.value.items.filter(i => i.section === 'warmup'))
const mainItems = computed(() => form.value.items.filter(i => (i.section || 'main') === 'main'))
const wodItems = computed(() => form.value.items.filter(i => i.section === 'wod'))

function openPicker(section) { pickerSection.value = section }

function confirmAddExercise(ex) {
  const defaults = pickerSection.value === 'wod'
    ? { sets: 1, reps: 10, weight_kg: 0, rest_seconds: 0 }
    : pickerSection.value === 'warmup'
      ? { sets: 2, reps: 10, weight_kg: 0, rest_seconds: 30 }
      : { sets: 3, reps: 10, weight_kg: 0, rest_seconds: 90 }
  form.value.items.push({
    _key: keyCounter++, exercise_id: ex.id, exercise: ex,
    section: pickerSection.value, ...defaults
  })
  pickerSection.value = null
}

function removeItem(item) {
  const idx = form.value.items.findIndex(i => i._key === item._key)
  if (idx >= 0) form.value.items.splice(idx, 1)
}

function reorderInSection(section, oldIdx, newIdx) {
  const all = form.value.items
  const sectionItems = all.filter(i => (i.section || 'main') === section)
  const moved = sectionItems[oldIdx]
  const target = sectionItems[newIdx]
  if (!moved || !target) return
  const movedAllIdx = all.indexOf(moved)
  all.splice(movedAllIdx, 1)
  const targetAllIdx = all.indexOf(target)
  const insertIdx = oldIdx < newIdx ? targetAllIdx + 1 : targetAllIdx
  all.splice(insertIdx, 0, moved)
}

function setWodMode(modeId) {
  form.value.wod_mode = modeId
  const defaults = {
    amrap:    { totalSeconds: 12 * 60 },
    emom:     { intervalSeconds: 60, rounds: 10 },
    fortime:  { cap: 0 },
    tabata:   { workSeconds: 20, restSeconds: 10, rounds: 8 },
    interval: { workSeconds: 40, restSeconds: 20, rounds: 10 },
  }
  form.value.wod_config = { ...defaults[modeId] }
}

function clearWodMode() {
  form.value.wod_mode = null
  form.value.wod_config = {}
}

async function save() {
  if (!form.value.name.trim()) return show('Nom de séance requis', 'error')
  saving.value = true
  try {
    let id = route.params.id
    const payload = {
      name: form.value.name, description: form.value.description,
      category: form.value.category, wod_mode: form.value.wod_mode,
      wod_config: form.value.wod_mode ? form.value.wod_config : null
    }
    if (isEdit.value) await workouts.updateWorkout(id, payload)
    else { const w = await workouts.createWorkout(payload); id = w.id }
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
      form.value.category = w.category || 'renfo'
      form.value.wod_mode = w.wod_mode || null
      form.value.wod_config = w.wod_config || {}
      form.value.items = (w.workout_items || [])
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(item => ({ _key: keyCounter++, ...item, section: item.section || 'main' }))
    }
  }
})
</script>
