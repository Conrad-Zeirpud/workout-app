<template>
  <div class="card p-4 flex items-center gap-3">
    <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      :style="`background:${tagColor.bg}`">
      {{ tagColor.icon }}
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-gray-900 truncate">{{ workout.name }}</p>
      <p class="text-xs text-gray-400 mt-0.5">
        {{ workout.workout_items?.length || 0 }} exercices
        <span v-if="workout.description" class="ml-1">· {{ workout.description }}</span>
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
const props = defineProps({ workout: Object })
defineEmits(['start'])
const icons = ['💪','🏃','🦵','🏋️','🤸','🧘','🚴','⚡']
const bgs = ['#E6F1FB','#EAF3DE','#FAEEDA','#EEEDFE','#E1F5EE','#FBEAF0','#FAECE7','#F1EFE8']
const tagColor = computed(() => {
  const i = Math.abs(props.workout.name?.charCodeAt(0) || 0) % icons.length
  return { icon: icons[i], bg: bgs[i] }
})
</script>
