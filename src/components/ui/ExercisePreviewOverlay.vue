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
          <div class="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">

            <!-- Vidéo MP4/WebM en boucle (priorité 1) -->
            <video v-if="mediaType === 'video' && mediaUrl && !mediaError"
              ref="videoEl"
              :src="mediaUrl"
              autoplay
              loop
              muted
              playsinline
              preload="metadata"
              class="w-full h-full object-contain"
              @error="onMediaError" />

            <!-- Image / GIF (priorité 2 - pour exos custom uploadés en image) -->
            <img v-else-if="(mediaType === 'image' || mediaType === 'gif') && mediaUrl && !mediaError"
              :src="mediaUrl"
              :alt="exercise?.name"
              class="w-full h-full object-contain"
              @error="onMediaError" />

            <!-- YouTube (priorité 3) -->
            <iframe v-else-if="mediaType === 'youtube' && mediaUrl"
              :src="youtubeEmbedUrl"
              class="w-full h-full"
              frameborder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope"
              allowfullscreen />

            <!-- Fallback : pas de média ou erreur -->
            <div v-else class="text-center text-gray-400 px-6">
              <div class="text-5xl mb-2">{{ exerciseEmoji }}</div>
              <p class="text-sm font-medium text-gray-500">{{ exercise?.name }}</p>
              <p class="text-xs text-gray-300 mt-2">Aucune vidéo de démonstration</p>
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
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  exercise: Object
})
defineEmits(['close'])

const videoEl = ref(null)
const mediaError = ref(false)

const mediaType = computed(() => props.exercise?.media_type || null)
const mediaUrl = computed(() => props.exercise?.media_url || null)

// Pour YouTube
const youtubeEmbedUrl = computed(() => {
  const url = mediaUrl.value
  if (!url) return null
  // Extract video ID from various YouTube URL formats
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&loop=1&playlist=${match[1]}&controls=0&modestbranding=1` : url
})

// Emoji représentatif si pas de média
const exerciseEmoji = computed(() => {
  const name = props.exercise?.name?.toLowerCase() || ''
  if (name.includes('squat')) return '🦵'
  if (name.includes('bench') || name.includes('couché')) return '🏋️'
  if (name.includes('run') || name.includes('course')) return '🏃'
  if (name.includes('row') || name.includes('rowing')) return '🚣'
  if (name.includes('bike') || name.includes('vélo')) return '🚴'
  if (name.includes('ski')) return '⛷️'
  if (name.includes('jump') || name.includes('saut')) return '🤸'
  if (name.includes('pull') || name.includes('tract')) return '💪'
  if (name.includes('push') || name.includes('pomp')) return '👐'
  if (name.includes('plank') || name.includes('planche')) return '🧘'
  return '🏋️'
})

function onMediaError() {
  mediaError.value = true
}

watch(() => props.visible, (v) => {
  if (v) {
    mediaError.value = false
    // Forcer le rechargement de la vidéo si elle existe
    setTimeout(() => {
      if (videoEl.value) {
        videoEl.value.load()
        videoEl.value.play().catch(() => {})
      }
    }, 50)
  } else {
    // Pause la vidéo quand on ferme
    if (videoEl.value) videoEl.value.pause()
  }
})
</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.overlay-enter-active > div, .overlay-leave-active > div { transition: transform 0.25s; }
.overlay-enter-from > div, .overlay-leave-to > div { transform: scale(0.92); }
.aspect-square { aspect-ratio: 1; }
</style>
