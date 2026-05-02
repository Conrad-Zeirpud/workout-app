<template>
  <div v-if="error" class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
    <div class="text-6xl mb-4">😬</div>
    <h1 class="text-xl font-bold text-gray-900 mb-2">Oups, un problème est survenu</h1>
    <p class="text-sm text-gray-500 text-center mb-6 max-w-sm">
      L'app a rencontré une erreur inattendue. Tu peux essayer de rafraîchir la page ou revenir à l'accueil.
    </p>
    <details class="text-xs text-gray-400 mb-6 max-w-sm w-full">
      <summary class="cursor-pointer">Détails techniques</summary>
      <pre class="bg-gray-100 p-3 rounded-lg mt-2 overflow-x-auto text-[10px]">{{ error.message }}</pre>
    </details>
    <div class="flex gap-3">
      <button @click="reload" class="btn-primary text-sm">Rafraîchir</button>
      <button @click="goHome" class="btn-ghost text-sm">Accueil</button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err) => {
  console.error('App error captured:', err)
  error.value = err
  // Return false pour empêcher la propagation (l'erreur a été gérée)
  return false
})

function reload() {
  window.location.reload()
}

function goHome() {
  error.value = null
  window.location.href = '/'
}
</script>
