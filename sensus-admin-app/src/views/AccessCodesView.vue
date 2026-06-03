<template>
  <main class="access-codes-view">
    <header class="page-header">
      <div class="title-block">
        <h1 class="page-title">Toegangscodes</h1>
        <p class="page-description">
          Beheer codes waarmee scholen en organisaties toegang krijgen tot de scenario-app.
        </p>
      </div>

      <button type="button" class="primary-button" @click="openCreateModal">Nieuwe code maken</button>
    </header>

    <section class="kpi-grid" aria-label="Toegangscodes overzicht">
      <article class="card kpi-card">
        <div class="kpi-label">Actieve codes</div>
        <div class="kpi-value">{{ stats.active }}</div>
      </article>

      <article class="card kpi-card">
        <div class="kpi-label">Totaal gebruikt</div>
        <div class="kpi-value">{{ stats.totalUsed }}</div>
      </article>

      <article class="card kpi-card">
        <div class="kpi-label">Verlopen codes</div>
        <div class="kpi-value">{{ stats.expired }}</div>
      </article>
    </section>

    <section class="card overview-card">
      <div class="table-wrap">
        <table class="access-codes-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Label</th>
              <th>Gebruikt</th>
              <th>Max. gebruik</th>
              <th>Verloopt op</th>
              <th>Status</th>
              <th class="actions-col">Acties</th>
            </tr>
          </thead>

          <tbody v-if="loading">
            <tr>
              <td colspan="7">
                <div class="empty-state">Toegangscodes laden...</div>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="errorMessage">
            <tr>
              <td colspan="7">
                <ErrorState type="api" />
                <p class="table-error">{{ errorMessage }}</p>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="accessCodes.length">
            <tr v-for="item in accessCodes" :key="item.id" class="access-code-row">
              <td class="code-cell">{{ item.code }}</td>
              <td class="name-cell">{{ item.label || 'Zonder label' }}</td>
              <td>{{ item.used_count ?? 0 }}</td>
              <td>{{ formatMaxUses(item.max_uses) }}</td>
              <td>{{ formatExpiry(item.expires_at) }}</td>
              <td>
                <span :class="['status-badge', statusClass(item)]">{{ statusLabel(item) }}</span>
              </td>
              <td class="actions-col">
                <div class="actions-menu-wrap">
                  <button
                    type="button"
                    class="actions-button"
                    aria-label="Acties voor toegangscode"
                    aria-haspopup="menu"
                    :aria-expanded="openActionMenuId === item.id"
                    @click.stop="toggleActionMenu(item.id, $event)"
                  >
                    <img :src="icons.dots" alt="" class="actions-button-icon" />
                  </button>

                  <Teleport to="body">
                    <div
                      v-if="openActionMenuId === item.id"
                      class="actions-menu"
                      role="menu"
                      :style="actionMenuStyle"
                    >
                      <button type="button" class="actions-menu-item" role="menuitem" @click.stop="copyCode(item)">
                        <img :src="icons.copy" alt="" class="action-icon" />
                        <span>Code kopiëren</span>
                      </button>
                      <button type="button" class="actions-menu-item" role="menuitem" @click.stop="openEditModal(item)">
                        <img :src="icons.edit" alt="" class="action-icon" />
                        <span>Bewerken</span>
                      </button>
                      <button
                        type="button"
                        class="actions-menu-item"
                        :class="{ 'actions-menu-item--danger': item.is_active }"
                        role="menuitem"
                        :disabled="actionBusyId === item.id"
                        @click.stop="toggleActiveState(item)"
                      >
                        <img :src="item.is_active ? icons.disable : icons.enable" alt="" class="action-icon" />
                        <span>{{ actionBusyId === item.id ? 'Bijwerken...' : item.is_active ? 'Uitschakelen' : 'Activeren' }}</span>
                      </button>
                      <button
                        type="button"
                        class="actions-menu-item actions-menu-item--danger"
                        role="menuitem"
                        :disabled="actionBusyId === item.id"
                        @click.stop="openDeleteModal(item)"
                      >
                        <img :src="icons.delete" alt="" class="action-icon" />
                        <span>Verwijderen</span>
                      </button>
                    </div>
                  </Teleport>
                </div>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="7">
                <div class="empty-state">Er zijn nog geen toegangscodes.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="toastMessage" class="toast" role="status" aria-live="polite">{{ toastMessage }}</div>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <form class="code-modal" role="dialog" aria-modal="true" aria-labelledby="code-modal-title" @submit.prevent="saveAccessCode">
        <div class="modal-header">
          <div>
            <h2 id="code-modal-title" class="modal-title">{{ isEditing ? 'Code aanpassen' : 'Nieuwe code maken' }}</h2>
            <p class="modal-description">{{ isEditing ? 'Wijzig de instellingen van deze toegangscode.' : 'Maak een nieuwe toegangscode voor een school of organisatie.' }}</p>
          </div>
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span class="field-label">Label</span>
            <input v-model.trim="form.label" type="text" class="text-input" placeholder="Naam school of organisatie" />
          </label>

          <label class="form-field">
            <span class="field-label">Code</span>
            <div class="code-input-row">
              <input v-model.trim="form.code" type="text" class="text-input code-input" maxlength="24" placeholder="6AQ59" />
              <button v-if="!isEditing" type="button" class="secondary-button" @click="generateCode">Genereer code</button>
            </div>
          </label>

          <label class="form-field">
            <span class="field-label">Max. gebruik</span>
            <input v-model.number="form.max_uses" type="number" class="text-input" min="0" inputmode="numeric" placeholder="Onbeperkt" />
          </label>

          <label class="form-field">
            <span class="field-label">Verloopdatum</span>
            <input v-model="form.expires_at" type="date" class="text-input" />
          </label>

          <label class="active-field">
            <span>
              <span class="field-label">Actief</span>
              <span class="field-help">Code kan gebruikt worden zolang deze niet verlopen is.</span>
            </span>
            <span class="switch">
              <input v-model="form.is_active" type="checkbox" />
              <span class="switch-track" aria-hidden="true">
                <span class="switch-thumb"></span>
              </span>
            </span>
          </label>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>

        <div class="modal-actions">
          <button type="button" class="confirm-button confirm-button--ghost" :disabled="saving" @click="closeModal">Annuleren</button>
          <button type="submit" class="confirm-button confirm-button--primary" :disabled="saving">
            {{ saving ? 'Opslaan...' : 'Opslaan' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="deleteModal.open" class="modal-backdrop" @click.self="closeDeleteModal">
      <div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" aria-describedby="delete-modal-description">
        <h2 id="delete-modal-title" class="modal-title">Toegangscode verwijderen?</h2>
        <p id="delete-modal-description" class="modal-description">
          Weet je zeker dat je deze toegangscode wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
        </p>

        <p v-if="deleteError" class="form-error">{{ deleteError }}</p>

        <div class="modal-actions">
          <button type="button" class="confirm-button confirm-button--ghost" :disabled="deleting" @click="closeDeleteModal">Annuleren</button>
          <button type="button" class="confirm-button confirm-button--danger" :disabled="deleting" @click="deleteAccessCode">
            {{ deleting ? 'Verwijderen...' : 'Verwijderen' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ErrorState from '@/components/ErrorState.vue'
import { supabase } from '@/services/supabase'
import { formatDate } from '@/utils/dateFormatter'
import banIcon from '@/assets/icons/ban.svg'
import checkIcon from '@/assets/icons/check.svg'
import copyIcon from '@/assets/icons/copy.svg'
import deleteIcon from '@/assets/icons/trash.svg'
import dotsIcon from '@/assets/icons/dots.svg'
import editIcon from '@/assets/icons/pen.svg'

const codeAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const usedCodeMessage = 'Deze code is al gebruikt in sessies. Schakel de code uit in plaats van ze te verwijderen.'
const icons = {
  copy: copyIcon,
  edit: editIcon,
  disable: banIcon,
  enable: checkIcon,
  delete: deleteIcon,
  dots: dotsIcon,
}

const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const actionBusyId = ref(null)
const errorMessage = ref('')
const formError = ref('')
const deleteError = ref('')
const toastMessage = ref('')
const accessCodes = ref([])
const modalOpen = ref(false)
const editingId = ref(null)
const openActionMenuId = ref(null)
const actionMenuPosition = ref({
  top: 0,
  left: 0,
})
const form = ref(createEmptyForm())
const deleteModal = ref({
  open: false,
  item: null,
})
let toastTimeoutId = null

const isEditing = computed(() => Boolean(editingId.value))
const actionMenuStyle = computed(() => ({
  top: `${actionMenuPosition.value.top}px`,
  left: `${actionMenuPosition.value.left}px`,
}))

const stats = computed(() => {
  return accessCodes.value.reduce(
    (summary, item) => {
      if (statusLabel(item) === 'Actief') summary.active += 1
      if (statusLabel(item) === 'Verlopen') summary.expired += 1
      summary.totalUsed += Number(item.used_count || 0)
      return summary
    },
    { active: 0, totalUsed: 0, expired: 0 },
  )
})

onMounted(() => {
  void loadAccessCodes()
  window.addEventListener('click', handleWindowClick)
  window.addEventListener('resize', closeActionMenu)
  window.addEventListener('scroll', closeActionMenu, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleWindowClick)
  window.removeEventListener('resize', closeActionMenu)
  window.removeEventListener('scroll', closeActionMenu, true)

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId)
  }
})

async function loadAccessCodes() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('access_codes')
      .select('id, code, label, is_active, max_uses, used_count, expires_at, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    accessCodes.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error(error)
    accessCodes.value = []
    errorMessage.value = error?.message || 'Toegangscodes konden niet geladen worden.'
  } finally {
    loading.value = false
  }
}

function createEmptyForm() {
  return {
    label: '',
    code: '',
    max_uses: null,
    expires_at: '',
    is_active: true,
  }
}

function openCreateModal() {
  closeActionMenu()
  editingId.value = null
  form.value = createEmptyForm()
  formError.value = ''
  modalOpen.value = true
}

function openEditModal(item) {
  closeActionMenu()
  editingId.value = item.id
  form.value = {
    label: item.label || '',
    code: item.code || '',
    max_uses: item.max_uses ?? null,
    expires_at: toDateInputValue(item.expires_at),
    is_active: Boolean(item.is_active),
  }
  formError.value = ''
  modalOpen.value = true
}

function closeModal(force = false) {
  if (saving.value && !force) return

  modalOpen.value = false
  editingId.value = null
  form.value = createEmptyForm()
  formError.value = ''
}

function generateCode() {
  let value = ''

  for (let index = 0; index < 5; index += 1) {
    value += codeAlphabet[Math.floor(Math.random() * codeAlphabet.length)]
  }

  form.value.code = value
}

async function saveAccessCode() {
  formError.value = ''
  const code = String(form.value.code || '').trim().toUpperCase()

  if (!code) {
    formError.value = 'Vul een code in.'
    return
  }

  saving.value = true

  try {
    if (isEditing.value) {
      const { error } = await supabase
        .from('access_codes')
        .update({
          label: form.value.label || null,
          code,
          max_uses: normalizeMaxUses(form.value.max_uses),
          expires_at: toDatabaseDate(form.value.expires_at),
          is_active: Boolean(form.value.is_active),
        })
        .eq('id', editingId.value)

      if (error) throw error
      showToast('Toegangscode aangepast')
    } else {
      const { error } = await supabase.from('access_codes').insert({
        code,
        label: form.value.label || null,
        max_uses: normalizeMaxUses(form.value.max_uses),
        used_count: 0,
        expires_at: toDatabaseDate(form.value.expires_at),
        is_active: Boolean(form.value.is_active),
      })

      if (error) throw error
      showToast('Toegangscode aangemaakt')
    }

    closeModal(true)
    await loadAccessCodes()
  } catch (error) {
    console.error(error)
    formError.value = error?.message || 'Opslaan mislukt. Probeer opnieuw.'
  } finally {
    saving.value = false
  }
}

async function toggleActiveState(item) {
  closeActionMenu()
  actionBusyId.value = item.id
  errorMessage.value = ''
  const oldValue = Boolean(item.is_active)
  const newValue = !oldValue
  item.is_active = newValue

  try {
    const { error } = await supabase
      .from('access_codes')
      .update({ is_active: newValue })
      .eq('id', item.id)

    if (error) throw error

    await loadAccessCodes()
    showToast(newValue ? 'Code geactiveerd' : 'Code uitgeschakeld')
  } catch (error) {
    console.error(error)
    item.is_active = oldValue
    errorMessage.value = error?.message || 'Status aanpassen mislukt.'
  } finally {
    actionBusyId.value = null
  }
}

function openDeleteModal(item) {
  closeActionMenu()
  deleteModal.value = {
    open: true,
    item,
  }
  deleteError.value = ''
}

function closeDeleteModal(force = false) {
  if (deleting.value && !force) return

  deleteModal.value = {
    open: false,
    item: null,
  }
  deleteError.value = ''
}

async function deleteAccessCode() {
  const item = deleteModal.value.item
  if (!item?.id) return

  deleting.value = true
  actionBusyId.value = item.id
  deleteError.value = ''
  errorMessage.value = ''

  try {
    const hasSessions = hasLinkedSessions(item)

    if (hasSessions) {
      deleteError.value = usedCodeMessage
      showToast(usedCodeMessage)
      return
    }

    const { error } = await supabase
      .from('access_codes')
      .delete()
      .eq('id', item.id)

    if (error) throw error

    closeDeleteModal(true)
    await loadAccessCodes()
    showToast('Toegangscode verwijderd')
  } catch (error) {
    console.error(error)
    deleteError.value = error?.message || 'Toegangscode verwijderen mislukt.'
  } finally {
    deleting.value = false
    actionBusyId.value = null
  }
}

function hasLinkedSessions(item) {
  return Number(item?.used_count || 0) > 0
}

async function copyCode(item) {
  closeActionMenu()

  try {
    await navigator.clipboard.writeText(item.code)
    showToast('Code gekopieerd')
  } catch (error) {
    console.error(error)
    showToast('Kopiëren mislukt')
  }
}

function toggleActionMenu(id, event) {
  if (openActionMenuId.value === id) {
    closeActionMenu()
    return
  }

  positionActionMenu(event?.currentTarget)
  openActionMenuId.value = id
}

function closeActionMenu() {
  openActionMenuId.value = null
}

function positionActionMenu(target) {
  if (!(target instanceof HTMLElement)) return

  const gap = 8
  const viewportPadding = 12
  const menuWidth = 220
  const menuHeight = 184
  const rect = target.getBoundingClientRect()
  const availableBelow = window.innerHeight - rect.bottom - viewportPadding
  const shouldOpenUp = availableBelow < menuHeight && rect.top > menuHeight
  const top = shouldOpenUp ? rect.top - menuHeight - gap : rect.bottom + gap
  const preferredLeft = rect.right - menuWidth
  const maxLeft = window.innerWidth - menuWidth - viewportPadding

  actionMenuPosition.value = {
    top: Math.max(viewportPadding, top),
    left: Math.max(viewportPadding, Math.min(preferredLeft, maxLeft)),
  }
}

function handleWindowClick(event) {
  if (event.target instanceof Element && (event.target.closest('.actions-menu-wrap') || event.target.closest('.actions-menu'))) return
  closeActionMenu()
}

function statusLabel(item) {
  if (!item?.is_active) return 'Uitgeschakeld'
  if (isExpired(item?.expires_at)) return 'Verlopen'
  return 'Actief'
}

function statusClass(item) {
  const label = statusLabel(item)
  if (label === 'Actief') return 'status--active'
  if (label === 'Verlopen') return 'status--expired'
  return 'status--disabled'
}

function isExpired(value) {
  if (!value) return false

  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
}

function formatMaxUses(value) {
  if (value === null || value === undefined || value === '') return 'Onbeperkt'
  return value
}

function formatExpiry(value) {
  if (!value) return 'Geen verloopdatum'
  return formatDate(value)
}

function normalizeMaxUses(value) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return null

  return Math.max(0, Math.floor(numberValue))
}

