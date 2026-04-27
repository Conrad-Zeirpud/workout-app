import { onMounted, onUnmounted, watch } from 'vue'
import Sortable from 'sortablejs'

/**
 * Attach SortableJS to a DOM element.
 * @param {Ref<HTMLElement>} elRef - the container to make sortable
 * @param {Object} options
 * @param {Function} options.onEnd - callback(newOrderIndices, oldIndex, newIndex)
 * @param {string} [options.handle] - selector for drag handle (optional)
 */
export function useSortable(elRef, options = {}) {
  let instance = null

  function init() {
    if (!elRef.value) return
    instance = Sortable.create(elRef.value, {
      animation: 180,
      delay: 150,            // long-press delay on touch
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
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
