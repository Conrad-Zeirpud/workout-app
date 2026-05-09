<template>
  <div class="relative overflow-hidden rounded-2xl"
    :data-id="workout.id">

    <!-- Background : actions cachées révélées au swipe -->
    <div class="absolute inset-y-0 right-0 flex items-stretch z-0">
      <button @click="onAction('duplicate')"
        class="w-12 flex items-center justify-center text-white text-base"
        style="background:#7F77DD" aria-label="Dupliquer">📋</button>
      <button @click="onAction('launch')"
        class="w-12 flex items-center justify-center text-white text-base"
        style="background:var(--accent)" aria-label="Lancer">▶</button>
      <button @click="onAction('delete')"
        class="w-12 flex items-center justify-center text-white text-base"
        style="background:#E24B4A" aria-label="Supprimer">🗑</button>
    </div>

    <!-- Carte qui se translate -->
    <div ref="cardRef"
      class="card flex items-center gap-2 relative z-10 bg-white"
      :style="{
        transform: `translateX(${offset}px)`,
        borderLeft: `3px solid ${cat.color}`,
        padding: '0.625rem 0.75rem 0.625rem 0.5rem',
        touchAction: 'pan-y',
        transition: isSwiping ? 'none' : 'transform 0.2s'
      }">

      <div class="drag-handle flex items-center justify-center text-gray-300 flex-shrink-0 -ml-1"
        style="width:1.5rem;height:2.5rem;touch-action:none">
        <span class="text-base leading-none select-none">⋮⋮</span>
      </div>

      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        :style="`background:${cat.bg}`">{{ cat.icon }}</div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <p class="font-semibold text-gray-900 truncate text-sm">{{ workout.name }}</p>
          <span v-if="workout.program_subscription_id"
            class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style="background:#FEF3C7;color:#854F0B">
            S{{ workout.program_week }}
          </span>
        </div>
        <p class="text-xs text-gray-400 truncate mt-0.5">
          {{ workout.workout_items?.length || 0 }} exercices<span v-if="workout.description"> · {{ workout.description }}</span>
        </p>
      </div>

      <!-- Bouton principal : Modifier (action la plus fréquente) -->
      <button @click="onEdit"
        class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
        style="background:#378ADD;color:white" aria-label="Modifier">✏️</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getCategory } from '@/lib/categories'

const props = defineProps({
  workout: { type: Object, required: true },
  resetSignal: { type: Number, default: 0 }
})
const emit = defineEmits(['launch', 'edit', 'duplicate', 'delete', 'opened'])

const cardRef = ref(null)
const cat = computed(() => getCategory(props.workout.category))

const offset = ref(0)
const isOpen = ref(false)
const isSwiping = ref(false)

let startX = 0
let startY = 0
let startOffset = 0
let lockedAxis = null
const REVEAL = 144      // 3 boutons × 48px
const THRESHOLD = 0.4

function handleTouchStart(e) {
  if (e.touches.length !== 1) return
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  startOffset = offset.value
  lockedAxis = null
  isSwiping.value = false
}

function handleTouchMove(e) {
  if (e.touches.length !== 1) return
  const dx = e.touches[0].clientX - startX
  const dy = e.touches[0].clientY - startY

  if (!lockedAxis) {
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (absDx < 8 && absDy < 8) return
    lockedAxis = absDx > absDy ? 'x' : 'y'
  }

  if (lockedAxis === 'y') return

  e.preventDefault()
  isSwiping.value = true

  let newOffset = startOffset + dx
  if (newOffset > 0) newOffset = newOffset * 0.3
  if (newOffset < -REVEAL - 40) {
    const overshoot = newOffset + REVEAL + 40
    newOffset = -REVEAL - 40 + overshoot * 0.3
  }
  offset.value = newOffset
}

function handleTouchEnd() {
  if (lockedAxis === 'y') {
    lockedAxis = null
    return
  }
  isSwiping.value = false
  lockedAxis = null

  const snapThreshold = REVEAL * THRESHOLD

  if (isOpen.value) {
    if (offset.value > -REVEAL + snapThreshold) {
      offset.value = 0
      isOpen.value = false
    } else {
      offset.value = -REVEAL
    }
  } else {
    if (offset.value < -snapThreshold) {
      offset.value = -REVEAL
      isOpen.value = true
      emit('opened', props.workout.id)
    } else {
      offset.value = 0
    }
  }
}

function attach(el) {
  if (!el) return
  el.addEventListener('touchstart', handleTouchStart, { passive: true })
  el.addEventListener('touchmove', handleTouchMove, { passive: false })
  el.addEventListener('touchend', handleTouchEnd, { passive: true })
  el.addEventListener('touchcancel', handleTouchEnd, { passive: true })
}

function detach(el) {
  if (!el) return
  el.removeEventListener('touchstart', handleTouchStart)
  el.removeEventListener('touchmove', handleTouchMove)
  el.removeEventListener('touchend', handleTouchEnd)
  el.removeEventListener('touchcancel', handleTouchEnd)
}

onMounted(() => attach(cardRef.value))
onUnmounted(() => detach(cardRef.value))

watch(() => props.resetSignal, () => {
  offset.value = 0
  isOpen.value = false
})

function onEdit() {
  if (isOpen.value) {
    offset.value = 0
    isOpen.value = false
    return
  }
  emit('edit', props.workout)
}

function onAction(action) {
  offset.value = 0
  isOpen.value = false
  emit(action, props.workout)
}
</script>
