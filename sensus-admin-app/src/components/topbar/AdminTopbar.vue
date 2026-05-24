<template>
  <header class="topbar" role="banner">
    <div class="title-wrap">
      <h1 class="title">Admin Panel</h1>
    </div>

    <div class="controls">
      <button class="icon-btn" aria-label="Notifications">
        <span class="icon-svg" role="img" aria-hidden v-html="bell"></span>
      </button>

      <button class="icon-btn" aria-label="Help">
        <span class="icon-svg" role="img" aria-hidden v-html="help"></span>
      </button>

      <div class="profile-wrap">
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import bellRaw from '@/assets/icons/bell.svg?raw'
import helpRaw from '@/assets/icons/help.svg?raw'
import chevDown from '@/assets/icons/chevron-down.svg'
import chevUp from '@/assets/icons/chevron-up.svg'

const bell = bellRaw.replace(/fill="[^"]*"/g, 'fill="currentColor"')
const help = helpRaw.replace(/fill="[^"]*"/g, 'fill="currentColor"')

const authStore = useAuthStore()
const router = useRouter()
const isDropdownOpen = ref(false)

const displayName = computed(() => authStore.profile?.display_name || '')
const role = computed(() => authStore.profile?.role || '')
const avatarUrl = computed(() => authStore.profile?.avatar_url || '')
const chevronSrc = computed(() => (isDropdownOpen.value ? chevUp : chevDown))

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
  isDropdownOpen.value = !isDropdownOpen.value
}

async function handleLogout() {
  await authStore.logout()
  isDropdownOpen.value = false
  await router.push('/login')
}
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

.icon-btn {
  background: transparent;
  border: none;
  padding: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-img {
  width: 24px;
  height: 24px;
  display: block;
}

.icon-svg svg { width: 24px; height: 24px; display: block }
.icon-svg { color: var(--color-primary-600); display: inline-flex; align-items:center }

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