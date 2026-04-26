<template>
  <div class="pb-24">
    <PageHeader title="Timer WOD" subtitle="AMRAP, EMOM, For Time, Tabata, Intervalles" />

    <div class="px-4 mt-4 space-y-3">
      <div v-for="m in modes" :key="m.id"
        @click="selectedMode = m.id"
        class="card p-4 cursor-pointer transition-all"
        :style="selectedMode === m.id ? `border:2px solid ${m.color}` : 'border:2px solid transparent'">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            :style="`background:${m.bg}`">
            {{ m.icon }}
          </div>
          <div class="flex-1">
            <p class="font-semibold text-gray-900">{{ m.name }}</p>
            <p class="text-xs text-gray-400">{{ m.description }}</p>
          </div>
          <span v-if="selectedMode === m.id" class="text-sm" :style="`color:${m.color}`">●</span>
        </div>

        <div v-if="selectedMode === m.id" class="mt-4 pt-4 border-t border-gray-100">
          <!-- AMRAP -->
          <div v-if="m.id === 'amrap'" class="space-y-3">
            <p class="text-xs text-gray-500 text-center mb-2">Durée totale</p>
            <div class="flex justify-center">
              <DurationPicker v-model="configs.amrap.totalSeconds" :step="30" />
            </div>
          </div>

          <!-- EMOM -->
          <div v-else-if="m.id === 'emom'" class="space-y-3">
            <p class="text-xs text-gray-500 text-center mb-2">Nombre de minutes</p>
            <div class="flex justify-center">
              <CountWheel v-model="configs.emom.rounds" :min="1" :max="60" suffix="× 1 min" />
            </div>
          </div>

          <!-- For Time -->
          <div v-else-if="m.id === 'fortime'" class="space-y-3">
            <p class="text-xs text-gray-500 text-center mb-2">Cap (0 = pas de cap)</p>
            <div class="flex justify-center">
              <DurationPicker v-model="configs.fortime.cap" :step="30" />
            </div>
            <p class="text-xs text-gray-400 text-center">Le chrono monte. Stop manuel à la fin.</p>
          </div>

          <!-- Tabata -->
          <div v-else-if="m.id === 'tabata'" class="space-y-4">
            <div>
              <p class="text-xs text-gray-500 text-center mb-2">Effort</p>
              <div class="flex justify-center">
                <DurationPicker v-model="configs.tabata.workSeconds" :step="5" :show-label="false" />
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 text-center mb-2">Repos</p>
              <div class="flex justify-center">
                <DurationPicker v-model="configs.tabata.restSeconds" :step="5" :show-label="false" />
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 text-center mb-2">Rounds</p>
              <div class="flex justify-center">
                <CountWheel v-model="configs.tabata.rounds" :min="1" :max="30" suffix="rounds" />
              </div>
            </div>
            <p class="text-xs text-gray-400 text-center">Standard : 0:20 / 0:10 × 8</p>
          </div>

          <!-- Interval -->
          <div v-else-if="m.id === 'interval'" class="space-y-4">
            <div>
              <p class="text-xs text-gray-500 text-center mb-2">Effort</p>
              <div class="flex justify-center">
                <DurationPicker v-model="configs.interval.workSeconds" :step="30" :show-label="false" />
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 text-center mb-2">Repos</p>
              <div class="flex justify-center">
                <DurationPicker v-model="configs.interval.restSeconds" :step="30" :show-label="false" />
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 text-center mb-2">Rounds</p>
              <div class="flex justify-center">
                <CountWheel v-model="configs.interval.rounds" :min="1" :max="60" suffix="rounds" />
              </div>
            </div>
          </div>

          <!-- Prep countdown -->
          <div class="mt-4 flex items-center justify-between">
            <label class="text-xs text-gray-500">Préparation</label>
            <CountWheel v-model="configs[m.id].prepSeconds" :min="0" :max="30" :step="5" suffix="sec" />
          </div>

          <button @click.stop="startTimer" class="btn-accent w-full mt-4 py-3 font-semibold text-base">
            ▶ Démarrer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWodTimerStore } from '@/stores/wodTimer'
import PageHeader from '@/components/ui/PageHeader.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import CountWheel from '@/components/ui/CountWheel.vue'

const router = useRouter()
const wod = useWodTimerStore()
const selectedMode = ref(null)

const modes = [
  { id: 'amrap',    name: 'AMRAP',     icon: '🔁', color: '#378ADD', bg: '#E6F1FB', description: 'Max de rounds dans le temps imparti' },
  { id: 'emom',     name: 'EMOM',      icon: '⏱️', color: '#7F77DD', bg: '#EEEDFE', description: 'Une série au début de chaque minute' },
  { id: 'fortime',  name: 'For Time',  icon: '🏁', color: '#639922', bg: '#EAF3DE', description: 'Le plus vite possible, chrono qui monte' },
  { id: 'tabata',   name: 'Tabata',    icon: '🔥', color: '#E24B4A', bg: '#FCEBEB', description: '20s effort / 10s repos × 8 rounds' },
  { id: 'interval', name: 'Intervalles', icon: '🔂', color: '#EF9F27', bg: '#FAEEDA', description: 'Effort / Repos personnalisables × N rounds' },
]

const configs = ref({
  amrap:    { totalSeconds: 12 * 60, prepSeconds: 10 },
  emom:     { rounds: 10, prepSeconds: 10 },
  fortime:  { cap: 0, prepSeconds: 10 },
  tabata:   { workSeconds: 20, restSeconds: 10, rounds: 8, prepSeconds: 10 },
  interval: { workSeconds: 40, restSeconds: 20, rounds: 10, prepSeconds: 10 },
})

function startTimer() {
  const m = selectedMode.value
  if (!m) return
  const c = configs.value[m]
  let cfg = { prepSeconds: c.prepSeconds }
  if (m === 'amrap') cfg.totalSeconds = c.totalSeconds
  if (m === 'emom') cfg.rounds = c.rounds
  if (m === 'fortime') cfg.cap = c.cap
  if (m === 'tabata') Object.assign(cfg, { workSeconds: c.workSeconds, restSeconds: c.restSeconds, rounds: c.rounds })
  if (m === 'interval') Object.assign(cfg, { workSeconds: c.workSeconds, restSeconds: c.restSeconds, rounds: c.rounds })

  wod.start(m, cfg)
  router.push('/timer/run')
}
</script>
