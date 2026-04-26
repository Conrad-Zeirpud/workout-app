import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/auth', name: 'auth', component: () => import('@/views/AuthView.vue'), meta: { public: true } },
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/planning', name: 'planning', component: () => import('@/views/PlanningView.vue') },
  { path: '/workouts', name: 'workouts', component: () => import('@/views/WorkoutsView.vue') },
  { path: '/workouts/new', name: 'workout-new', component: () => import('@/views/WorkoutBuilderView.vue') },
  { path: '/workouts/:id/edit', name: 'workout-edit', component: () => import('@/views/WorkoutBuilderView.vue') },
  { path: '/session/:workoutId', name: 'session', component: () => import('@/views/SessionView.vue') },
  { path: '/session-summary', name: 'session-summary', component: () => import('@/views/SessionSummaryView.vue') },
  { path: '/timer', name: 'timer', component: () => import('@/views/TimerView.vue') },
  { path: '/timer/run', name: 'timer-run', component: () => import('@/views/TimerRunnerView.vue') },
  { path: '/history', name: 'history', component: () => import('@/views/HistoryView.vue') },
  { path: '/exercises', name: 'exercises', component: () => import('@/views/ExercisesView.vue') },
  { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  if (!to.meta.public && !auth.user) return { name: 'auth' }
  if (to.name === 'auth' && auth.user) return { name: 'dashboard' }
})

export default router
