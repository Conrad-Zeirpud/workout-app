<template>
  <transition name="overlay">
    <div v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      style="background:rgba(0,0,0,0.85); backdrop-filter:blur(4px)"
      @click.self="$emit('close')">

      <div class="relative w-full max-w-md">
        <button @click="$emit('close')"
          class="absolute -top-10 right-0 text-white text-3xl leading-none p-2">
          ×
        </button>

        <div class="bg-white rounded-3xl overflow-hidden shadow-2xl">
          <div class="relative aspect-square bg-gray-100 flex items-center justify-center">
            <iframe v-if="mediaType === 'youtube'"
              :src="primaryUrl"
              class="w-full h-full"
              frameborder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope"
              allowfullscreen />

            <!-- Animated images : alternate between 2+ URLs -->
            <template v-else-if="imageUrls.length > 0 && !mediaError">
              <img v-for="(url, i) in imageUrls" :key="url"
                :src="url"
                :alt="exercise?.name"
                class="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
                :style="`opacity:${i === currentFrame ? 1 : 0}`"
                @error="onMediaError" />

              <!-- Hint label if multi-image -->
              <div v-if="imageUrls.length > 1"
                class="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium text-white"
                style="background:rgba(0,0,0,0.5)">
                {{ currentFrame + 1 }} / {{ imageUrls.length }}
              </div>
            </template>

            <div v-else class="text-center text-gray-400 px-6">
              <div class="text-5xl mb-2">📷</div>
              <p class="text-sm">Aucun visuel disponible</p>
              <p class="text-xs text-gray-300 mt-1">Tu peux ajouter un GIF ou une vidéo via la fiche exercice</p>
            </div>
          </div>

          <div class="p-4">
            <p class="font-bold text-gray-900">{{ exercise?.name }}</p>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ exercise?.muscle_group }}<span v-if="exercise?.equipment"> · {{ exercise.equipment }}</span>
            </p>
            <p v-if="exercise?.notes" class="text-sm text-gray-600 mt-2">{{ exercise.notes }}</p>
          </div>
        </div>

        <p class="text-white/50 text-xs text-center mt-3">Tape n'importe où pour fermer</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { youtubeToEmbed, parseMediaUrls } from '@/lib/exerciseMedia'

const props = defineProps({
  visible: Boolean,
  exercise: Object
})
defineEmits(['close'])

const mediaError = ref(false)
const currentFrame = ref(0)
let animationInterval = null

const mediaType = computed(() => props.exercise?.media_type || null)

const imageUrls = computed(() => {
  if (!props.exercise?.media_url) return []
  if (mediaType.value === 'youtube') return []
  return parseMediaUrls(props.exercise.media_url)
})

const primaryUrl = computed(() => {
  const url = props.exercise?.media_url
  if (mediaType.value === 'youtube') {
    return youtubeToEmbed(url) || url
  }
  return imageUrls.value[0] || null
})

function onMediaError() {
  mediaError.value = true
}

function startAnimation() {
  stopAnimation()
  if (imageUrls.value.length > 1) {
    animationInterval = setInterval(() => {
      currentFrame.value = (currentFrame.value + 1) % imageUrls.value.length
    }, 800)
  }
}

function stopAnimation() {
  if (animationInterval) {
    clearInterval(animationInterval)
    animationInterval = null
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    mediaError.value = false
    currentFrame.value = 0
    startAnimation()
  } else {
    stopAnimation()
  }
})

onUnmounted(stopAnimation)
</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.overlay-enter-active > div, .overlay-leave-active > div { transition: transform 0.25s; }
.overlay-enter-from > div, .overlay-leave-to > div { transform: scale(0.92); }
.aspect-square { aspect-ratio: 1; }
</style>
