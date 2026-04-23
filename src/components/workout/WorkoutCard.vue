<template>
  <div class="card p-4 flex items-center gap-3" :style="`border-left: 3px solid ${cat.color}`">
    <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      :style="`background:${cat.bg}`">
      {{ cat.icon }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <p class="font-semibold text-gray-900 truncate">{{ workout.name }}</p>
      </div>
      <p class="text-xs text-gray-400 mt-0.5">
        {{ workout.workout_items?.length || 0 }} exercices
        <span v-if="workout.description"> · {{ workout.description }}</span>
      </p>
    </div>
    <div class="flex gap-2">
      <router-link :to="`/workouts/${workout.id}/edit`"
        class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">✏️</router-link>
      <button @click="$emit('start', workout)"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
        style="background:var(--accent)">▶</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getCategory } from '@/lib/categories'
const props = defineProps({ workout: Object })
defineEmits(['start'])
const cat = computed(() => getCategory(props.workout?.category))
</script>
