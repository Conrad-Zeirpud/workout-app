import { onMounted, onUnmounted, watch } from 'vue'
import Sortable from 'sortablejs'

/**
 * Attach SortableJS to a DOM element.
 * @param {Ref<HTMLElement>} elRef - the container to make sortable
 * @param {Object} options
 * @param {Function} options.onEnd - callback(oldIndex, newIndex)
 * @param {string} [options.handle] - selector for drag handle (e.g. '.drag-handle')
 *
 * Configuration mobile-friendly :
 * - Avec handle dédié : drag instantané sur le handle, scroll libre ailleurs
 * - Sans handle : long-press de 200ms pour distinguer du scroll
 * - forceFallback: false pour utiliser le HTML5 native qui respecte les CSS touch-action
 */
export function useSortable(elRef, options = {}) {
  let instance = null

  function init() {
    if (!elRef.value) return
    const hasHandle = !!options.handle
    instance = Sortable.create(elRef.value, {
      animation: 180,
      delay: hasHandle ? 0 : 200,
      delayOnTouchOnly: true,
      touchStartThreshold: hasHandle ? 0 : 5,
      forceFallback: false,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      handle: options.handle,
      filter: 'input,select,textarea,button',
      preventOnFilter: false,
      onEnd: (evt) => {
        if (evt.oldIndex !== evt.newIndex) {
          options.onEnd?.(evt.oldIndex, evt.newIndex)
        }
      }
    })
  }

  function destroy() {
    if (instance) { instance.destroy(); instance = null }
  }

  onMounted(init)
  onUnmounted(destroy)

  watch(elRef, (el) => {
    if (el && !instance) init()
    else if (!el && instance) destroy()
  })

  return { destroy }
}
