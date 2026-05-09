import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/auth', name: 'auth', component: () => import('@/views/AuthView.vue') },
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/planning', name: 'planning', component: () => import('@/views/PlanningView.vue') },
  { path: '/workouts', name: 'workouts', component: () => import('@/views/WorkoutsView.vue') },
  { path: '/workouts/new', name: 'workout-new', component: () => import('@/views/WorkoutBuilderView.vue') },
  { path: '/workouts/edit/:id', name: 'workout-edit', component: () => import('@/views/WorkoutBuilderView.vue') },
  { path: '/programs', name: 'programs', component: () => import('@/views/ProgramsView.vue') },
  { path: '/session/:workoutId', name: 'session', component: () => import('@/views/SessionView.vue') },
  { path: '/session-summary', name: 'session-summary', component: () => import('@/views/SessionSummaryView.vue') },
  { path: '/timer', name: 'timer', component: () => import('@/views/TimerView.vue') },
  { path: '/timer/run', name: 'timer-run', component: () => import('@/views/TimerRunnerView.vue') },
  { path: '/history', name: 'history', component: () => import('@/views/HistoryView.vue') },
  { path: '/exercises', name: 'exercises', component: () => import('@/views/ExercisesView.vue') },
  { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
  // Admin
  { path: '/admin/videos', name: 'admin-videos', component: () => import('@/views/AdminVideosView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) await auth.init()
  if (to.name !== 'auth' && !auth.user) return { name: 'auth' }
  if (to.name === 'auth' && auth.user) return { name: 'dashboard' }
})

export default router
