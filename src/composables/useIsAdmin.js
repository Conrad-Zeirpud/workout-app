import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable pour savoir si l'utilisateur courant est admin.
 *
 * ⚠️ Sécurité : ce check est PUREMENT côté UX (cacher des boutons).
 * La VRAIE sécurité est côté Supabase via les RLS policies sur le bucket Storage
 * et les tables sensibles. Ne jamais se reposer dessus pour un check de sécurité.
 *
 * Configure VITE_ADMIN_EMAIL dans tes variables Vercel (et dans .env.local pour le dev).
 */
export function useIsAdmin() {
  const auth = useAuthStore()
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim()

  const isAdmin = computed(() => {
    if (!auth.user || !adminEmail) return false
    return auth.user.email?.toLowerCase() === adminEmail
  })

  return { isAdmin }
}
