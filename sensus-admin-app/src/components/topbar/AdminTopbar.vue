<template>
  <header class="topbar" role="banner">
    <div class="title-wrap">
      <h1 class="title">Admin Panel</h1>
    </div>

    <div class="controls">
      <div ref="notificationWrapRef" class="notification-wrap">
        <button
          class="icon-btn"
          :class="{ 'icon-btn--active': isNotificationsOpen }"
          type="button"
          aria-label="Meldingen"
          aria-haspopup="menu"
          :aria-expanded="isNotificationsOpen"
          @click="toggleNotifications"
        >
          <span class="icon-svg" role="img" aria-hidden="true" v-html="bell"></span>
          <span v-if="notificationCount > 0" class="notification-badge" aria-hidden="true">
            {{ notificationCount > 9 ? '9+' : notificationCount }}
          </span>
        </button>

        <div v-if="isNotificationsOpen" class="notifications-dropdown" role="menu" aria-label="Meldingen">
          <div class="dropdown-header">
            <div class="dropdown-title-wrap">
              <h2 class="dropdown-title">Meldingen</h2>
              <span class="dropdown-count">{{ notificationCount }}</span>
            </div>

            <button
              v-if="notificationCount > 0"
              type="button"
              class="clear-button"
              @click="handleClearAllNotifications"
            >
              Alles verwijderen
            </button>
          </div>

          <div v-if="notifications.length" class="notification-list">
            <article v-for="notification in notifications" :key="notification.id" class="notification-item" @click.stop>
              <button
                type="button"
                class="notification-remove"
                :aria-label="`Verwijder melding: ${notification.message}`"
                title="Verwijderen"
                @pointerdown.stop
                @click.stop="handleRemoveNotification(notification.id)"
              >
                ×
              </button>

              <p class="notification-message">{{ notification.message }}</p>
              <p class="notification-time">{{ formatDate(notification.created_at) }}</p>
            </article>
          </div>

          <p v-else class="notification-empty">Geen meldingen beschikbaar</p>
        </div>
      </div>

      <div ref="helpWrapRef" class="help-wrap">
        <button
          class="icon-btn"
          :class="{ 'icon-btn--active': isHelpOpen }"
          aria-label="Hulp"
          aria-haspopup="dialog"
          :aria-expanded="isHelpOpen"
          type="button"
          @click="toggleHelp"
        >
          <span class="icon-svg" role="img" aria-hidden="true" v-html="help"></span>
        </button>

        <div v-if="isHelpOpen" class="help-dropdown notifications-dropdown" role="dialog" aria-label="Hulp & informatie">
          <div class="dropdown-header">
            <div class="dropdown-title-wrap">
              <h2 class="dropdown-title">Hulp & informatie</h2>
            </div>
          </div>

          <div class="help-content">
            <section class="help-section">
              <button
                class="help-section-toggle"
                type="button"
                :aria-expanded="isAdminHelpOpen"
                @click="toggleAdminHelp"
              >
                <span class="help-section-title">Over deze admin</span>
                <img :src="helpChevronSrc" alt="" class="help-section-chevron" :class="{ 'help-section-chevron--open': isAdminHelpOpen }" />
              </button>

              <div v-show="isAdminHelpOpen" class="help-section-body">
                <p class="help-text">
                  Deze adminomgeving laat je scenario's beheren, sessies opvolgen en inzichten bekijken.
                </p>
                <p class="help-text"><strong>Scenario's:</strong> Maak nieuwe scenario's aan en bewerk bestaande scenario's.</p>
                <p class="help-text"><strong>Sessies:</strong> Bekijk alle uitgevoerde sessies.</p>
                <p class="help-text"><strong>Inzichten:</strong> Analyseer gebruiksgegevens en trends.</p>
              </div>
            </section>

            <section class="help-section">
              <button
                class="help-section-toggle"
                type="button"
                :aria-expanded="isDashboardHelpOpen"
                @click="toggleDashboardHelp"
              >
                <span class="help-section-title">Dashboard uitleg</span>
                <img :src="helpChevronSrc" alt="" class="help-section-chevron" :class="{ 'help-section-chevron--open': isDashboardHelpOpen }" />
              </button>

              <div v-show="isDashboardHelpOpen" class="help-section-body">
                <p class="help-text"><strong>Sessies deze week:</strong> Aantal sessies gestart deze week.</p>
                <p class="help-text"><strong>Actieve scenario's:</strong> Aantal beschikbare scenario's.</p>
                <p class="help-text"><strong>Gem. sessieduur:</strong> Gemiddelde duur van afgeronde sessies.</p>
                <p class="help-text"><strong>Afgeronde sessies:</strong> Percentage gebruikers dat een scenario volledig heeft afgerond.</p>
              </div>
            </section>

            <section class="help-section">
              <h3 class="help-section-title">Handige links</h3>
              <div class="help-links">
                <a class="help-link" href="https://www.sensus-app.be" target="_blank" rel="noreferrer">Marketing website</a>
              </div>
            </section>

            <section class="help-section help-section--last">
              <h3 class="help-section-title">Contact & support</h3>
              <p class="help-text">Probleem gevonden of hulp nodig?</p>
              <a class="help-contact-button" href="mailto:support@sensus-app.be">Contact opnemen</a>
            </section>
          </div>
        </div>
      </div>

      <div ref="profileWrapRef" class="profile-wrap">
        <button class="profile" type="button" @click="toggleDropdown">
          <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" class="avatar" />
          <div v-else class="avatar avatar-fallback" aria-hidden="true">
            {{ initials }}
          </div>
          <div class="meta">
            <div class="name">{{ displayName }}</div>
            <div class="role">{{ role }}</div>
          </div>
          <img :src="chevronSrc" alt="" class="chev" />
        </button>

        <div v-if="isDropdownOpen" class="dropdown">
          <button class="dropdown-item" type="button" @click="handleLogout">
            Uitloggen
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { formatDate } from '@/utils/dateFormatter'
import bellRaw from '@/assets/icons/bell.svg?raw'
import helpRaw from '@/assets/icons/help.svg?raw'
import chevDown from '@/assets/icons/chevron-down.svg'
import chevUp from '@/assets/icons/chevron-up.svg'

