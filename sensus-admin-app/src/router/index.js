import { createRouter, createWebHistory } from 'vue-router'

import AdminLayout from '@/layouts/AdminLayout.vue'

import DashboardView from '@/views/DashboardView.vue'
import ScenariosView from '@/views/ScenariosView.vue'
import UsersView from '@/views/UsersView.vue'
import AnalyticsView from '@/views/AnalyticsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: LoginView,
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
          path: 'users',
          component: UsersView,
        },
        {
          path: 'analytics',
          component: AnalyticsView,
        },
        {
          path: 'settings',
          component: SettingsView,
        },
      ],
    },
  ],
})

// Global auth guard (placeholder)
// TODO: Replace the placeholder check with a real Supabase auth check when ready.
router.beforeEach((to, from, next) => {
  // Determine if the target route (or any parent) requires auth
  const requiresAuth = to.matched.some((record) => record.meta && record.meta.requiresAuth)

  // Temporary placeholder - always `true` for now. Swap this out for real auth state.
  const isAuthenticated = true

  if (requiresAuth && !isAuthenticated) {
    // Not authenticated — redirect to login. Keep attempted path in query for later.
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // Otherwise allow navigation
  next()
})

export default router