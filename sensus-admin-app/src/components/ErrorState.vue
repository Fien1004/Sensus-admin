<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import WarningIcon from '@/assets/icons/warning.svg'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'api',
  },
  showRetry: {
    type: Boolean,
    default: true,
  },
})

const router = useRouter()

const fallbackContent = {
  offline: {
    title: 'Geen verbinding',
    message: 'Controleer je internetverbinding en probeer opnieuw.',
  },
  api: {
    title: 'Er ging iets mis',
    message: 'De data kon niet geladen worden. Probeer opnieuw.',
  },
}

const resolvedContent = computed(() => {
  const fallback = fallbackContent[props.type] || fallbackContent.api

  return {
    title: props.title || fallback.title,
    message: props.message || fallback.message,
  }
})

function retry() {
  window.location.reload()
}

function goToDashboard() {
  void router.push('/dashboard')
}
</script>

<template>
  <section class="error-state" :class="`error-state--${type}`" aria-live="assertive">
    <div class="error-state__panel">
      <span class="error-state__icon-wrap" aria-hidden="true">
        <img class="error-state__icon" :src="WarningIcon" alt="" />
      </span>

      <div class="error-state__copy">
        <h1 class="error-state__title">{{ resolvedContent.title }}</h1>
        <p class="error-state__message">{{ resolvedContent.message }}</p>
      </div>

      <div class="error-state__actions">
        <button v-if="showRetry" type="button" class="error-state__button error-state__button--primary" @click="retry">
          Opnieuw proberen
        </button>
        <button type="button" class="error-state__button error-state__button--secondary" @click="goToDashboard">
          Terug naar dashboard
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.error-state {
  min-height: min(560px, calc(100vh - 160px));
  display: grid;
  place-items: center;
  padding: var(--space-6);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.48)),
    #f7f4f2;
}

.error-state__panel {
  width: min(100%, 520px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-7);
  text-align: center;
  background: var(--color-surface);
  border: 1px solid rgba(84, 2, 62, 0.1);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.error-state__icon-wrap {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  color: var(--color-primary-800);
  background: var(--color-primary-100);
  border-radius: 50%;
}

.error-state__icon {
  width: 24px;
  height: 24px;
  opacity: 0.82;
}

.error-state__copy {
  display: grid;
  gap: var(--space-3);
}

.error-state__title {
  margin: 0;
  color: var(--color-neutral-900);
  font-size: var(--text-xl);
  font-weight: 700;
  line-height: 1.25;
}

.error-state__message {
  max-width: 360px;
  margin: 0;
  color: var(--color-text-soft);
  font-size: var(--text-md);
  line-height: 1.6;
}

.error-state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}

.error-state__button {
  min-height: 44px;
  padding: 0 var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 700;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.error-state__button--primary {
  color: #fff;
  background: var(--color-primary-800);
}

.error-state__button--primary:hover {
  background: var(--color-primary-900);
}

.error-state__button--secondary {
  color: var(--color-primary-800);
  background: #fff;
  border-color: rgba(84, 2, 62, 0.18);
}

.error-state__button--secondary:hover {
  background: var(--color-primary-100);
  border-color: rgba(84, 2, 62, 0.28);
}

@media (max-width: 640px) {
  .error-state {
    padding: var(--space-4);
  }

  .error-state__panel {
    padding: var(--space-6) var(--space-4);
  }

  .error-state__actions {
    width: 100%;
    flex-direction: column;
  }
}
</style>
