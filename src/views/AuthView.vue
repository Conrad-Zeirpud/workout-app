<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-brand to-brand-light px-6 py-12">
    <div class="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
      <!-- Logo / Branding -->
      <div class="text-center mb-10">
        <div class="text-6xl mb-3">💪</div>
        <h1 class="text-white text-3xl font-bold">WorkoutApp</h1>
        <p class="text-white/60 text-sm mt-2">{{ mode === 'signup' ? 'Crée ton compte' : 'Connecte-toi' }}</p>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-3xl p-6 shadow-2xl">
        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="ton@email.com"
              class="input"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Mot de passe</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
                placeholder="••••••••"
                class="input pr-12"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:scale-90 transition-transform p-1"
                :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                <span class="text-lg">{{ showPassword ? '🙈' : '👁' }}</span>
              </button>
            </div>
            <p v-if="mode === 'signup'" class="text-xs text-gray-400 mt-1">
              6 caractères minimum
            </p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn-accent w-full py-3 font-semibold flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="animate-spin text-xs">⟳</span>
            {{ mode === 'signup' ? 'Créer mon compte' : 'Se connecter' }}
          </button>

          <p v-if="error" class="text-red-500 text-xs text-center">{{ error }}</p>
          <p v-if="success" class="text-green-600 text-xs text-center">{{ success }}</p>
        </form>

        <div class="mt-5 pt-5 border-t border-gray-100 text-center">
          <button
            type="button"
            @click="toggleMode"
            class="text-sm text-brand font-medium"
          >
            {{ mode === 'signup' ? 'J\'ai déjà un compte' : 'Créer un compte' }}
          </button>
        </div>
      </div>

      <p class="text-center text-white/40 text-xs mt-6">
        Tes données sont stockées de manière sécurisée
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const mode = ref('signin')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

function toggleMode() {
  mode.value = mode.value === 'signup' ? 'signin' : 'signup'
  error.value = ''
  success.value = ''
}

async function submit() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    if (mode.value === 'signup') {
      if (password.value.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères')
      }
      await auth.signUp(email.value, password.value)
      success.value = 'Compte créé ! Vérifie tes emails pour confirmer.'
    } else {
      await auth.signIn(email.value, password.value)
      router.push('/')
    }
  } catch (e) {
    error.value = e.message || 'Une erreur est survenue'
  }
  loading.value = false
}
</script>
