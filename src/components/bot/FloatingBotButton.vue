<template>
  <button v-if="visible"
    @click="bot.open()"
    class="fixed z-30 active:scale-90 transition-transform"
    :style="`right:1rem; bottom:${bottomOffset}; box-shadow:0 6px 20px rgba(26,26,46,0.35)`"
    aria-label="Ouvrir le coach">
    <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white"
      style="background:linear-gradient(135deg,#1a1a2e,#2d2d5e)">
      🤖
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBotStore } from '@/stores/bot'

const bot = useBotStore()
const route = useRoute()

const HIDDEN_ROUTES = ['session', 'timer-run', 'auth']
const visible = computed(() => !HIDDEN_ROUTES.includes(route.name))

const bottomOffset = computed(() => 'calc(5rem + env(safe-area-inset-bottom))')
</script>
