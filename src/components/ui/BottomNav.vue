<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30"
    style="padding-bottom: env(safe-area-inset-bottom)">
    <div class="flex items-stretch">
      <router-link v-for="item in items" :key="item.to" :to="item.to"
        class="flex-1 flex flex-col items-center justify-center py-2 transition-colors"
        :class="isActive(item) ? 'text-brand' : 'text-gray-400'">
        <span class="text-xl mb-0.5">{{ item.icon }}</span>
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { to: '/',          label: 'Accueil',    icon: '🏠', name: 'dashboard' },
  { to: '/planning',  label: 'Planning',   icon: '📅', name: 'planning' },
  { to: '/workouts',  label: 'Séances',    icon: '📋', name: 'workouts' },
  { to: '/programs',  label: 'Programmes', icon: '🎯', name: 'programs' },
  { to: '/profile',   label: 'Profil',     icon: '👤', name: 'profile' }
]

function isActive(item) {
  if (item.to === '/') return route.path === '/'
  return route.path.startsWith(item.to)
}
</script>
