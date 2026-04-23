<template>
  <span class="badge text-xs" :style="`background:${bg};color:${color}`">{{ group }}</span>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ group: String })

const palette = {
  'Pectoraux':  { bg: '#E6F1FB', color: '#0C447C' },
  'Dos':        { bg: '#EAF3DE', color: '#3B6D11' },
  'Épaules':    { bg: '#EEEDFE', color: '#3C3489' },
  'Biceps':     { bg: '#FAEEDA', color: '#854F0B' },
  'Triceps':    { bg: '#FAECE7', color: '#712B13' },
  'Jambes':     { bg: '#E1F5EE', color: '#085041' },
  'Fessiers':   { bg: '#FBEAF0', color: '#72243E' },
  'Abdominaux': { bg: '#F1EFE8', color: '#444441' },
  'Full Body':  { bg: '#FCEBEB', color: '#791F1F' },
  'Cardio':     { bg: '#EAF3DE', color: '#27500A' },
}

const bg = computed(() => palette[props.group]?.bg || '#F1EFE8')
const color = computed(() => palette[props.group]?.color || '#444441')
</script>
