<template>
  <div class="card overflow-hidden mb-4"
    :style="`background:linear-gradient(135deg,${color}15,${color}30); border:none`">
    <!-- Header -->
    <div class="p-4">
      <div class="flex items-start gap-3">
        <span class="text-3xl">{{ icon }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide" :style="`color:${textColor}`">
            📌 Programme en cours
          </p>
          <p class="font-bold text-gray-900 truncate">{{ subscription.program?.name }}</p>
          <p class="text-xs text-gray-600 mt-0.5">
            Démarré le {{ formatDate(subscription.started_at) }}
          </p>
        </div>
        <div class="relative">
          <button @click="showMenu = !showMenu"
            class="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-gray-700 text-sm">
            ⋯
          </button>
          <div v-if="showMenu"
            class="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-44">
            <button @click="emitShift" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              📅 Décaler de X jours
            </button>
            <button @click="emitCancel" class="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50">
              ✕ Annuler le programme
            </button>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div v-if="stats" class="mt-4">
        <div class="flex items-center justify-between mb-1.5 text-xs">
          <span :style="`color:${textColor}`" class="font-medium">
            Semaine {{ stats.currentWeek }} / {{ stats.totalWeeks }}
          </span>
          <span class="text-gray-600 font-semibold">{{ stats.progressPct }}%</span>
        </div>
        <div class="h-2 bg-white/40 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500"
            :style="`width:${stats.progressPct}%; background:${color}`" />
        </div>
      </div>
    </div>

    <!-- Click overlay closes menu when tapping outside -->
    <div v-if="showMenu" class="fixed inset-0 z-0" @click="showMenu = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  subscription: { type: Object, required: true },
  stats: { type: Object, default: null }
})

const emit = defineEmits(['shift', 'cancel'])

const showMenu = ref(false)

const color = computed(() => props.subscription.program?.color || '#1a1a2e')
const icon = computed(() => props.subscription.program?.icon || '📋')
const textColor = computed(() => {
  // Couleur foncée pour le label, dérivée de la couleur du programme
  const c = color.value
  return c === '#1a1a2e' ? '#1a1a2e' : c
})

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('fr', { day: 'numeric', month: 'long' })
}

function emitShift() {
  showMenu.value = false
  emit('shift')
}

function emitCancel() {
  showMenu.value = false
  emit('cancel')
}
</script>
