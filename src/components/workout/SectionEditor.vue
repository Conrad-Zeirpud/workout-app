<template>
  <div :class="embedded ? '' : 'card overflow-hidden'">
    <!-- Header (sauf si embedded - WOD a son propre header) -->
    <div v-if="!embedded" class="p-3 flex items-center gap-3" :style="`background:${bg}`">
      <span class="text-2xl">{{ icon }}</span>
      <div class="flex-1">
        <p class="font-semibold" :style="`color:${color}`">{{ title }}</p>
        <p class="text-xs" :style="`color:${color};opacity:0.7`">{{ items.length }} exercice(s)</p>
      </div>
    </div>

    <!-- Items -->
    <div class="p-2 space-y-2 bg-white">
      <div v-for="(item, i) in items" :key="item._key"
        class="p-2 bg-gray-50 rounded-xl flex items-start gap-2">
        <div class="flex flex-col gap-1 pt-1">
          <button @click="$emit('moveUp', i)" :disabled="i === 0"
            class="text-gray-300 disabled:opacity-20 text-xs leading-none">▲</button>
          <button @click="$emit('moveDown', i)" :disabled="i === items.length-1"
            class="text-gray-300 disabled:opacity-20 text-xs leading-none">▼</button>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ item.exercise?.name }}</p>
          <p class="text-xs text-gray-400 mb-2 truncate">
            {{ item.exercise?.muscle_group }}<span v-if="item.exercise?.equipment"> · {{ item.exercise.equipment }}</span>
          </p>
          <div class="grid gap-1.5" :class="section === 'wod' ? 'grid-cols-3' : 'grid-cols-4'">
            <div>
              <label class="block text-xs text-gray-400 mb-0.5">Séries</label>
              <input v-model.number="item.sets" type="number" min="1" max="20"
                class="input py-1 text-center text-xs" />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-0.5">Reps</label>
              <input v-model.number="item.reps" type="number" min="1" max="100"
                class="input py-1 text-center text-xs" />
            </div>
            <div>
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
        <button @click="$emit('remove', item)"
          class="text-gray-300 hover:text-red-400 text-base leading-none pt-0.5 px-1">×</button>
      </div>
    </div>

    <!-- Add button -->
    <div class="p-2">
      <button @click="$emit('add')"
        class="w-full text-center text-xs font-medium py-2 border border-dashed rounded-xl"
        :style="embedded
          ? 'color:#A32D2D;border-color:rgba(163,45,45,0.3)'
          : `color:${color};border-color:${color}40`">
        + Ajouter un exercice
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  section: { type: String, required: true },
  title: String,
  icon: String,
  color: String,
  bg: String,
  items: { type: Array, default: () => [] },
  embedded: { type: Boolean, default: false }
})
defineEmits(['add', 'remove', 'moveUp', 'moveDown'])
</script>
