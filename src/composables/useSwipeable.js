import { ref, onMounted, onUnmounted, watch } from 'vue'

/**
 * Composable pour gérer un swipe à gauche / droite sur un élément.
 *
 * ⚠️ Différence importante vs version précédente :
 * On attache les listeners NATIVEMENT (addEventListener) avec passive: false
 * pour pouvoir appeler preventDefault() sur touchmove. Vue 3 par défaut utilise
 * des listeners passifs sur les @touch* qui ne permettent PAS preventDefault.
 *
 * Usage :
 *   const elRef = ref(null)
 *   const swipe = useSwipeable(elRef, { revealWidth: 144 })
 *   <div ref="elRef" :style="{ transform: `translateX(${swipe.offset}px)` }">
 */
export function useSwipeable(elRef, { revealWidth = 144, threshold = 0.4 } = {}) {
  const offset = ref(0)
  const isOpen = ref(false)
  const isSwiping = ref(false)

  let startX = 0
  let startY = 0
  let startOffset = 0
  let lockedAxis = null
  let target = null

  function onTouchStart(e) {
    if (e.touches.length !== 1) return
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    startOffset = offset.value
    lockedAxis = null
    isSwiping.value = false
  }

  function onTouchMove(e) {
    if (e.touches.length !== 1) return
    const dx = e.touches[0].clientX - startX
    const dy = e.touches[0].clientY - startY

    if (!lockedAxis) {
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      if (absDx < 8 && absDy < 8) return
      lockedAxis = absDx > absDy ? 'x' : 'y'
    }

    if (lockedAxis === 'y') return

    // Mouvement horizontal → on bloque le scroll (preventDefault accessible car passive: false)
    e.preventDefault()
    isSwiping.value = true

    let newOffset = startOffset + dx

    if (newOffset > 0) {
      newOffset = newOffset * 0.3
    } else if (newOffset < -revealWidth - 40) {
      const overshoot = newOffset + revealWidth + 40
      newOffset = -revealWidth - 40 + overshoot * 0.3
    }

    offset.value = newOffset
  }

  function onTouchEnd() {
    if (lockedAxis === 'y') {
      lockedAxis = null
      return
    }

    isSwiping.value = false
    lockedAxis = null

    const snapThreshold = revealWidth * threshold

    if (isOpen.value) {
      if (offset.value > -revealWidth + snapThreshold) close()
      else open()
    } else {
      if (offset.value < -snapThreshold) open()
      else close()
    }
  }

  function attach(el) {
    if (!el) return
    target = el
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })  // ⚠️ non-passive
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
  }

  function detach() {
    if (!target) return
    target.removeEventListener('touchstart', onTouchStart)
    target.removeEventListener('touchmove', onTouchMove)
    target.removeEventListener('touchend', onTouchEnd)
    target.removeEventListener('touchcancel', onTouchEnd)
    target = null
  }

  onMounted(() => attach(elRef.value))
  onUnmounted(detach)
  watch(elRef, (el) => {
    detach()
    if (el) attach(el)
  })

  function open() {
    offset.value = -revealWidth
    isOpen.value = true
  }

  function close() {
    offset.value = 0
    isOpen.value = false
  }

  function toggle() {
    if (isOpen.value) close()
    else open()
  }

  return {
    offset,
    isOpen,
    isSwiping,
    open,
    close,
    toggle
  }
}
