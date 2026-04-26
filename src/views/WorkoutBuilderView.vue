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

      <!-- Section Warmup -->
      <SectionEditor
        section="warmup"
        title="Échauffement"
        icon="🔥"
        color="#EF9F27"
        bg="#FAEEDA"
        :items="warmupItems"
        @add="addExerciseToSection('warmup')"
        @remove="removeItem"
        @move-up="(i) => moveInSection('warmup', i, -1)"
        @move-down="(i) => moveInSection('warmup', i, 1)"
      />

      <!-- Section Main -->
      <SectionEditor
        section="main"
        title="Exercices"
        icon="💪"
        color="#639922"
        bg="#EAF3DE"
        :items="mainItems"
        @add="addExerciseToSection('main')"
        @remove="removeItem"
        @move-up="(i) => moveInSection('main', i, -1)"
        @move-down="(i) => moveInSection('main', i, 1)"
      />

      <!-- Section WOD -->
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

        <!-- WOD mode picker -->
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

          <!-- Mode-specific config -->
          <div v-if="form.wod_mode === 'amrap'">
            <p class="text-xs text-gray-500 mb-2 text-center">Durée totale</p>
            <div class="flex justify-center">
              <DurationPicker v-model="form.wod_config.totalSeconds" :step="30" />
            </div>
          </div>
          <div v-else-if="form.wod_mode === 'emom'">
            <p class="text-xs text-gray-500 mb-2 text-center">Minutes</p>
            <div class="flex justify-center">
              <CountWheel v-model="form.wod_config.rounds" :min="1" :max="60" suffix="× 1 min" />
            </div>
          </div>
          <div v-else-if="form.wod_mode === 'fortime'">
            <p class="text-xs text-gray-500 mb-2 text-center">Cap (0 = pas de cap)</p>
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
        </div>

        <!-- WOD exercises list -->
        <SectionEditor
          section="wod"
          :items="wodItems"
          :embedded="true"
          @add="addExerciseToSection('wod')"
          @remove="removeItem"
          @move-up="(i) => moveInSection('wod', i, -1)"
          @move-down="(i) => moveInSection('wod', i, 1)"
        />
      </div>
    </div>

    <!-- Exercise picker modal -->
    <div v-if="pickerSection" class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-2 pb-0"
      @click.self="pickerSection = null">
      <div class="bg-white rounded-t-3xl p-5 w-full max-w-md max-h-[85vh] flex flex-col">
        <h3 class="font-semibold text-gray-900 mb-3">Ajouter à {{ pickerSectionLabel }}</h3>
        <input v-model="search" placeholder="Rechercher…" class="input text-sm mb-3" />
        <div class="space-y-1 overflow-y-auto flex-1 mb-3">
          <button v-for="ex in filteredExercises" :key="ex.id"
            @click="confirmAddExercise(ex)"
            class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-left">
            <div class="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-sm">💪</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ ex.name }}</p>
              <p class="text-xs text-gray-400 truncate">{{ ex.muscle_group }}<span v-if="ex.equipment"> · {{ ex.equipment }}</span></p>
            </div>
            <span class="text-xs text-brand font-medium">+</span>
          </button>
        </div>
        <button @click="pickerSection = null" class="btn-ghost w-full text-sm py-2">Fermer</button>
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
import SectionEditor from '@/components/workout/SectionEditor.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import CountWheel from '@/components/ui/CountWheel.vue'

const route = useRoute()
const router = useRouter()
const workouts = useWorkoutsStore()
const { show } = useToast()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const search = ref('')
const pickerSection = ref(null)
const showWodConfig = ref(false)
let keyCounter = 0

const form = ref({
  name: '',
  description: '',
  category: 'renfo',
  items: [],
  wod_mode: null,
  wod_config: {}
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

const pickerSectionLabel = computed(() => {
  if (pickerSection.value === 'warmup') return "l'échauffement"
  if (pickerSection.value === 'wod') return 'au WOD'
  return 'aux exercices'
})

const warmupItems = computed(() => form.value.items.filter(i => i.section === 'warmup'))
const mainItems = computed(() => form.value.items.filter(i => (i.section || 'main') === 'main'))
const wodItems = computed(() => form.value.items.filter(i => i.section === 'wod'))

const filteredExercises = computed(() =>
  workouts.exercises.filter(e =>
    e.name.toLowerCase().includes(search.value.toLowerCase()) ||
    (e.muscle_group || '').toLowerCase().includes(search.value.toLowerCase()) ||
    (e.equipment || '').toLowerCase().includes(search.value.toLowerCase())
  )
)

function addExerciseToSection(section) {
  pickerSection.value = section
  search.value = ''
}

function confirmAddExercise(ex) {
  const defaults = pickerSection.value === 'wod'
    ? { sets: 1, reps: 10, weight_kg: 0, rest_seconds: 0 }
    : pickerSection.value === 'warmup'
      ? { sets: 2, reps: 10, weight_kg: 0, rest_seconds: 30 }
      : { sets: 3, reps: 10, weight_kg: 0, rest_seconds: 90 }

  form.value.items.push({
    _key: keyCounter++,
    exercise_id: ex.id,
    exercise: ex,
    section: pickerSection.value,
    ...defaults
  })
  pickerSection.value = null
}

function removeItem(item) {
  const idx = form.value.items.findIndex(i => i._key === item._key)
  if (idx >= 0) form.value.items.splice(idx, 1)
}

function moveInSection(section, sectionIndex, direction) {
  const all = form.value.items
  const sectionItems = all.filter(i => (i.section || 'main') === section)
  if (sectionIndex + direction < 0 || sectionIndex + direction >= sectionItems.length) return
  const a = sectionItems[sectionIndex]
  const b = sectionItems[sectionIndex + direction]
  const ia = all.indexOf(a)
  const ib = all.indexOf(b)
  ;[all[ia], all[ib]] = [all[ib], all[ia]]
}

function setWodMode(modeId) {
  form.value.wod_mode = modeId
  // Default configs
  const defaults = {
    amrap:    { totalSeconds: 12 * 60, prepSeconds: 10 },
    emom:     { rounds: 10, prepSeconds: 10 },
    fortime:  { cap: 0, prepSeconds: 10 },
    tabata:   { workSeconds: 20, restSeconds: 10, rounds: 8, prepSeconds: 10 },
    interval: { workSeconds: 40, restSeconds: 20, rounds: 10, prepSeconds: 10 },
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
      name: form.value.name,
      description: form.value.description,
      category: form.value.category,
      wod_mode: form.value.wod_mode,
      wod_config: form.value.wod_mode ? form.value.wod_config : null
    }
    if (isEdit.value) {
      await workouts.updateWorkout(id, payload)
    } else {
      const w = await workouts.createWorkout(payload)
      id = w.id
    }
    await workouts.saveWorkoutItems(id, form.value.items)
    await workouts.fetchWorkouts()
    show('Séance enregistrée ✓')
    router.push('/workouts')
  } catch (e) {
    show(e.message || 'Erreur', 'error')
  }
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
