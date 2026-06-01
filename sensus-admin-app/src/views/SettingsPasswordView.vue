<template>
  <main class="settings-view">
    <section class="settings-card">
      <div class="card-header">
        <div class="titles">
          <h1 class="page-title">Wachtwoord wijzigen</h1>
          <p class="subtitle">Pas je wachtwoord aan</p>
        </div>

        <button type="button" class="save-button" @click="onSave" :disabled="saving || loading">
          <svg class="save-img" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M11 5H7V1C7 0.734784 6.89464 0.48043 6.70711 0.292893C6.51957 0.105357 6.26522 0 6 0C5.73478 0 5.48043 0.105357 5.29289 0.292893C5.10536 0.48043 5 0.734784 5 1V5H1C0.734784 5 0.48043 5.10536 0.292893 5.29289C0.105357 5.48043 0 5.73478 0 6C0 6.26522 0.105357 6.51957 0.292893 6.70711C0.48043 6.89464 0.734784 7 1 7H5V11C5 11.2652 5.10536 11.5196 5.29289 11.7071C5.48043 11.8946 5.73478 12 6 12C6.26522 12 6.51957 11.8946 6.70711 11.7071C6.89464 11.5196 7 11.2652 7 11V7H11C11.2652 7 11.5196 6.89464 11.7071 6.70711C11.8946 6.51957 12 6.26522 12 6C12 5.73478 11.8946 5.48043 11.7071 5.29289C11.5196 5.10536 11.2652 5 11 5Z"
              fill="currentColor"
            />
          </svg>
          <span>Opslaan</span>
        </button>
      </div>

      <div class="card-body">
        <div v-if="loading" class="state-message">Gegevens laden...</div>

        <form v-else class="settings-form" @submit.prevent="onSave">
          <div class="form-left">
            <div class="form-column">
              <div class="form-fields">
                <div class="field">
                  <label class="label">Nieuw wachtwoord</label>
                  <input v-model="form.newPassword" type="password" class="input" autocomplete="new-password" />
                </div>

                <div class="field">
                  <label class="label">Bevestig nieuw wachtwoord</label>
                  <input v-model="form.confirmPassword" type="password" class="input" autocomplete="new-password" />
                </div>

                <RouterLink class="back-button" to="/settings">Terug naar instellingen</RouterLink>
              </div>
            </div>
          </div>

          <div class="form-right"><!-- keep whitespace to the right per Figma --></div>
        </form>

        <div v-if="errorMessage && !loading" class="state-message state-error">{{ errorMessage }}</div>
        <div v-if="successMessage && !loading" class="toast">{{ successMessage }}</div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { supabase } from '@/services/supabase'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  newPassword: '',
  confirmPassword: '',
})

async function onSave() {
  if (saving.value || loading.value) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    validatePasswordChange()
    const { error } = await supabase.auth.updateUser({
      password: form.newPassword,
    })

    if (error) throw error

    form.newPassword = ''
    form.confirmPassword = ''

    successMessage.value = 'Wachtwoord aangepast.'
    setTimeout(() => (successMessage.value = ''), 2500)
  } catch (error) {
    console.error('Saving password failed:', error)
    errorMessage.value = error?.message || 'Wachtwoord aanpassen mislukt. Probeer opnieuw.'
  } finally {
    saving.value = false
  }
}

function validatePasswordChange() {
  if (!form.newPassword || !form.confirmPassword) {
    throw new Error('Vul beide wachtwoordvelden in.')
  }

  if (form.newPassword.length < 8) {
    throw new Error('Nieuw wachtwoord moet minstens 8 tekens zijn.')
  }

  if (form.newPassword !== form.confirmPassword) {
    throw new Error('Nieuw wachtwoord en bevestiging moeten gelijk zijn.')
  }
}
</script>

<style scoped>
/* Container */
.settings-view { padding: var(--space-5) }

.settings-card {
  width: 100%;
  min-height: 680px;
  background: var(--color-surface);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

/* Header */
.card-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; position:relative }
.titles { display:flex; flex-direction:column }
.page-title { margin:0; font-size:28px; font-weight:700 }
.subtitle { margin:6px 0 0 0; color:var(--color-text-soft); font-size:14px }

/* Save button (top-right inside card) */
.save-button {
  display:inline-flex;
  align-items:center;
  gap:10px;
  height:48px;
  padding:0 24px;
  border-radius:12px;
  background: var(--color-secondary-600);
  color: #fff;
  border: none;
  font-weight:700;
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--text-md);
}
.save-button:disabled { opacity:0.6; cursor:default }
.save-img { width:16px; height:16px }

/* Body layout */
.card-body { margin-top:18px }
.settings-form { display:flex; gap:32px }
.form-left { width:340px }
.form-column { display:flex; flex-direction:column; gap:16px }
.form-right { flex:1 }

/* Form fields */
.form-fields { display:flex; flex-direction:column; gap:12px }
.field { display:flex; flex-direction:column; gap:8px }
.label { font-size:14px; color:var(--color-text-soft); margin-bottom:6px }
.input {
  width: 320px;
  height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  color: var(--color-text);
}

.back-button {
  width: 320px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  font-weight: 700;
  text-decoration: none;
}

/* Toast */
.toast { margin-top:18px; display:inline-block; background: #e6fff0; border:1px solid rgba(33,222,74,0.12); color: var(--color-success); padding:8px 12px; border-radius:8px; font-weight:600 }

/* Loading / error state */
.state-message {
  width: 320px;
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-soft);
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.state-error {
  color: var(--color-danger);
  border-color: rgba(255, 0, 0, 0.2);
  background: rgba(255, 0, 0, 0.04);
}

/* Remove default button appearance globally inside this component */
button { appearance: none; -webkit-appearance: none; -moz-appearance: none }

@media (min-width: 1000px) {
  .settings-card { max-width: 1160px }
}
</style>
