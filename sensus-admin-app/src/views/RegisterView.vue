<template>
  <main class="register-page">
    <section class="register-card" aria-labelledby="register-title">
      <img :src="logoSrc" alt="Sensus" class="logo" />

      <h1 id="register-title" class="title">Registreren</h1>
      <p class="subtitle">Maak een admin account aan voor de Sensus admin.</p>

      <p v-if="errorMessage" class="error-message" role="alert">
        {{ errorMessage }}
      </p>

      <p v-if="successMessage" class="success-message" role="status">
        {{ successMessage }}
      </p>

      <form class="register-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span class="label">Display name</span>
          <input
            v-model="displayName"
            type="text"
            name="displayName"
            autocomplete="name"
            placeholder="Display name"
            class="input"
            :disabled="loading"
            required
          />
        </label>

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
            autocomplete="new-password"
            placeholder="Wachtwoord"
            class="input"
            :disabled="loading"
            required
          />
        </label>

        <label class="field">
          <span class="label">Bevestig wachtwoord</span>
          <input
            v-model="confirmPassword"
            type="password"
            name="confirmPassword"
            autocomplete="new-password"
            placeholder="Bevestig wachtwoord"
            class="input"
            :disabled="loading"
            required
          />
        </label>

        <button class="submit-button" type="submit" :disabled="loading">
          {{ loading ? 'Bezig met registreren...' : 'Registreren' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import logoSrc from '@/assets/logo/wordmark-dark.png'

const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit() {
  if (loading.value) return

  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Wachtwoorden komen niet overeen.'
    return
  }

  loading.value = true

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (error) throw error

    const userId = data.user?.id

    if (!userId) {
      throw new Error('Gebruiker kon niet worden aangemaakt.')
    }

    const { error: profileError } = await supabase.from('admin_profiles').insert({
      user_id: userId,
      display_name: displayName.value,
      role: 'admin',
      avatar_url: null,
    })

    if (profileError) throw profileError

    successMessage.value = 'Registratie gelukt. Je wordt doorgestuurd naar de loginpagina.'
    await router.push('/login')
  } catch (error) {
    errorMessage.value = error?.message || 'Registratie mislukt. Probeer het opnieuw.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--color-bg);
  box-sizing: border-box;
}

.register-card {
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

.success-message {
  width: 100%;
  margin: 0 0 var(--space-4);
  color: var(--color-success);
  font-size: var(--text-sm);
  font-weight: 600;
}

.register-form {
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