function toDatabaseDate(value) {
  if (!value) return null

  const date = new Date(`${value}T23:59:59`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toDateInputValue(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function showToast(message) {
  toastMessage.value = message

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId)
  }

  toastTimeoutId = setTimeout(() => {
    toastMessage.value = ''
    toastTimeoutId = null
  }, 3000)
}
</script>

<style scoped>
.access-codes-view {
  padding: 0 var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-5);
  padding-top: 6px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  color: var(--color-text);
}

.page-description {
  margin: 0;
  max-width: 680px;
  color: var(--color-text-soft);
  font-size: var(--text-md);
  line-height: 1.5;
}

.primary-button {
  border: none;
  border-radius: 16px;
  background: var(--color-primary-600);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: 18px;
  font-weight: 700;
  padding: 16px 24px;
  cursor: pointer;
  box-shadow: var(--shadow-md);
}

.primary-button:hover {
  background: var(--color-primary-700);
}

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.kpi-card {
  padding: 18px;
}

.kpi-label {
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: 600;
}

.kpi-value {
  margin-top: 8px;
  color: var(--color-text);
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
}

.overview-card {
  padding: 10px;
  border-radius: 18px;
}

.table-wrap {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.access-codes-table {
  width: 100%;
  min-width: 840px;
  border-collapse: collapse;
  background: var(--color-surface);
}

.access-codes-table thead th {
  text-align: left;
  color: var(--color-text-soft);
  font-size: var(--text-md);
  font-weight: 500;
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--color-border);
}

