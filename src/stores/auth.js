import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const initialized = ref(false)  // ⚠️ FIX BUG : exposé en ref pour que le router puisse le lire

  async function init() {
    if (initialized.value) return
    initialized.value = true
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    supabase.auth.onAuthStateChange((_, session) => {
      user.value = session?.user ?? null
    })
  }

  async function signIn(email, password) {
    loading.value = true
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    loading.value = false
    if (error) throw error
  }

  async function signUp(email, password) {
    loading.value = true
    const { error } = await supabase.auth.signUp({ email, password })
    loading.value = false
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, loading, initialized, init, signIn, signUp, signOut }
})
