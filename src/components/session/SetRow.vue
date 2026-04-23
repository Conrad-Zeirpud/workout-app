<template>
  <div class="flex items-center gap-2 p-3 rounded-xl transition-colors"
    :class="set.done ? 'bg-green-50' : 'bg-gray-50'">

    <!-- Set number / checkmark -->
    <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors"
      :class="set.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'">
      {{ set.done ? '✓' : set.set_number }}
    </div>

    <!-- Inputs -->
    <div class="flex-1 grid grid-cols-3 gap-2">
      <div class="flex flex-col items-center gap-0.5">
        <label class="text-xs text-gray-400">Reps</label>
        <input v-model.number="set.reps_done" type="number" min="0" :disabled="set.done"
          class="w-full text-center border border-gray-200 rounded-lg py-1 text-sm font-semibold disabled:opacity-50 disabled:bg-gray-50 focus:outline-none focus:border-brand"
          @focus="$event.target.select()" />
      </div>
      <div class="flex flex-col items-center gap-0.5">
        <label class="text-xs text-gray-400">{{ unit }}</label>
        <input v-model.number="set.weight_kg" type="number" min="0" step="0.5" :disabled="set.done"
          class="w-full text-center border border-gray-200 rounded-lg py-1 text-sm font-semibold disabled:opacity-50 disabled:bg-gray-50 focus:outline-none focus:border-brand"
          @focus="$event.target.select()" />
      </div>
      <div class="flex flex-col items-center gap-0.5">
        <label class="text-xs text-gray-400">RPE</label>
        <select v-model="set.rpe" :disabled="set.done"
          class="w-full text-center border border-gray-200 rounded-lg py-1 text-xs disabled:opacity-50 disabled:bg-gray-50 focus:outline-none">
          <option :value="null">—</option>
          <option v-for="r in [6,7,8,9,10]" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
    </div>

    <!-- Done button -->
    <button v-if="!set.done" @click="$emit('complete', set)"
      class="w-9 h-9 rounded-full flex items-center justify-center text-white text-base flex-shrink-0 active:scale-90 transition-transform"
      style="background:var(--accent)">✓</button>

    <!-- Previous perf hint -->
    <div v-if="previousBest && !set.done" class="hidden"><!-- hint slot --></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettings } from '@/composables/useSettings'

const props = defineProps({
  set: Object,
  previousBest: Object
})
defineEmits(['complete'])
const { settings } = useSettings()
const unit = computed(() => settings.unit)
</script>
