<template>
  <transition name="modal">
    <div v-if="visible" class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-2 pb-0"
      @click.self="$emit('close')">
      <div class="bg-white rounded-t-3xl p-5 w-full max-w-md max-h-[85vh] flex flex-col">
        <h3 class="font-semibold text-gray-900 mb-1">Ajouter à {{ sectionLabel }}</h3>
        <p class="text-xs text-gray-400 mb-3">
          {{ showAll ? `${filteredAll.length} exercices` : `${filteredSection.length} exercices adaptés` }}
        </p>

        <input v-model="search" placeholder="Rechercher…" class="input text-sm mb-2" />

        <!-- Toggle filter (only if section provided) -->
        <div v-if="section" class="flex items-center justify-between mb-3 px-1">
          <span class="text-xs text-gray-400">
            {{ showAll ? '🔍 Tous les exercices' : `🎯 Adaptés à ${sectionLabel}` }}
          </span>
          <button @click="showAll = !showAll"
            class="text-xs text-brand font-medium underline">
            {{ showAll ? 'Filtrer' : 'Voir tout' }}
          </button>
        </div>

        <div class="space-y-1 overflow-y-auto flex-1 mb-3">
          <button v-for="ex in displayedExercises" :key="ex.id"
            @click="$emit('select', ex)"
            class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-left">
            <div class="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-sm">💪</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ ex.name }}</p>
              <p class="text-xs text-gray-400 truncate">
                {{ ex.muscle_group }}<span v-if="ex.equipment"> · {{ ex.equipment }}</span>
              </p>
            </div>
            <!-- Badges sections -->
            <div class="flex gap-1 flex-shrink-0">
              <span v-for="s in (ex.applicable_sections || ['main'])" :key="s"
                class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                :style="sectionBadgeStyle(s)">
                {{ sectionShort(s) }}
              </span>
            </div>
          </button>
          <div v-if="displayedExercises.length === 0" class="text-center py-8 text-gray-400 text-sm">
            Aucun exercice trouvé
          </div>
        </div>

        <button @click="$emit('close')" class="btn-ghost w-full text-sm py-2">Fermer</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  section: String,
  exercises: { type: Array, default: () => [] }
})
defineEmits(['select', 'close'])

const search = ref('')
const showAll = ref(false)

watch(() => props.visible, (v) => {
  if (v) { search.value = ''; showAll.value = false }
})

const sectionLabel = computed(() => ({
  warmup: "l'échauffement",
  main: 'aux exercices',
  wod: 'au WOD'
}[props.section] || 'la séance'))

function sectionShort(s) {
  return ({ warmup: 'W', main: 'M', wod: 'WOD' }[s] || s.charAt(0).toUpperCase())
}

function sectionBadgeStyle(s) {
  const map = {
    warmup: 'background:#FAEEDA;color:#854F0B',
    main:   'background:#EAF3DE;color:#3B6D11',
    wod:    'background:#FCEBEB;color:#A32D2D'
  }
  return map[s] || 'background:#f3f4f6;color:#6b7280'
}

function matchesSearch(ex) {
  const q = search.value.toLowerCase().trim()
  if (!q) return true
  return ex.name.toLowerCase().includes(q)
    || (ex.muscle_group || '').toLowerCase().includes(q)
    || (ex.equipment || '').toLowerCase().includes(q)
}

const filteredAll = computed(() => props.exercises.filter(matchesSearch))

const filteredSection = computed(() => {
  if (!props.section) return filteredAll.value
  return props.exercises.filter(ex => {
    if (!matchesSearch(ex)) return false
    const sections = ex.applicable_sections || ['main']
    return sections.includes(props.section)
  })
})

const displayedExercises = computed(() =>
  showAll.value ? filteredAll.value : filteredSection.value
)
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active > div, .modal-leave-active > div { transition: transform 0.25s; }
.modal-enter-from > div, .modal-leave-to > div { transform: translateY(20px); }
</style>
