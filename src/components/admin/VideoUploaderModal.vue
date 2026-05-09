<template>
  <div v-if="visible" class="fixed inset-0 bg-black/60 z-50 flex items-end justify-center px-4 pb-8"
    @click.self="onClose">
    <div class="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <h3 class="font-bold text-gray-900 text-lg mb-1">📹 Vidéo de démonstration</h3>
      <p class="text-sm text-gray-500 mb-4">{{ exercise?.name }}</p>

      <!-- Aperçu vidéo actuelle si existe -->
      <div v-if="exercise?.media_url && step === 'idle'"
        class="mb-4 rounded-2xl overflow-hidden bg-gray-900 aspect-video">
        <video :src="exercise.media_url"
          autoplay loop muted playsinline
          class="w-full h-full object-contain" />
      </div>

      <!-- Étape : choix du fichier -->
      <div v-if="step === 'idle'">
        <input
          ref="fileInput"
          type="file"
          accept="video/*"
          @change="onFileSelected"
          class="hidden" />

        <button @click="$refs.fileInput.click()"
          class="w-full py-4 rounded-2xl border-2 border-dashed text-center"
          style="border-color:#cbd5e1;background:#fafafa">
          <div class="text-3xl mb-1">📱</div>
          <p class="text-sm font-semibold text-gray-700">
            {{ exercise?.media_url ? 'Remplacer la vidéo' : 'Choisir une vidéo' }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Depuis ta galerie, max {{ maxSizeMb }} Mo, {{ maxDuration }}s
          </p>
        </button>

        <div v-if="exercise?.media_url" class="mt-3">
          <button @click="confirmDelete = true"
            class="w-full py-2 rounded-xl text-sm font-medium text-red-500 bg-red-50">
            🗑 Supprimer la vidéo
          </button>
        </div>

        <div class="mt-4 p-3 bg-blue-50 rounded-xl">
          <p class="text-xs font-semibold text-blue-800 mb-1">💡 Conseils pour une bonne vidéo</p>
          <ul class="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
            <li>Format vertical ou horizontal, peu importe</li>
            <li>3 à 8 secondes : 2-3 répétitions du mouvement</li>
            <li>Bonne lumière, fond pas trop chargé</li>
            <li>Mouvement complet et propre</li>
          </ul>
        </div>
      </div>

      <!-- Étape : compression en cours -->
      <div v-else-if="step === 'compressing'" class="text-center py-6">
        <div class="text-4xl mb-3 inline-block animate-spin">⚙️</div>
        <p class="font-semibold text-gray-900">Compression de la vidéo</p>
        <p class="text-xs text-gray-500 mt-1 mb-4">Cela peut prendre 5 à 15 secondes</p>
        <div class="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div class="bg-brand h-full transition-all duration-300"
            :style="`width:${compressionProgress}%`" />
        </div>
        <p class="text-xs text-gray-400 mt-2">{{ compressionProgress }}%</p>
      </div>

      <!-- Étape : prévisualisation après compression -->
      <div v-else-if="step === 'preview'">
        <p class="text-xs text-gray-500 mb-2">Aperçu de la vidéo compressée :</p>
        <div class="rounded-2xl overflow-hidden bg-gray-900 aspect-video mb-3">
          <video :src="previewUrl"
            autoplay loop muted playsinline
            class="w-full h-full object-contain" />
        </div>
        <div class="flex justify-between text-xs text-gray-500 mb-4">
          <span>📦 {{ formatBytes(compressed?.sizeBytes) }}</span>
          <span>📐 {{ compressed?.width }}×{{ compressed?.height }}</span>
          <span>⏱ {{ compressed?.duration?.toFixed(1) }}s</span>
        </div>

        <div class="space-y-2">
          <button @click="upload" :disabled="uploading"
            class="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            style="background:linear-gradient(135deg,#1a1a2e,#2d2d5e)">
            <span v-if="uploading" class="animate-spin">⟳</span>
            <span v-else>☁️</span>
            {{ uploading ? `Upload ${uploadProgress}%` : 'Confirmer et téléverser' }}
          </button>
          <button @click="reset" :disabled="uploading"
            class="w-full py-2 text-sm text-gray-500">
            ← Choisir une autre vidéo
          </button>
        </div>
      </div>

      <!-- Étape : succès -->
      <div v-else-if="step === 'success'" class="text-center py-6">
        <div class="text-5xl mb-2">✓</div>
        <p class="font-bold text-gray-900">Vidéo téléversée</p>
        <p class="text-xs text-gray-500 mt-1 mb-4">
          Tous les utilisateurs verront cette vidéo en aperçu
        </p>
        <button @click="onClose" class="btn-accent text-sm py-2 px-6 font-semibold">
          OK
        </button>
      </div>

      <!-- Étape : erreur -->
      <div v-else-if="step === 'error'" class="text-center py-6">
        <div class="text-5xl mb-2">⚠️</div>
        <p class="font-bold text-gray-900">Erreur</p>
        <p class="text-xs text-gray-500 mt-1 mb-4 px-4">{{ errorMessage }}</p>
        <button @click="reset" class="btn-primary text-sm py-2 px-6">
          Réessayer
        </button>
      </div>

      <!-- Bouton fermer -->
      <button v-if="step === 'idle'" @click="onClose"
        class="w-full mt-3 py-2 text-sm text-gray-400">Fermer</button>
    </div>

    <!-- Confirmation suppression -->
    <div v-if="confirmDelete" class="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center px-4 pb-8"
      @click.self="confirmDelete = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Supprimer la vidéo ?</h3>
        <p class="text-sm text-gray-500 mb-5">
          Les utilisateurs ne verront plus de démonstration pour cet exercice.
        </p>
        <div class="flex gap-3">
          <button @click="confirmDelete = false" class="btn-ghost flex-1 text-sm py-2">Annuler</button>
          <button @click="doDelete" :disabled="deleting"
            class="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-40">
            <span v-if="deleting" class="animate-spin">⟳</span>
            <span v-else>Supprimer</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { compressVideo, formatBytes, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES } from '@/lib/videoCompression'
import { uploadExerciseVideo, deleteExerciseVideo } from '@/lib/exerciseVideos'
import { useWorkoutsStore } from '@/stores/workouts'

const props = defineProps({
  visible: Boolean,
  exercise: Object
})
const emit = defineEmits(['close', 'updated'])

const workouts = useWorkoutsStore()
const step = ref('idle')  // idle | compressing | preview | success | error
const compressionProgress = ref(0)
const compressed = ref(null)
const previewUrl = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')
const confirmDelete = ref(false)
const deleting = ref(false)

const maxSizeMb = MAX_FILE_SIZE_MB
const maxDuration = 10

watch(() => props.visible, (v) => {
  if (v) reset()
})

function reset() {
  step.value = 'idle'
  compressionProgress.value = 0
  compressed.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  uploading.value = false
  uploadProgress.value = 0
  errorMessage.value = ''
}

function onClose() {
  reset()
  emit('close')
}

async function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return

  // Reset l'input pour pouvoir resélectionner le même fichier après
  e.target.value = ''

  if (file.size > MAX_FILE_SIZE_BYTES) {
    errorMessage.value = `Fichier trop gros (${formatBytes(file.size)}). Max ${MAX_FILE_SIZE_MB} Mo.`
    step.value = 'error'
    return
  }

  if (!file.type.startsWith('video/')) {
    errorMessage.value = 'Le fichier sélectionné n\'est pas une vidéo.'
    step.value = 'error'
    return
  }

  step.value = 'compressing'
  compressionProgress.value = 0

  try {
    const result = await compressVideo(file, (pct) => {
      compressionProgress.value = pct
    })
    compressed.value = result
    previewUrl.value = URL.createObjectURL(result.blob)
    step.value = 'preview'
  } catch (err) {
    console.error('Compression failed:', err)
    errorMessage.value = err.message || 'Erreur lors de la compression'
    step.value = 'error'
  }
}

async function upload() {
  if (!compressed.value || !props.exercise) return
  uploading.value = true
  uploadProgress.value = 0

  try {
    // Petite simulation de progress car Supabase ne renvoie pas de progress natif
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) uploadProgress.value += 10
    }, 300)

    const { publicUrl } = await uploadExerciseVideo(
      props.exercise.id,
      compressed.value.blob,
      compressed.value.mimeType
    )

    clearInterval(progressInterval)
    uploadProgress.value = 100

    // Update DB
    await workouts.updateExerciseMedia(props.exercise.id, {
      media_url: publicUrl,
      media_type: 'video'
    })

    step.value = 'success'
    emit('updated')
  } catch (err) {
    console.error('Upload failed:', err)
    errorMessage.value = err.message || 'Erreur lors du téléversement'
    step.value = 'error'
  }
  uploading.value = false
}

async function doDelete() {
  if (!props.exercise) return
  deleting.value = true
  try {
    await deleteExerciseVideo(props.exercise.id)
    await workouts.updateExerciseMedia(props.exercise.id, {
      media_url: null,
      media_type: null
    })
    confirmDelete.value = false
    emit('updated')
    onClose()
  } catch (err) {
    console.error('Delete failed:', err)
    errorMessage.value = err.message || 'Erreur lors de la suppression'
    step.value = 'error'
    confirmDelete.value = false
  }
  deleting.value = false
}
</script>
