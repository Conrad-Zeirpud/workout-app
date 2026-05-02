<template>
  <div :class="embedded ? '' : 'card overflow-hidden'">
    <div v-if="!embedded" class="p-3 flex items-center gap-3" :style="`background:${bg}`">
      <span class="text-2xl">{{ icon }}</span>
      <div class="flex-1">
        <p class="font-semibold" :style="`color:${color}`">{{ title }}</p>
        <p class="text-xs" :style="`color:${color};opacity:0.7`">{{ items.length }} exercice(s)</p>
      </div>
    </div>

    <div ref="listRef" class="px-2 pt-2 space-y-2 bg-white">
      <div v-for="item in items" :key="item._key"
        class="p-2 bg-gray-50 rounded-xl flex items-start gap-2 drag-handle"
        :data-key="item._key">
        <div class="flex items-center pt-1 text-gray-300">
          <span class="text-lg leading-none">⋮⋮</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-0.5">
            <p class="text-sm font-medium text-gray-900 truncate">{{ item.exercise?.name }}</p>
            <PreviewButton :exercise="item.exercise" @preview="$emit('preview', item.exercise)" />
          </div>
          <p class="text-xs text-gray-400 mb-2 truncate">
            {{ unitInfo(item).icon }} {{ unitInfo(item).label }}
            <span v-if="item.exercise?.equipment"> · {{ item.exercise.equipment }}</span>
          </p>

          <!-- Indicateur % de PR (pour les séances de programme) -->
          <div v-if="item.weight_pct" class="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg"
            style="background:#FEF3C7">
            <span class="text-xs">🎯</span>
            <p class="text-[11px] font-medium" style="color:#854F0B">
              {{ Math.round(item.weight_pct * 100) }}% de ton 1RM
              <span v-if="item.pr_reference">(PR : {{ item.pr_reference }}kg)</span>
              <span v-else class="text-amber-600">— renseigne ton PR</span>
            </p>
          </div>

          <div class="grid gap-1.5" :class="gridFor(item)">
            <div>
              <label class="block text-xs text-gray-400 mb-0.5">Séries</label>
              <input v-model.number="item.sets" type="number" min="1" max="20"
                class="input py-1 text-center text-xs" />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-0.5">{{ repsLabel(item) }}</label>
              <input v-model.number="item.reps" type="number" min="0" :step="repsStep(item)"
                class="input py-1 text-center text-xs" />
            </div>
            <div v-if="getUnit(item.exercise?.unit).fields.includes('weight')">
              <label class="block text-xs text-gray-400 mb-0.5">Poids</label>
              <input v-model.number="item.weight_kg" type="number" min="0" step="0.5"
                class="input py-1 text-center text-xs" />
            </div>
            <div v-if="section !== 'wod'">
              <label class="block text-xs text-gray-400 mb-0.5">Repos</label>
              <input v-model.number="item.rest_seconds" type="number" min="0" step="10"
                class="input py-1 text-center text-xs" />
            </div>
          </div>
        </div>
        <button @click.stop="$emit('remove', item)"
          class="text-gray-300 hover:text-red-400 text-base leading-none pt-0.5 px-1">×</button>
      </div>
    </div>

    <div class="p-2 bg-white">
      <button @click="$emit('add')"
        type="button"
        class="w-full text-center text-sm font-semibold py-3 border-2 border-dashed rounded-xl active:scale-95 transition-transform"
        :style="embedded
          ? 'color:#A32D2D;border-color:rgba(163,45,45,0.4);background:rgba(252,235,235,0.5)'
          : `color:${color};border-color:${color}66;background:${bg}33`">
        + Ajouter un exercice
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getUnit } from '@/lib/units'
import { useSortable } from '@/composables/useSortable'
import PreviewButton from '@/components/ui/PreviewButton.vue'

const props = defineProps({
  section: { type: String, required: true },
  title: String,
  icon: String,
  color: String,
  bg: String,
  items: { type: Array, default: () => [] },
  embedded: { type: Boolean, default: false }
})
const emit = defineEmits(['add', 'remove', 'reorder', 'preview'])

const listRef = ref(null)

useSortable(listRef, {
  onEnd: (oldIdx, newIdx) => {
    emit('reorder', { oldIdx, newIdx })
  }
})

function unitInfo(item) {
  return getUnit(item.exercise?.unit)
}

function repsLabel(item) {
  const u = item.exercise?.unit || 'weight'
  return ({ weight: 'Reps', reps: 'Reps', calories: 'Cal', meters: 'm', seconds: 'Durée' })[u]
}

function repsStep(item) {
  const u = item.exercise?.unit || 'weight'
  if (u === 'meters') return 10
  if (u === 'seconds') return 5
  return 1
}

function gridFor(item) {
  const u = item.exercise?.unit || 'weight'
  const hasWeight = u === 'weight'
  return hasWeight ? 'grid-cols-4' : 'grid-cols-3'
}
</script>
