<template>
  <aside class="sidebar" aria-label="Sidebar">
    <div class="logo">
      <img :src="logo" alt="Sensus" class="logo-img" />
    </div>

    <nav class="nav-wrap" aria-label="Hoofd navigatie">
      <RouterLink to="/" class="nav-item">
        <img :src="icons.dashboard" alt="Dashboard" class="icon" />
        <span class="label">Dashboard</span>
      </RouterLink>

      <RouterLink to="/scenarios" class="nav-item">
        <img :src="icons.scenarios" alt="Scenario's" class="icon" />
        <span class="label">Scenario's</span>
      </RouterLink>

      <RouterLink to="/sessions" class="nav-item">
        <img :src="icons.sessions" alt="Sessies" class="icon" />
        <span class="label">Sessies</span>
      </RouterLink>

      <RouterLink to="/analytics" class="nav-item">
        <img :src="icons.analytics" alt="Inzichten" class="icon" />
        <span class="label">Inzichten</span>
      </RouterLink>

      <RouterLink to="/settings" class="nav-item">
        <img :src="icons.settings" alt="Instellingen" class="icon" />
        <span class="label">Instellingen</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import logoSrc from '@/assets/logo/mark.png'
import dashboardIcon from '@/assets/icons/dashboard.svg'
import scenariosIcon from '@/assets/icons/apps.svg'
import sessionsIcon from '@/assets/icons/clock.svg'
import analyticsIcon from '@/assets/icons/stats.svg'
import settingsIcon from '@/assets/icons/settings.svg'

const logo = logoSrc
const icons = {
  dashboard: dashboardIcon,
  scenarios: scenariosIcon,
  sessions: sessionsIcon,
  analytics: analyticsIcon,
  settings: settingsIcon,
}
</script>

<style scoped>
.sidebar {
  width: 222px;
  min-height: 100vh;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5); /* 24px */
  padding-top: var(--space-5);
  padding-bottom: var(--space-5);
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-img {
  width: 86px;
  height: auto;
  display: block;
}

.nav-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  align-self: stretch;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 24px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--color-text);
  background: transparent;
  font-size: var(--text-lg);
  font-weight: 500;
}

.nav-item .icon {
  width: 24px;
  height: 24px;
  display: block;
}

.nav-item:hover {
  background: rgba(0,0,0,0.03);
}

.router-link-active {
  background: var(--color-primary-600) !important;
  color: #ffffff !important;
}

.router-link-active .icon {
  filter: brightness(0) invert(1);
}

</style>