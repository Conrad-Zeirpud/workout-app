<template>
  <div class="min-h-screen bg-gray-50">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <BottomNav v-if="showNav" />
    <FloatingBotButton />
    <BotModal />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/ui/BottomNav.vue'
import FloatingBotButton from '@/components/bot/FloatingBotButton.vue'
import BotModal from '@/components/bot/BotModal.vue'

const route = useRoute()
const showNav = computed(() => !['auth', 'session', 'session-summary', 'timer-run'].includes(route.name))
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
