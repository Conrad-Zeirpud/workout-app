<template>
  <teleport to="body">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-72 pointer-events-none">
      <transition-group name="toast">
        <div v-for="t in toasts" :key="t.id"
          class="rounded-xl px-4 py-3 text-sm font-medium shadow-lg text-white pointer-events-auto text-center"
          :class="t.type === 'error' ? 'bg-red-500' : t.type === 'warning' ? 'bg-yellow-500' : 'bg-brand'">
          {{ t.message }}
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
const { toasts } = useToast()
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from { opacity: 0; transform: translateY(-12px); }
.toast-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
