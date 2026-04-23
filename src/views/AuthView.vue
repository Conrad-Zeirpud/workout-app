<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 bg-brand">
    <ToastContainer />
    <div class="w-full max-w-sm">
      <div class="text-center mb-10">
        <div class="text-5xl mb-3">💪</div>
        <h1 class="text-3xl font-bold text-white">WorkoutApp</h1>
        <p class="text-white/60 mt-1 text-sm">Construis et lance tes séances</p>
      </div>

      <div class="bg-white rounded-3xl p-6 shadow-2xl">
        <div class="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button @click="mode = 'login'" class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            :class="mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-400'">Connexion</button>
          <button @click="mode = 'register'" class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            :class="mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-400'">Inscription</button>
        </div>

        <form @submit.prevent="submit" class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input v-model="email" type="email" required placeholder="ton@email.com" class="input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Mot de passe</label>
            <input v-model="password" type="password" required placeholder="••••••••" class="input" />
          </div>
          <button type="submit" :disabled="loading"
            class="btn-primary w-full mt-2 flex items-center justify-center gap-2">
            <span v-if="loading" class="animate-spin">⟳</span>
            {{ mode === 'login' ? 'Se connecter' : 'Créer un compte' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const auth = useAuthStore()
const router = useRouter()
const { show } = useToast()
const mode = ref('login')
const email = ref('')
const password = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    if (mode.value === 'login') await auth.signIn(email.value, password.value)
    else await auth.signUp(email.value, password.value)
    router.push('/')
  } catch (e) {
    show(e.message || 'Erreur de connexion', 'error')
  } finally {
    loading.value = false
  }
}
</script>
