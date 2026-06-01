<template>
  <main class="settings-view">
    <section class="settings-card">
      <div class="card-header">
        <div class="titles">
          <h1 class="page-title">Instellingen</h1>
          <p class="subtitle">Pas je gegevens aan</p>
        </div>

        <button type="button" class="save-button" @click="onSave" :disabled="saving || uploadingAvatar || loading">
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
        <ErrorState v-else-if="loadError" type="api" />

        <form v-else class="settings-form" @submit.prevent="onSave">
          <div class="form-left">
            <div class="form-column">
              <div v-if="errorMessage" class="state-message state-error">{{ errorMessage }}</div>

              <label class="label">Profielfoto</label>

              <div class="avatar-area">
                <input ref="fileInput" type="file" accept="image/*" class="visually-hidden" @change="onFileChange" />

                <div class="avatar-outer">
                  <div class="avatar-inner">
                    <img v-if="form.avatarUrl" :src="form.avatarUrl" alt="Profielfoto" />
                    <div v-else class="initials">{{ initials }}</div>
                  </div>

                  <button type="button" class="avatar-edit" @click.prevent="triggerFileInput" aria-label="Wijzig profielfoto" :disabled="uploadingAvatar || loading || saving">
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
                  <div class="password-display">••••••••••</div>
                  <RouterLink class="change-password-button" to="/settings/password">Wachtwoord wijzigen</RouterLink>
                </div>
              </div>
            </div>
          </div>

          <div class="form-right"><!-- keep whitespace to the right per Figma --></div>
        </form>

        <div v-if="successMessage && !loading" class="toast">{{ successMessage }}</div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import ErrorState from '@/components/ErrorState.vue'
import PenIcon from '@/assets/icons/pen.svg'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

const loading = ref(true)
const saving = ref(false)
const uploadingAvatar = ref(false)
const loadError = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const fileInput = ref(null)
const currentUserId = ref('')
const profileAvatarUrl = ref('')
const authStore = useAuthStore()

const form = reactive({
  firstName: '',
  lastName: '',
  jobTitle: '',
  email: '',
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

async function onFileChange(event) {
  const f = event.target.files && event.target.files[0]
  if (!f) return

  if (!currentUserId.value) {
    errorMessage.value = 'Geen gebruiker gevonden voor avatar upload.'
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  uploadingAvatar.value = true
  form.avatarFile = f

  try {
    form.avatarUrl = await toDataUrl(f)

    const fileExtension = getFileExtension(f.name)
    const filePath = `${currentUserId.value}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, f, {
        cacheControl: '3600',
        upsert: true,
        contentType: f.type || undefined,
      })

    if (uploadError) throw uploadError

    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = publicData?.publicUrl || ''
    if (!publicUrl) {
      throw new Error('Public URL voor avatar kon niet opgehaald worden.')
    }

    const { error: updateError } = await supabase
      .from('admin_profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', currentUserId.value)

    if (updateError) throw updateError

    form.avatarUrl = publicUrl
    profileAvatarUrl.value = publicUrl

    // refresh topbar and any component using auth profile
    authStore.profile = {
      ...(authStore.profile || {}),
      avatar_url: publicUrl,
    }
    await authStore.fetchProfile()

    successMessage.value = 'Profielfoto opgeslagen'
    setTimeout(() => (successMessage.value = ''), 2500)
  } catch (error) {
    console.error('Avatar upload failed:', error)
    errorMessage.value = error?.message || 'Uploaden van profielfoto is mislukt.'
  } finally {
    uploadingAvatar.value = false
    if (event?.target) {
      event.target.value = ''
    }
  }
}

onMounted(() => {
  void loadSettings()
})

async function loadSettings() {
  loading.value = true
  loadError.value = ''
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('Geen ingelogde gebruiker gevonden.')

    currentUserId.value = user.id
    form.email = user.email || ''

    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('display_name, role, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) throw profileError

    if (profile) {
      const { firstName, lastName } = splitDisplayName(profile.display_name)

      form.firstName = firstName
      form.lastName = lastName
      form.jobTitle = profile.role || ''
      form.avatarUrl = profile.avatar_url || ''
      profileAvatarUrl.value = profile.avatar_url || ''
    }
  } catch (error) {
    console.error('Loading settings failed:', error)
    loadError.value = 'De data kon niet geladen worden. Probeer opnieuw.'
  } finally {
    loading.value = false
  }
}

function splitDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'string') {
    return { firstName: '', lastName: '' }
  }

  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) {
    return { firstName: '', lastName: '' }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

async function onSave() {
  if (saving.value || loading.value || uploadingAvatar.value) return

  if (!currentUserId.value) {
    errorMessage.value = 'Geen gebruiker gevonden om op te slaan.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ').trim()
    const avatarUrlForUpdate = form.avatarUrl && !form.avatarUrl.startsWith('data:')
      ? form.avatarUrl
      : profileAvatarUrl.value

    const { error } = await supabase
      .from('admin_profiles')
      .update({
        display_name: fullName || null,
        role: form.jobTitle?.trim() || null,
        avatar_url: avatarUrlForUpdate || null,
      })
      .eq('user_id', currentUserId.value)

    if (error) throw error

    profileAvatarUrl.value = avatarUrlForUpdate || ''
    authStore.profile = {
      ...(authStore.profile || {}),
      display_name: fullName || '',
      role: form.jobTitle?.trim() || '',
      avatar_url: profileAvatarUrl.value,
    }
    await authStore.fetchProfile()

    saving.value = false
    successMessage.value = 'Instellingen opgeslagen'
    setTimeout(() => (successMessage.value = ''), 2500)
  } catch (error) {
    console.error('Saving settings failed:', error)
    errorMessage.value = error?.message || 'Opslaan mislukt. Probeer opnieuw.'
  } finally {
    saving.value = false
  }
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e?.target?.result || '')
    reader.onerror = () => reject(new Error('Avatar preview kon niet geladen worden.'))
    reader.readAsDataURL(file)
  })
}

function getFileExtension(fileName) {
  const extension = fileName?.split('.').pop()?.toLowerCase()

  if (!extension || extension.length > 5) {
    return 'jpg'
  }

  return extension
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
.avatar-edit:disabled { opacity: 0.6; cursor: default }

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

/* Password */
.password-display {
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
  display: flex;
  align-items: center;
}
.change-password-button {
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