const bell = bellRaw.replace(/fill="[^"]*"/g, 'fill="currentColor"')
const help = helpRaw.replace(/fill="[^"]*"/g, 'fill="currentColor"')

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()
const isDropdownOpen = ref(false)
const isNotificationsOpen = ref(false)
const notificationWrapRef = ref(null)
const helpWrapRef = ref(null)
const profileWrapRef = ref(null)
const isHelpOpen = ref(false)
const isAdminHelpOpen = ref(true)
const isDashboardHelpOpen = ref(false)

const displayName = computed(() => authStore.profile?.display_name || '')
const role = computed(() => authStore.profile?.role || '')
const avatarUrl = computed(() => authStore.profile?.avatar_url || '')
const notifications = ref([])
const notificationCount = computed(() => notifications.value.length)
const chevronSrc = computed(() => (isDropdownOpen.value ? chevUp : chevDown))
const helpChevronSrc = chevDown

const initials = computed(() => {
  const name = displayName.value.trim()

  if (!name) {
    return ''
  }

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
})

function toggleDropdown() {
  isNotificationsOpen.value = false
  isDropdownOpen.value = !isDropdownOpen.value
}

function toggleNotifications() {
  isDropdownOpen.value = false
  isHelpOpen.value = false
  isNotificationsOpen.value = !isNotificationsOpen.value
}

function toggleHelp() {
  isDropdownOpen.value = false
  isNotificationsOpen.value = false
  isHelpOpen.value = !isHelpOpen.value
}

function toggleAdminHelp() {
  isAdminHelpOpen.value = !isAdminHelpOpen.value
}

function toggleDashboardHelp() {
  isDashboardHelpOpen.value = !isDashboardHelpOpen.value
}

async function handleRemoveNotification(notificationId) {
  console.log('[notifications] remove clicked', notificationId)
  notifications.value = notifications.value.filter((notification) => notification.id !== notificationId)
  await notificationsStore.removeNotification(notificationId)
}

async function handleClearAllNotifications() {
  console.log('[notifications] clear all clicked')
  const shouldClear = window.confirm('Weet je zeker dat je alle meldingen wilt verwijderen?')

  if (!shouldClear) {
    return
  }

  await notificationsStore.removeAllNotifications()
}

