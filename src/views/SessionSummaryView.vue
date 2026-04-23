<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Hero -->
    <div class="px-5 pt-16 pb-8 text-center" style="background:var(--brand)">
      <div class="text-6xl mb-4">🏆</div>
      <h1 class="text-white text-2xl font-bold">Séance terminée !</h1>
      <p class="text-white/60 text-sm mt-1">{{ workoutName }}</p>
    </div>

    <div class="px-4 -mt-4 space-y-4 pb-10">
      <!-- Key stats -->
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-3 text-center">
          <div class="text-2xl font-bold text-gray-900">{{ formatDuration(duration) }}</div>
          <div class="text-xs text-gray-400 mt-0.5">durée</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-2xl font-bold text-gray-900">{{ setsCount }}</div>
          <div class="text-xs text-gray-400 mt-0.5">séries</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-2xl font-bold" :class="prCount > 0 ? 'text-yellow-500' : 'text-gray-900'">{{ prCount }}</div>
          <div class="text-xs text-gray-400 mt-0.5">PR 🏆</div>
        </div>
      </div>

      <!-- Volume total -->
      <div class="card p-4">
        <p class="text-xs text-gray-400 mb-1">Volume total soulevé</p>
        <p class="text-3xl font-bold text-gray-900">{{ totalVolume }} <span class="text-base font-normal text-gray-400">{{ unit }}</span></p>
      </div>

      <!-- PRs -->
      <div v-if="prs.length > 0" class="card p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">🏆 Nouveaux records !</h2>
        <div class="space-y-2">
          <div v-for="pr in prs" :key="pr.exercise_id" class="flex items-center gap-3">
            <PRBadge />
            <div>
              <p class="text-sm font-medium text-gray-900">{{ pr.exercise?.name }}</p>
              <p class="text-xs text-gray-400">{{ pr.weight_kg }}{{ unit }} × {{ pr.reps_done }} reps</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Séries par exercice -->
      <div class="card p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Détail des exercices</h2>
        <div class="space-y-3">
          <div v-for="ex in exerciseSummary" :key="ex.name">
            <div class="flex justify-between items-baseline mb-1">
              <p class="text-sm font-medium text-gray-900">{{ ex.name }}</p>
              <p class="text-xs text-gray-400">{{ ex.sets }} séries</p>
            </div>
            <div class="flex flex-wrap gap-1">
              <span v-for="(s, i) in ex.sets_detail" :key="i"
                class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {{ s.reps_done }}×{{ s.weight_kg }}{{ unit }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes rapides -->
      <div class="card p-4">
        <label class="block text-xs font-medium text-gray-500 mb-2">Notes sur la séance</label>
        <textarea v-model="notes" rows="3" placeholder="Comment tu te sens ? Points à améliorer…"
          class="input resize-none text-sm" />
        <button @click="saveNotes" class="mt-2 text-xs text-brand font-medium">Enregistrer les notes</button>
      </div>

      <router-link to="/" class="btn-primary w-full text-center block py-4">Retour à l'accueil</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStatsStore } from '@/stores/stats'
import { useSettings } from '@/composables/useSettings'
import { useWorkoutUtils } from '@/composables/useWorkoutUtils'
import PRBadge from '@/components/ui/PRBadge.vue'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const statsStore = useStatsStore()
const { settings } = useSettings()
const { formatDuration } = useWorkoutUtils()

// Props passed via router state
const state = history.state || {}
const duration = ref(state.duration || 0)
const workoutName = ref(state.workoutName || 'Séance')
const completedSets = ref(state.completedSets || [])
const sessionId = ref(state.sessionId || null)
const notes = ref('')

const unit = computed(() => settings.unit)

const setsCount = computed(() => completedSets.value.length)
const prs = computed(() => completedSets.value.filter(s => s.pr))
const prCount = computed(() => prs.value.length)
const totalVolume = computed(() =>
  Math.round(completedSets.value.reduce((acc, s) => acc + (s.weight_kg || 0) * (s.reps_done || 0), 0))
)

const exerciseSummary = computed(() => {
  const map = {}
  completedSets.value.forEach(s => {
    const name = s.exercise?.name || 'Exercice'
    if (!map[name]) map[name] = { name, sets: 0, sets_detail: [] }
    map[name].sets++
    map[name].sets_detail.push(s)
  })
  return Object.values(map)
})

async function saveNotes() {
  if (!sessionId.value || !notes.value.trim()) return
  await supabase.from('sessions').update({ notes: notes.value }).eq('id', sessionId.value)
}
</script>
