<template>
  <transition name="bot-modal">
    <div v-if="bot.isOpen"
      class="fixed inset-0 z-50 flex flex-col"
      style="background:#f9fafb">

      <!-- Header -->
      <div class="px-4 pb-3 flex-shrink-0"
        style="background:linear-gradient(135deg,#1a1a2e,#2d2d5e); padding-top: max(2.5rem, env(safe-area-inset-top))">
        <div class="flex items-center justify-between">
          <button v-if="bot.view !== 'home'" @click="bot.backToHome()"
            class="text-white/70 text-sm px-2 py-1">← Retour</button>
          <div v-else class="w-16" />
          <div class="text-center flex-1">
            <p class="text-white font-bold">{{ headerTitle }}</p>
          </div>
          <button @click="bot.close()" class="text-white/70 text-xl px-2 py-1" aria-label="Fermer">✕</button>
        </div>
      </div>

      <!-- HOME : grille de catégories -->
      <div v-if="bot.view === 'home'" class="flex-1 overflow-y-auto px-4 py-4">
        <div class="text-center mb-6">
          <div class="text-5xl mb-2">📚</div>
          <h2 class="text-xl font-bold text-gray-900">Centre d'aide</h2>
          <p class="text-sm text-gray-500 mt-1">Choisis une catégorie</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div v-for="cat in categories" :key="cat.id"
            @click="bot.goToCategory(cat.id)"
            class="card p-4 cursor-pointer active:scale-95 transition-transform"
            :style="`border-top:3px solid ${cat.color}`">
            <div class="text-2xl mb-1">{{ cat.icon }}</div>
            <p class="text-sm font-semibold text-gray-900">{{ cat.label }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ cat.count }} question(s)</p>
          </div>
        </div>
      </div>

      <!-- CATEGORY : liste accordéon -->
      <div v-else-if="bot.view === 'category'" class="flex-1 overflow-y-auto px-4 py-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="text-3xl">{{ currentCat?.icon }}</div>
          <div>
            <h2 class="font-bold text-gray-900">{{ currentCat?.label }}</h2>
            <p class="text-xs text-gray-400">{{ currentEntries.length }} questions</p>
          </div>
        </div>

        <div class="space-y-2">
          <div v-for="entry in currentEntries" :key="entry.id"
            class="card overflow-hidden">
            <button @click="bot.toggleExpand(entry.id)"
              class="w-full p-3 text-left flex items-center justify-between gap-3">
              <p class="text-sm font-medium text-gray-900 flex-1">{{ entry.question }}</p>
              <span class="text-gray-400 text-sm flex-shrink-0 transition-transform"
                :class="bot.expandedId === entry.id ? 'rotate-180' : ''">▼</span>
            </button>

            <transition name="expand">
              <div v-if="bot.expandedId === entry.id"
                class="px-3 pb-3 text-sm text-gray-600 whitespace-pre-line border-t border-gray-100 pt-3">
                {{ entry.answer }}
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useBotStore } from '@/stores/bot'
import { BOT_CATEGORIES, BOT_KNOWLEDGE } from '@/lib/botKnowledge'

const bot = useBotStore()

const categories = computed(() =>
  Object.entries(BOT_CATEGORIES).map(([id, meta]) => ({
    id,
    ...meta,
    count: BOT_KNOWLEDGE.filter(e => e.category === id).length
  }))
)

const currentCat = computed(() =>
  bot.currentCategory ? { id: bot.currentCategory, ...BOT_CATEGORIES[bot.currentCategory] } : null
)

const currentEntries = computed(() =>
  bot.currentCategory ? BOT_KNOWLEDGE.filter(e => e.category === bot.currentCategory) : []
)

const headerTitle = computed(() => {
  if (bot.view === 'home') return 'Aide'
  return currentCat.value?.label || 'Aide'
})
</script>

<style scoped>
.bot-modal-enter-active, .bot-modal-leave-active { transition: transform 0.3s ease, opacity 0.2s; }
.bot-modal-enter-from, .bot-modal-leave-to { transform: translateY(100%); opacity: 0; }

.expand-enter-active, .expand-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.expand-enter-to, .expand-leave-from {
  max-height: 800px;
  opacity: 1;
}

.rotate-180 { transform: rotate(180deg); }
</style>