function handleDocumentPointerDown(event) {
  const target = event.target

  if (!(target instanceof Node)) {
    return
  }

  if (!notificationWrapRef.value?.contains(target)) {
    isNotificationsOpen.value = false
  }

  if (!helpWrapRef.value?.contains(target)) {
    isHelpOpen.value = false
  }

  if (!profileWrapRef.value?.contains(target)) {
    isDropdownOpen.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
  isDropdownOpen.value = false
  isNotificationsOpen.value = false
  await router.push('/login')
}

onMounted(() => {
  void notificationsStore.loadNotifications()
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

watch(
  () => notificationsStore.items,
  (value) => {
    notifications.value = Array.isArray(value) ? [...value].slice(0, 10) : []
  },
  { immediate: true, deep: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<style scoped>
.topbar {
  height: 72px;
  width: 100%;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5); /* 24px */
  box-sizing: border-box;
}

.title {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.2; /* 120% */
  color: var(--color-neutral-900);
  margin: 0;
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--space-4); /* 16px */
}

.notification-wrap {
  position: relative;
}

.help-wrap {
  position: relative;
}

.icon-btn {
  position: relative;
  background: transparent;
  border: none;
  padding: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--radius-pill);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.icon-btn:hover,
.icon-btn:focus-visible,
.icon-btn--active {
  background: rgba(166, 10, 126, 0.08);
}

.icon-img {
  width: 24px;
  height: 24px;
  display: block;
}

.icon-svg svg { width: 24px; height: 24px; display: block }
.icon-svg { color: var(--color-primary-600); display: inline-flex; align-items: center }

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--color-primary-600);
  color: var(--color-surface);
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.profile-wrap {
  position: relative;
}

.profile {
  appearance: none;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  cursor: pointer;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  display: inline-block;
}

.avatar-fallback {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
}

.meta {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 600;
  color: var(--color-neutral-900);
  font-size: var(--text-md);
}

.role {
  font-size: var(--text-sm);
  color: var(--color-text-soft);
}

.chev {
  width: 16px;
  height: 16px;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 8px;
  z-index: 20;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: min(380px, calc(100vw - 32px));
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 14px;
  z-index: 30;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.help-section {
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, rgba(245, 248, 250, 0.72), rgba(255, 255, 255, 0.96));
}

.help-section-toggle {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  text-align: left;
}

.help-section-chevron {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  transition: transform var(--transition-fast);
}

.help-section-chevron--open {
  transform: rotate(180deg);
}

.help-section-body {
  margin-top: 12px;
}

.help-section--last {
  margin-bottom: 2px;
}

.help-section-title {
  margin: 0 0 10px;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--color-neutral-900);
}

.help-text {
  margin: 0 0 10px;
  color: var(--color-neutral-800);
  font-size: var(--text-sm);
  line-height: 1.55;
}

.help-text:last-child {
  margin-bottom: 0;
}

.help-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.help-link,
.help-contact-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  border-radius: var(--radius-pill);
  padding: 10px 14px;
  font-size: var(--text-sm);
  font-weight: 700;
  line-height: 1;
  transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.help-link {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-neutral-900);
}

.help-link:hover,
.help-link:focus-visible {
  background: var(--color-neutral-100);
  border-color: var(--color-neutral-300);
}

.help-contact-button {
  border: 1px solid var(--color-primary-600);
  background: var(--color-primary-600);
  color: var(--color-surface);
}

.help-contact-button:hover,
.help-contact-button:focus-visible {
  background: var(--color-primary-700);
  border-color: var(--color-primary-700);
}

.dropdown-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.dropdown-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dropdown-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--color-neutral-900);
}

.dropdown-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--color-primary-100);
  color: var(--color-primary-900);
  font-size: 12px;
  font-weight: 700;
}

.clear-button {
  border: none;
  background: transparent;
  color: var(--color-text-soft);
  font-family: var(--font-family-base);
  font-size: var(--text-sm);
  font-weight: 600;
  padding: 4px 0;
  cursor: pointer;
  transition: color var(--transition-fast), opacity var(--transition-fast);
}

.clear-button:hover,
.clear-button:focus-visible {
  color: var(--color-primary-600);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.notification-item {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(245, 248, 250, 0.65), rgba(255, 255, 255, 0.95));
  pointer-events: auto;
}

.notification-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-soft);
  font-size: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  pointer-events: auto;
  transition: color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast);
}

.notification-remove:hover,
.notification-remove:focus-visible {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}

.notification-remove:active {
  transform: scale(0.96);
}

.notification-message {
  margin: 0 0 6px;
  color: var(--color-neutral-900);
  font-size: var(--text-md);
  font-weight: 600;
  line-height: 1.4;
}

.notification-time {
  margin: 0;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: 1.3;
}

.notification-empty {
  margin: 0;
  padding: 18px 4px 4px;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.dropdown-item {
  width: 100%;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  text-align: left;
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  color: var(--color-neutral-900);
  cursor: pointer;
}

.dropdown-item:hover {
  background: var(--color-neutral-100);
}

</style>