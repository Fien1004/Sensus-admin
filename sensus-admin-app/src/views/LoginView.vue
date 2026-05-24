<template>
  <main class="login-page">
    <section class="login-card" aria-labelledby="login-title">
      <img :src="logoSrc" alt="Sensus" class="logo" />

      <h1 id="login-title" class="title">Inloggen</h1>
      <p class="subtitle">Log in om de Sensus admin te beheren.</p>

      <p v-if="errorMessage" class="error-message" role="alert">
        {{ errorMessage }}
      </p>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span class="label">E-mailadres</span>
          <input
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="E-mailadres"
            class="input"
            :disabled="loading"
            required
          />
        </label>

        <label class="field">
          <span class="label">Wachtwoord</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="Wachtwoord"
            class="input"
            :disabled="loading"
            required
          />
        </label>

        <button class="submit-button" type="submit" :disabled="loading">
          {{ loading ? 'Bezig met inloggen...' : 'Inloggen' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logoSrc from '@/assets/logo/wordmark-dark.png'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (loading.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await authStore.login(email.value, password.value)

    const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirectTarget)
  } catch (error) {
    errorMessage.value = error?.message || 'Inloggen mislukt. Controleer je gegevens en probeer opnieuw.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--color-bg);
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-7);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo {
  width: 180px;
  height: auto;
  display: block;
  margin-bottom: var(--space-5);
}

.title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-2xl);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-neutral-900);
}

.subtitle {
  margin: 0 0 var(--space-5);
  color: var(--color-text-soft);
  font-size: var(--text-md);
  line-height: 1.5;
}

.error-message {
  width: 100%;
  margin: 0 0 var(--space-4);
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: 600;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label {
  font-size: var(--text-md);
  color: var(--color-neutral-900);
}

.input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-neutral-900);
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  padding: 12px 16px;
  outline: none;
}

.input::placeholder {
  color: var(--color-neutral-500);
}

.input:focus {
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px rgba(165, 10, 126, 0.12);
}

.input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.submit-button {
  margin-top: var(--space-2);
  align-self: flex-start;
  min-width: 200px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary-600);
  color: #ffffff;
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  font-weight: 700;
  padding: 14px 24px;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast);
}

.submit-button:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.submit-button:disabled {
  opacity: 0.75;
  cursor: wait;
}

.submit-button:active:not(:disabled) {
  transform: translateY(1px);
}
</style>
