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

      <div class="profile">
        <img :src="avatarImg" alt="Philip Davids" class="avatar" />
        <div class="meta">
          <div class="name">Philip Davids</div>
          <div class="role">Admin</div>
        </div>
        <img :src="chev" alt="" class="chev" />
      </div>
    </div>
  </header>
</template>

<script setup>
import bellRaw from '@/assets/icons/bell.svg?raw'
import helpRaw from '@/assets/icons/help.svg?raw'
import chev from '@/assets/icons/chevron-down.svg'
import avatarImg from '@/assets/pics/Ellipse 4.png'

const bell = bellRaw.replace(/fill="[^"]*"/g, 'fill="currentColor"')
const help = helpRaw.replace(/fill="[^"]*"/g, 'fill="currentColor"')
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

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  display: inline-block;
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

</style>