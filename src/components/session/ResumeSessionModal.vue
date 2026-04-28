<template>
  <transition name="modal">
    <div v-if="visible" class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-4 pb-8"
      @click.self="dismiss">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <div class="text-center mb-4">
          <div class="text-5xl mb-2">⏸</div>
          <h3 class="font-bold text-gray-900 text-lg">Séance en cours</h3>
          <p class="text-sm text-gray-500 mt-1">
            Tu avais commencé une séance il y a {{ ageLabel }}
          </p>
        </div>

        <div class="bg-gray-50 rounded-2xl p-4 mb-5">
          <p class="font-semibold text-gray-900 mb-1">{{ snapshot?.workout?.name }}</p>
          <div class="flex items-center gap-3 text-xs text-gray-500">
            <span>⏱ {{ formatDuration(snapshot?.elapsed) }}</span>
            <span>✓ {{ doneSetsCount }} série(s) faites</span>
            <span>📊 {{ progressPct }}%</span>
          </div>
        </div>

        <div class="flex gap-3">
          <button @click="discard" class="btn-ghost flex-1 text-sm py-3">
            Abandonner
          </button>
          <button @click="resume" class="btn-accent flex-1 text-sm py-3 font-semibold">
            ▶ Reprendre
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  snapshot: Object
})
const emit = defineEmits(['resume', 'discard', 'dismiss'])

const ageLabel = computed(() => {
  if (!props.snapshot?.savedAt) return 'quelques instants'
  const ageMs = Date.now() - new Date(props.snapshot.savedAt).getTime()
  const minutes = Math.round(ageMs / 60000)
  if (minutes < 1) return 'moins d\'une minute'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  if (remMin === 0) return `${hours}h`
  return `${hours}h${String(remMin).padStart(2, '0')}`
})

const doneSetsCount = computed(() =>
  props.snapshot?.sets?.filter(s => s.done).length || 0
)

const progressPct = computed(() => {
  const total = props.snapshot?.sets?.length || 0
  if (total === 0) return 0
  return Math.round((doneSetsCount.value / total) * 100)
})

function formatDuration(sec) {
  if (!sec) return '0:00'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function resume() { emit('resume') }
function discard() { emit('discard') }
function dismiss() { emit('dismiss') }
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active > div, .modal-leave-active > div { transition: transform 0.25s; }
.modal-enter-from > div, .modal-leave-to > div { transform: translateY(20px); }
</style>
