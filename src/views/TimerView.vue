<template>
  <div class="pb-24">
    <PageHeader title="Timer WOD" subtitle="AMRAP, EMOM, For Time, Tabata, Intervalles" back />

    <div class="px-4 mt-4 space-y-3">
      <div v-for="m in modes" :key="m.id"
        @click="selectedMode = m.id"
        class="card p-4 cursor-pointer transition-all"
        :class="selectedMode === m.id ? 'ring-2' : 'hover:bg-gray-50'"
        :style="selectedMode === m.id ? `--tw-ring-color:${m.color}` : ''">
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

        <!-- Config form inline -->
        <div v-if="selectedMode === m.id" class="mt-4 pt-4 border-t border-gray-100">
          <!-- AMRAP -->
          <div v-if="m.id === 'amrap'" class="space-y-3">
            <div class="flex items-center gap-3">
              <label class="text-xs text-gray-500 w-24">Durée totale</label>
              <input v-model.number="configs.amrap.minutes" type="number" min="1" max="60"
                class="input flex-1 text-center" />
              <span class="text-xs text-gray-400">min</span>
            </div>
          </div>

          <!-- EMOM -->
          <div v-else-if="m.id === 'emom'" class="space-y-3">
            <div class="flex items-center gap-3">
              <label class="text-xs text-gray-500 w-24">Minutes</label>
              <input v-model.number="configs.emom.rounds" type="number" min="1" max="60"
                class="input flex-1 text-center" />
              <span class="text-xs text-gray-400">×1min</span>
            </div>
          </div>

          <!-- For Time -->
          <div v-else-if="m.id === 'fortime'" class="space-y-3">
            <div class="flex items-center gap-3">
              <label class="text-xs text-gray-500 w-24">Cap (optionnel)</label>
              <input v-model.number="configs.fortime.capMinutes" type="number" min="0" max="120"
                placeholder="0 = pas de cap"
                class="input flex-1 text-center" />
              <span class="text-xs text-gray-400">min</span>
            </div>
            <p class="text-xs text-gray-400">Le chrono monte. Stop manuel à la fin.</p>
          </div>

          <!-- Tabata -->
          <div v-else-if="m.id === 'tabata'" class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs text-gray-400 mb-1">Effort</label>
                <input v-model.number="configs.tabata.workSeconds" type="number" min="5" max="120"
                  class="input text-center py-1.5" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">Repos</label>
                <input v-model.number="configs.tabata.restSeconds" type="number" min="5" max="120"
                  class="input text-center py-1.5" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">Rounds</label>
                <input v-model.number="configs.tabata.rounds" type="number" min="1" max="30"
                  class="input text-center py-1.5" />
              </div>
            </div>
            <p class="text-xs text-gray-400">Standard : 20s / 10s × 8 rounds</p>
          </div>

          <!-- Interval -->
          <div v-else-if="m.id === 'interval'" class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs text-gray-400 mb-1">Effort (s)</label>
                <input v-model.number="configs.interval.workSeconds" type="number" min="5" max="600"
                  class="input text-center py-1.5" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">Repos (s)</label>
                <input v-model.number="configs.interval.restSeconds" type="number" min="0" max="600"
                  class="input text-center py-1.5" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">Rounds</label>
                <input v-model.number="configs.interval.rounds" type="number" min="1" max="60"
                  class="input text-center py-1.5" />
              </div>
            </div>
          </div>

          <!-- Prep countdown (common) -->
          <div class="mt-3 flex items-center gap-3">
            <label class="text-xs text-gray-500 w-24">Préparation</label>
            <input v-model.number="configs[m.id].prepSeconds" type="number" min="0" max="60"
              class="input flex-1 text-center" />
            <span class="text-xs text-gray-400">sec</span>
          </div>

          <button @click.stop="startTimer" class="btn-accent w-full mt-4 py-3 font-semibold">
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

const router = useRouter()
const wod = useWodTimerStore()

const selectedMode = ref(null)

const modes = [
  { id: 'amrap',    name: 'AMRAP',     icon: '🔁', color: '#378ADD', bg: '#E6F1FB', description: 'As Many Rounds As Possible — fais un max de rounds dans le temps imparti' },
  { id: 'emom',     name: 'EMOM',      icon: '⏱️', color: '#7F77DD', bg: '#EEEDFE', description: 'Every Minute On the Minute — une série au début de chaque minute' },
  { id: 'fortime',  name: 'For Time',  icon: '🏁', color: '#639922', bg: '#EAF3DE', description: 'Enchaîne le WOD le plus vite possible, chrono qui monte' },
  { id: 'tabata',   name: 'Tabata',    icon: '🔥', color: '#E24B4A', bg: '#FCEBEB', description: '20s effort / 10s repos × 8 rounds (modifiable)' },
  { id: 'interval', name: 'Intervalles', icon: '🔂', color: '#EF9F27', bg: '#FAEEDA', description: 'Effort / Repos personnalisables × N rounds' },
]

const configs = ref({
  amrap:    { minutes: 12, prepSeconds: 10 },
  emom:     { rounds: 10, prepSeconds: 10 },
  fortime:  { capMinutes: 0, prepSeconds: 10 },
  tabata:   { workSeconds: 20, restSeconds: 10, rounds: 8, prepSeconds: 10 },
  interval: { workSeconds: 40, restSeconds: 20, rounds: 10, prepSeconds: 10 },
})

function startTimer() {
  const m = selectedMode.value
  if (!m) return
  const c = configs.value[m]
  let cfg = { prepSeconds: c.prepSeconds }
  if (m === 'amrap') cfg.totalSeconds = c.minutes * 60
  if (m === 'emom') cfg.rounds = c.rounds
  if (m === 'fortime') cfg.cap = c.capMinutes * 60
  if (m === 'tabata') Object.assign(cfg, { workSeconds: c.workSeconds, restSeconds: c.restSeconds, rounds: c.rounds })
  if (m === 'interval') Object.assign(cfg, { workSeconds: c.workSeconds, restSeconds: c.restSeconds, rounds: c.rounds })

  wod.start(m, cfg)
  router.push('/timer/run')
}
</script>

<style scoped>
.ring-2 { border-width: 2px; border-style: solid; }
</style>
