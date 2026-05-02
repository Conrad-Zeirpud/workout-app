import { defineStore } from 'pinia'
import { ref } from 'vue'

// Store FAQ pure : pas de Coach IA, juste les questions/réponses statiques

export const useBotStore = defineStore('bot', () => {
  const isOpen = ref(false)
  const view = ref('home')           // 'home' | 'category'
  const currentCategory = ref(null)
  const expandedId = ref(null)

  function open() { isOpen.value = true }
  function close() { isOpen.value = false }

  function goToCategory(catId) {
    currentCategory.value = catId
    view.value = 'category'
    expandedId.value = null
  }

  function backToHome() {
    view.value = 'home'
    currentCategory.value = null
    expandedId.value = null
  }

  function toggleExpand(id) {
    expandedId.value = expandedId.value === id ? null : id
  }

  return {
    isOpen, view, currentCategory, expandedId,
    open, close, goToCategory, backToHome, toggleExpand
  }
})
