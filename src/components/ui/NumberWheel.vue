<template>
  <div class="relative select-none" :style="`height:${itemHeight * visibleCount}px;width:${width}px`">
    <!-- Center indicator -->
    <div class="absolute left-0 right-0 pointer-events-none border-y border-gray-200"
      :style="`top:${itemHeight * Math.floor(visibleCount/2)}px;height:${itemHeight}px;background:rgba(99,153,34,0.06)`" />

    <!-- Top fade -->
    <div class="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
      style="background:linear-gradient(to bottom,#fff,rgba(255,255,255,0))" />
    <!-- Bottom fade -->
    <div class="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10"
      style="background:linear-gradient(to top,#fff,rgba(255,255,255,0))" />

    <!-- Scroll container -->
    <div ref="scroller"
      class="absolute inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-none"
      @scroll="onScroll">
      <div :style="`padding-top:${itemHeight * Math.floor(visibleCount/2)}px;padding-bottom:${itemHeight * Math.floor(visibleCount/2)}px`">
        <div v-for="(opt, i) in options" :key="opt"
          class="flex items-center justify-center snap-center transition-all"
          :style="itemStyle(i)">
          <span class="font-semibold tabular-nums">{{ opt }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  // Either pass options directly OR pass min/max/step
  options: { type: Array, default: null },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 60 },
  step: { type: Number, default: 1 },
  width: { type: Number, default: 70 },
  itemHeight: { type: Number, default: 36 },
  visibleCount: { type: Number, default: 5 },
})
const emit = defineEmits(['update:modelValue'])

const scroller = ref(null)
const currentIndex = ref(0)
let scrollTimeout = null

const options = computed(() => {
  if (props.options) return props.options
  const arr = []
  for (let v = props.min; v <= props.max; v += props.step) arr.push(v)
  return arr
})

function itemStyle(i) {
  const distance = Math.abs(i - currentIndex.value)
  const opacity = Math.max(0.25, 1 - distance * 0.3)
  const scale = Math.max(0.7, 1 - distance * 0.12)
  return {
    height: `${props.itemHeight}px`,
    opacity,
    transform: `scale(${scale})`,
    fontSize: distance === 0 ? '1.4rem' : '1.1rem',
    color: distance === 0 ? '#1a1a2e' : '#888',
  }
}

function onScroll() {
  if (!scroller.value) return
  const idx = Math.round(scroller.value.scrollTop / props.itemHeight)
  if (idx !== currentIndex.value && idx >= 0 && idx < options.value.length) {
    currentIndex.value = idx
  }
  // Snap-to-value after scroll stops
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    emit('update:modelValue', options.value[currentIndex.value])
  }, 120)
}

function setIndexFromValue(val) {
  const idx = options.value.indexOf(val)
  if (idx >= 0) {
    currentIndex.value = idx
    nextTick(() => {
      if (scroller.value) {
        scroller.value.scrollTop = idx * props.itemHeight
      }
    })
  }
}

onMounted(() => setIndexFromValue(props.modelValue))
watch(() => props.modelValue, setIndexFromValue)
watch(() => options.value, () => setIndexFromValue(props.modelValue), { deep: true })
</script>

<style scoped>
.scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
