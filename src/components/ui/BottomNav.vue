<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 bottom-safe z-40">
    <div class="flex">
      <router-link v-for="item in items" :key="item.to" :to="item.to"
        class="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors"
        :class="isActive(item) ? 'text-brand' : 'text-gray-400'">
        <span class="text-xl leading-none" style="font-size:20px">{{ item.icon }}</span>
        <span class="font-medium">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const items = [
  { to: '/', icon: '🏠', label: 'Accueil', exact: true },
  { to: '/planning', icon: '📅', label: 'Planning' },
  { to: '/workouts', icon: '📋', label: 'Séances' },
  { to: '/timer', icon: '⏱', label: 'Timer' },
  { to: '/profile', icon: '👤', label: 'Profil' }
]
function isActive(item) {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}
</script>
