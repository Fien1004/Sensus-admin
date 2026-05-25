<template>
  <main class="settings-view">
    <section class="settings-card">
      <div class="card-header">
        <div class="titles">
          <h1 class="page-title">Instellingen</h1>
          <p class="subtitle">Pas je gegevens aan</p>
        </div>

        <button type="button" class="save-button" @click="onSave" :disabled="saving">
          <img :src="PlusIcon" alt="plus" class="save-img" />
          <span>Opslaan</span>
        </button>
      </div>

      <div class="card-body">
        <form class="settings-form" @submit.prevent="onSave">
          <div class="form-left">
            <div class="form-column">
              <label class="label">Profielfoto</label>

              <div class="avatar-area">
                <input ref="fileInput" type="file" accept="image/*" class="visually-hidden" @change="onFileChange" />

                <div class="avatar-outer">
                  <div class="avatar-inner">
                    <img v-if="form.avatarUrl" :src="form.avatarUrl" alt="Profielfoto" />
                    <div v-else class="initials">{{ initials }}</div>
                  </div>

                  <button type="button" class="avatar-edit" @click.prevent="triggerFileInput" aria-label="Wijzig profielfoto">
                    <img :src="PenIcon" alt="edit" />
                  </button>
                </div>

              </div>

              <div class="form-fields">
                <div class="field">
                  <label class="label">Naam</label>
                  <input v-model="form.firstName" type="text" class="input" />
                </div>

                <div class="field">
                  <label class="label">Achternaam</label>
                  <input v-model="form.lastName" type="text" class="input" />
                </div>

                <div class="field">
                  <label class="label">Jobfunctie</label>
                  <input v-model="form.jobTitle" type="text" class="input" />
                </div>

                <div class="field">
                  <label class="label">E-mailadres</label>
                  <input v-model="form.email" type="email" class="input" />
                </div>

                <div class="field password-field">
                  <label class="label">Wachtwoord</label>
                  <div class="password-wrap">
                    <input :type="showPassword ? 'text' : 'password'" v-model="form.password" class="input password-input" />
                    <button type="button" class="eye-button" @click="togglePassword" :aria-pressed="showPassword">
                      <img v-if="!showPassword" :src="EyeIcon" alt="toon" />
                      <img v-else :src="EyeCrossedIcon" alt="verberg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-right"><!-- keep whitespace to the right per Figma --></div>
        </form>

        <div v-if="successMessage" class="toast">{{ successMessage }}</div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PlusIcon from '@/assets/icons/plus.svg'
import PenIcon from '@/assets/icons/pen.svg'
import EyeIcon from '@/assets/icons/eye.svg'
import EyeCrossedIcon from '@/assets/icons/eye-crossed.svg'

const saving = ref(false)
const successMessage = ref('')
const showPassword = ref(false)
const fileInput = ref(null)

const form = reactive({
  firstName: 'Philip',
  lastName: 'Davids',
  jobTitle: 'Admin',
  email: 'philip.davids@sensus.be',
  password: 'password123',
  avatarUrl: '',
  avatarFile: null,
})

const initials = computed(() => {
  const a = form.firstName?.trim()?.[0] ?? ''
  const b = form.lastName?.trim()?.[0] ?? ''
  return (a + b).toUpperCase() || 'U'
})

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(event) {
  const f = event.target.files && event.target.files[0]
  if (!f) return
  form.avatarFile = f

  const reader = new FileReader()
  reader.onload = (e) => {
    form.avatarUrl = e.target.result
  }
  reader.readAsDataURL(f)
}

function togglePassword() {
  showPassword.value = !showPassword.value
}

function onSave() {
  if (saving.value) return
  saving.value = true
  successMessage.value = ''

  // simulate save
  setTimeout(() => {
    saving.value = false
    successMessage.value = 'Instellingen opgeslagen'
    setTimeout(() => (successMessage.value = ''), 2500)
  }, 800)
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
.save-icon { display:inline-flex; align-items:center; justify-content:center }
.save-img { width:16px; height:16px }

/* Body layout */
.card-body { margin-top:18px }
.settings-form { display:flex; gap:32px }
.form-left { width:340px }
.form-column { display:flex; flex-direction:column; gap:16px }
.form-right { flex:1 }

/* Avatar */
.label { font-size:14px; color:var(--color-text-soft); margin-bottom:6px }
.avatar-area { display:flex; align-items:center }
.avatar-outer { position:relative; width:120px; height:120px }
.avatar-inner { width:120px; height:120px; border-radius:50%; overflow:hidden; background:var(--color-neutral-100); display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--color-neutral-700); font-size:28px; box-shadow: var(--shadow-sm); border:1px solid var(--color-border) }
.avatar-inner img { width:100%; height:100%; object-fit:cover; display:block }
.initials { padding:6px }

.avatar-edit {
  position:absolute;
  right:0;
  bottom:0;
  transform: translate(25%, 25%);
  width:40px; height:40px; border-radius:12px;
  background: var(--color-surface);
  border:1px solid var(--color-border);
  display:flex; align-items:center; justify-content:center; cursor:pointer;
}
.avatar-edit img { width:14px; height:14px }

.visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0 }

/* Form fields */
.form-fields { display:flex; flex-direction:column; gap:12px }
.field { display:flex; flex-direction:column; gap:8px }
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

/* Password with eye button */
.password-wrap { position: relative; width: 320px }
.password-input { width: 100%; padding-right: 48px }
.eye-button {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  width:36px; height:36px; border-radius:8px; border:1px solid var(--color-border);
  background: var(--color-surface); display:flex; align-items:center; justify-content:center; cursor:pointer
}
.eye-button svg { width:18px; height:18px }
.eye-button img { width:18px; height:18px }

/* Toast */
.toast { margin-top:18px; display:inline-block; background: #e6fff0; border:1px solid rgba(33,222,74,0.12); color: var(--color-success); padding:8px 12px; border-radius:8px; font-weight:600 }

/* Remove default button appearance globally inside this component */
button { appearance: none; -webkit-appearance: none; -moz-appearance: none }

@media (min-width: 1000px) {
  .settings-card { max-width: 1160px }
}
</style>