.access-codes-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-soft);
  font-size: var(--text-md);
  vertical-align: middle;
}

.access-codes-table tbody tr:last-child td {
  border-bottom: none;
}

.access-code-row:hover {
  background: var(--color-neutral-100);
}

.code-cell,
.name-cell {
  color: var(--color-text);
  font-weight: 600;
}

.code-cell {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0;
}

.actions-col {
  width: 1%;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border-radius: var(--radius-pill);
  padding: 5px 12px;
  font-size: var(--text-sm);
  font-weight: 700;
}

.status--active {
  background: color-mix(in srgb, var(--color-success) 16%, var(--color-surface));
  color: #107326;
}

.status--expired {
  background: color-mix(in srgb, var(--color-warning) 14%, var(--color-surface));
  color: #9c3300;
}

.status--disabled {
  background: var(--color-neutral-200);
  color: var(--color-neutral-700);
}

.actions-menu-wrap {
  position: relative;
  display: inline-flex;
  justify-content: flex-end;
}

.actions-button {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.actions-button:hover {
  background: var(--color-neutral-100);
}

.actions-button-icon {
  width: 20px;
  height: 20px;
  display: block;
}

.actions-menu {
  position: fixed;
  z-index: 80;
  width: 220px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.actions-menu-item {
  width: 100%;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  font-weight: 600;
  text-align: left;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.actions-menu-item:hover {
  background: var(--color-neutral-100);
}

.actions-menu-item:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.actions-menu-item--danger {
  color: var(--color-text);
}

.actions-menu-item--danger:hover {
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-surface));
  color: var(--color-danger);
}

.action-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: block;
  transition: filter var(--transition-fast);
}

