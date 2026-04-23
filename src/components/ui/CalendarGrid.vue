<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <button @click="prev" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">‹</button>
      <span class="text-sm font-semibold text-gray-900">{{ monthLabel }}</span>
      <button @click="next" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">›</button>
    </div>
    <div class="grid grid-cols-7 gap-0.5 mb-1">
      <div v-for="d in days" :key="d" class="text-center text-xs text-gray-400 font-medium py-1">{{ d }}</div>
    </div>
    <div class="grid grid-cols-7 gap-0.5">
      <div v-for="blank in firstDayOfMonth" :key="'b'+blank" />
      <div v-for="day in daysInMonth" :key="day"
        class="aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all"
        :class="cellClass(day)"
        @click="$emit('select', { year: currentYear, month: currentMonth, day })">
        {{ day }}
        <span v-if="data[day]" class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ data: { type: Object, default: () => ({}) } })
defineEmits(['select'])

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth())

const days = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const monthLabel = computed(() => `${monthNames[currentMonth.value]} ${currentYear.value}`)
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const firstDayOfMonth = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return d === 0 ? 6 : d - 1
})

function cellClass(day) {
  const isToday = day === now.getDate() && currentMonth.value === now.getMonth() && currentYear.value === now.getFullYear()
  const hasSession = !!props.data[day]
  return [
    'relative cursor-pointer',
    hasSession ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-700 hover:bg-gray-100',
    isToday ? 'ring-2 ring-brand ring-offset-1' : ''
  ]
}

function prev() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}
function next() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}
</script>

<style scoped>
.bg-accent\/10 { background-color: rgba(99, 153, 34, 0.1); }
.text-accent { color: var(--accent); }
.ring-brand { --tw-ring-color: var(--brand); }
</style>
