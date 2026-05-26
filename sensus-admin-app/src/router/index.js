import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import AdminLayout from '@/layouts/AdminLayout.vue'

import DashboardView from '@/views/DashboardView.vue'
import ScenariosView from '@/views/ScenariosView.vue'
import ScenarioCreateView from '@/views/ScenarioCreateView.vue'
import SessionsView from '@/views/SessionsView.vue'
import UsersView from '@/views/UsersView.vue'
import InsightsView from '@/views/InsightsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: LoginView,
    },

    {
      path: '/register',
      component: RegisterView,
    },

    {
      path: '/',
      component: AdminLayout,
      // the admin layout and its children require authentication
      meta: { requiresAuth: true },

      children: [
        {
          path: '',
          component: DashboardView,
        },
        {
          path: 'scenarios',
          component: ScenariosView,
        },
        {
          path: 'scenarios/new',
          component: ScenarioCreateView,
        },
        {
          path: 'scenarios/:id/edit',
          component: ScenarioCreateView,
        },
        {
          path: 'sessions',
          component: SessionsView,
        },
        {
          path: 'users',
          component: UsersView,
        },
        {
          path: 'analytics',
          component: InsightsView,
        },
        {
          path: 'settings',
          component: SettingsView,
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta && record.meta.requiresAuth)
  const authStore = useAuthStore()

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router