.actions-menu-item--danger:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(16%) sepia(100%) saturate(7482%) hue-rotate(2deg) brightness(101%) contrast(117%);
}

.empty-state {
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-soft);
  font-size: var(--text-md);
}

.table-error {
  margin: 0 0 var(--space-4);
  color: var(--color-text-soft);
  text-align: center;
}

.toast {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  z-index: 40;
  max-width: min(360px, calc(100vw - 40px));
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-md);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: color-mix(in srgb, var(--color-neutral-900) 52%, transparent);
}

.code-modal {
  width: 100%;
  max-width: 620px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.confirm-modal {
  width: 100%;
  max-width: 520px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.modal-title {
  margin: 0 0 8px;
  color: var(--color-text);
  font-size: 24px;
  font-weight: 700;
}

.modal-description {
  margin: 0;
  color: var(--color-text-soft);
  font-size: var(--text-md);
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 700;
}

.field-help {
  display: block;
  margin-top: 4px;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: 1.4;
}

.text-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  outline: none;
  box-sizing: border-box;
  box-shadow: var(--shadow-sm);
  padding: 14px 16px;
}

.text-input:disabled {
  background: var(--color-neutral-100);
  color: var(--color-text-soft);
}

.code-input-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.code-input {
  text-transform: uppercase;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0;
}

.secondary-button {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  font-weight: 700;
  padding: 12px 16px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.secondary-button:hover {
  background: var(--color-neutral-100);
}

.active-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}

.switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 2px 0;
}

.switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch-track {
  width: 48px;
  height: 26px;
  border-radius: var(--radius-pill);
  background: var(--color-border);
  padding: 3px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  transition: background var(--transition-fast);
}

.switch-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transform: translateX(0);
  transition: transform var(--transition-fast);
}

.switch input:checked + .switch-track {
  background: var(--color-secondary-600);
}

.switch input:checked + .switch-track .switch-thumb {
  transform: translateX(22px);
}

.form-error {
  margin: var(--space-4) 0 0;
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: 600;
}

.modal-actions {
  display: flex;
  flex-direction: column-reverse;
  gap: 12px;
  margin-top: 24px;
}

.confirm-button {
  border: none;
  border-radius: 14px;
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  font-weight: 700;
  padding: 12px 18px;
  cursor: pointer;
}

.confirm-button:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.confirm-button--ghost {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.confirm-button--ghost:hover {
  background: var(--color-neutral-100);
}

.confirm-button--primary {
  background: var(--color-primary-600);
  color: var(--color-surface);
}

.confirm-button--primary:hover {
  background: var(--color-primary-700);
}

.confirm-button--danger {
  background: var(--color-danger);
  color: var(--color-surface);
}

.confirm-button--danger:hover {
  filter: brightness(0.92);
}

@media (min-width: 680px) {
  .page-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }

  .primary-button {
    min-width: 226px;
  }

  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-field:nth-child(1),
  .form-field:nth-child(2),
  .active-field {
    grid-column: 1 / -1;
  }

  .code-input-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .modal-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}

@media (min-width: 980px) {
  .page-title {
    font-size: 48px;
  }
}
</style>
