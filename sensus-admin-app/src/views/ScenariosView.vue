<template>
  <main class="scenarios-view">
    <header class="page-header">
      <div class="title-block">
        <h1 class="page-title">Scenario’s</h1>

        <nav class="tabs" aria-label="Scenario overzicht tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="tab-button"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <button type="button" class="primary-button" @click="goToCreateScenario">+ Nieuw scenario</button>
    </header>

    <section class="card overview-card">
      <div v-if="loading" class="table-state">Scenario’s laden...</div>
      <div v-else-if="errorMessage" class="table-state table-state-error">{{ errorMessage }}</div>
      <template v-else>
        <div class="filters-row">
          <label class="search-field">
            <span class="sr-only">Zoeken</span>
            <span class="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="M20 20l-3.6-3.6"></path>
              </svg>
            </span>
            <input v-model="searchQuery" type="search" class="search-input" placeholder="Zoeken" />
          </label>

          <label class="select-field">
            <span class="sr-only">Thema’s</span>
            <select v-model="selectedTheme" class="select-input">
              <option value="all">Thema’s</option>
              <option v-for="theme in themeOptions" :key="theme" :value="theme">{{ theme }}</option>
            </select>
          </label>

          <label class="select-field">
            <span class="sr-only">Status</span>
            <select v-model="selectedStatus" class="select-input">
              <option v-for="status in statusOptions" :key="status.value" :value="status.value">{{ status.label }}</option>
            </select>
          </label>
        </div>

        <div v-if="selectedScenarioIds.length" class="bulk-action-bar" role="status">
          <span class="bulk-action-count">{{ selectedScenarioIds.length }} scenario’s geselecteerd</span>
          <button type="button" class="bulk-delete-button" @click="openBulkDeleteModal">Verwijderen</button>
        </div>

        <div class="table-wrap">
          <table class="scenarios-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input
                    type="checkbox"
                    class="checkbox"
                    aria-label="Selecteer alle scenario’s op deze pagina"
                    :checked="allVisibleSelected"
                    :aria-checked="hasPartialSelection ? 'mixed' : allVisibleSelected ? 'true' : 'false'"
                    @click.stop
                    @change="toggleSelectAllVisible"
                  />
                </th>
                <th>Naam</th>
                <th>Thema</th>
                <th>Datum</th>
                <th>Sessies</th>
                <th>Status</th>
                <th class="actions-col"></th>
              </tr>
            </thead>

            <tbody v-if="filteredScenarios.length">
              <tr
                v-for="scenario in filteredScenarios"
                :key="scenario.id"
                class="scenario-row"
              >
                <td class="checkbox-col">
                  <input
                    type="checkbox"
                    class="checkbox"
                    :aria-label="`Selecteer ${scenario.name}`"
                    :checked="selectedScenarioIds.includes(scenario.id)"
                    @click.stop
                    @change="toggleSelection(scenario.id)"
                  />
                </td>
                <td class="name-cell">{{ scenario.name }}</td>
                <td>{{ scenario.theme }}</td>
                <td>{{ scenario.date }}</td>
                <td>{{ scenario.sessions }}</td>
                <td>
                  <label class="switch" :title="scenario.is_active ? 'Actief' : 'Concept'">
                    <input type="checkbox" :checked="scenario.is_active" @click.stop @change="toggleScenarioStatus(scenario)" />
                    <span class="switch-track" aria-hidden="true">
                      <span class="switch-thumb"></span>
                    </span>
                    <span class="sr-only">{{ scenario.is_active ? 'Actief' : 'Concept' }}</span>
                  </label>
                </td>
                <td class="actions-col">
                  <div class="actions-menu-wrap">
                    <button
                      type="button"
                      class="actions-button"
                      aria-label="Acties voor scenario"
                      :aria-expanded="openActionMenuId === scenario.id"
                      @click.stop="toggleActionMenu(scenario.id)"
                    >
                      <svg viewBox="0 0 24 24" class="actions-button-icon" aria-hidden="true">
                        <circle cx="12" cy="5" r="1.7" fill="currentColor"></circle>
                        <circle cx="12" cy="12" r="1.7" fill="currentColor"></circle>
                        <circle cx="12" cy="19" r="1.7" fill="currentColor"></circle>
                      </svg>
                    </button>

                    <div v-if="openActionMenuId === scenario.id" class="actions-menu" role="menu">
                      <button type="button" class="actions-menu-item" role="menuitem" @click.stop="goToEditScenario(scenario.id)">
                        <svg viewBox="0 0 24 24" class="action-icon" aria-hidden="true">
                          <path d="M4 17.25V20h2.75L17.8 8.95l-2.75-2.75L4 17.25Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
                          <path d="m14.2 6.2 2.75 2.75 1.2-1.2a1.6 1.6 0 0 0 0-2.25l-.5-.5a1.6 1.6 0 0 0-2.25 0l-1.2 1.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
                        </svg>
                        <span>Bewerken</span>
                      </button>

                      <button type="button" class="actions-menu-item" role="menuitem" @click.stop="duplicateScenario(scenario)">
                        <svg viewBox="0 0 24 24" class="action-icon" aria-hidden="true">
                          <rect x="8" y="8" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
                          <path d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                        </svg>
                        <span>Dupliceren</span>
                      </button>

                      <button type="button" class="actions-menu-item actions-menu-item--danger" role="menuitem" @click.stop="openDeleteModal(scenario)">
                        <svg viewBox="0 0 24 24" class="action-icon" aria-hidden="true">
                          <path d="M4 7h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                          <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                          <path d="M7 7l.7 11.2A1.8 1.8 0 0 0 9.5 20h5A1.8 1.8 0 0 0 16.3 18.2L17 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                          <path d="M10 10.2v5.6M14 10.2v5.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                        </svg>
                        <span>Verwijderen</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr>
                <td colspan="7">
                  <div class="empty-state">Geen scenario’s gevonden.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="pagination">
          <button type="button" class="pagination-button">‹ Vorige</button>
          <span class="pagination-divider"></span>
          <button type="button" class="pagination-button">Volgende ›</button>
        </footer>
      </template>
    </section>

    <div v-if="toastMessage" class="toast" role="status" aria-live="polite">{{ toastMessage }}</div>

    <div v-if="confirmModal.open" class="confirm-backdrop" @click.self="closeConfirmModal">
      <div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <h2 id="confirm-title" class="confirm-title">{{ confirmModal.title }}</h2>
        <p id="confirm-description" class="confirm-text">{{ confirmModal.message }}</p>

        <div class="confirm-actions">
          <button type="button" class="confirm-button confirm-button--ghost" @click="closeConfirmModal" :disabled="isActionBusy">Annuleren</button>
          <button type="button" class="confirm-button confirm-button--danger" @click="confirmDeletion" :disabled="isActionBusy">
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { formatDate } from '@/utils/dateFormatter'

const normalizeText = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
}

const loading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedTheme = ref('all')
const selectedStatus = ref('all')
const activeTab = ref('all')
const scenarioItems = ref([])
const selectedScenarioIds = ref([])
const openActionMenuId = ref(null)
const toastMessage = ref('')
const isActionBusy = ref(false)
const confirmModal = ref({
  open: false,
  title: '',
  message: '',
  type: 'single',
  scenarioId: null,
  scenarioIds: [],
})
const router = useRouter()
let toastTimeoutId = null

onMounted(() => {
  void loadScenarios()
  window.addEventListener('click', handleWindowClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleWindowClick)

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId)
  }
})

function goToCreateScenario() {
  router.push('/scenarios/new')
}

function goToEditScenario(id) {
  router.push(`/scenarios/${id}/edit`)
}

async function loadScenarios() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [{ data: scenariosData, error: scenariosError }, { data: sessionsData, error: sessionsError }] = await Promise.all([
      supabase.from('scenarios').select('*'),
      supabase.from('sessions').select('*'),
    ])

    if (scenariosError) throw scenariosError
    if (sessionsError) throw sessionsError

    console.log('sessions columns', Array.isArray(sessionsData) ? sessionsData[0] : null)

    const sessionCountMap = buildSessionCountMap(Array.isArray(sessionsData) ? sessionsData : [])
    const rows = Array.isArray(scenariosData)
      ? scenariosData.map((record, index) => mapScenarioRecord(record, index, sessionCountMap))
      : []

    scenarioItems.value = rows.sort((left, right) => right.sortStamp - left.sortStamp)
    selectedScenarioIds.value = selectedScenarioIds.value.filter((id) => rows.some((scenario) => scenario.id === id))
    openActionMenuId.value = null
  } catch (error) {
    scenarioItems.value = []
    errorMessage.value = error?.message || 'Scenario’s konden niet worden geladen.'
  } finally {
    loading.value = false
  }
}

function mapScenarioRecord(record, index, sessionCountMap = new Map()) {
  const name = getFirstString(record, ['title', 'name', 'display_name', 'scenario_name']) || 'Onbekend scenario'
  const theme = getFirstString(record, ['theme', 'theme_name', 'category', 'subject']) || 'Onbekend thema'
  const date = formatDateValue(getFirstString(record, ['date', 'created_at', 'updated_at', 'start_date', 'published_at']))
  const sessions = getScenarioSessionCount(record, sessionCountMap)
  const isActive = getScenarioStatus(record)

  return {
    id: record?.id ?? record?.scenario_id ?? record?.scenarioId ?? record?.uuid ?? record?.slug ?? `${index}-${name}`,
    name,
    theme,
    date,
    sessions,
    active: isActive,
    is_active: isActive,
    sortStamp: getSortStamp(record),
    record,
  }
}

function buildSessionCountMap(sessionRows) {
  const counts = new Map()

  for (const session of sessionRows) {
    const scenarioKey = normalizeText(getFirstString(session, ['scenario_id']))
    if (!scenarioKey) continue

    counts.set(scenarioKey, (counts.get(scenarioKey) || 0) + 1)
  }

  return counts
}

function getScenarioSessionCount(record, sessionCountMap) {
  const candidateKeys = [
    getFirstString(record, ['id', 'scenario_id', 'scenarioId', 'uuid']),
    getFirstString(record, ['slug']),
    getFirstString(record, ['title', 'scenario_title', 'name', 'scenario_name', 'display_name']),
  ].map(normalizeText).filter(Boolean)

  for (const key of candidateKeys) {
    const count = sessionCountMap.get(key)
    if (typeof count === 'number') return count
  }

  return 0
}

function getSortStamp(record) {
  const dateValue = getFirstString(record, ['created_at', 'updated_at', 'date', 'start_date', 'published_at'])
  const date = dateValue ? new Date(dateValue) : null

  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
}

function formatDateValue(value) {
  return formatDate(value)
}

function getScenarioStatus(record) {
  const statusValue = getFirstString(record, ['status', 'state'])

  if (statusValue) {
    const normalized = statusValue.trim().toLowerCase()

    if (['active', 'actief', 'published', 'enabled', 'true', '1'].includes(normalized)) {
      return true
    }

    if (['concept', 'draft', 'inactive', 'disabled', 'false', '0'].includes(normalized)) {
      return false
    }
  }

  const booleanValue = getFirstBoolean(record, ['active', 'is_active', 'enabled', 'published'])

  return booleanValue ?? false
}

function getFirstString(record, keys) {
  for (const key of keys) {
    const value = record?.[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function getFirstNumber(record, keys) {
  for (const key of keys) {
    const value = record?.[key]
    const numericValue = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value)

    if (!Number.isNaN(numericValue) && value !== null && value !== undefined && `${value}`.trim() !== '') {
      return numericValue
    }
  }

  return null
}

function getFirstBoolean(record, keys) {
  for (const key of keys) {
    const value = record?.[key]

    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'number') {
      return value !== 0
    }

    if (typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toLowerCase()

      if (['true', '1', 'yes', 'y', 'active', 'actief', 'published', 'enabled'].includes(normalized)) {
        return true
      }

      if (['false', '0', 'no', 'n', 'concept', 'draft', 'inactive', 'disabled'].includes(normalized)) {
        return false
      }
    }
  }

  return null
}

const activeCount = computed(() => scenarioItems.value.filter((scenario) => scenario.active).length)
const conceptCount = computed(() => scenarioItems.value.filter((scenario) => !scenario.active).length)

const tabs = computed(() => [
  { key: 'all', label: 'Alle scenario’s' },
  { key: 'active', label: `Actief (${activeCount.value})` },
  { key: 'concepts', label: `Concepten (${conceptCount.value})` },
])

const themeOptions = computed(() => [...new Set(scenarioItems.value.map((scenario) => scenario.theme))])

const statusOptions = [
  { value: 'all', label: 'Status' },
  { value: 'active', label: 'Actief' },
  { value: 'concept', label: 'Concept' },
]

const filteredScenarios = computed(() => {
  let items = [...scenarioItems.value]

  if (activeTab.value === 'active') {
    items = items.filter((scenario) => scenario.active)
  }

  if (activeTab.value === 'concepts') {
    items = items.filter((scenario) => !scenario.active)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    items = items.filter((scenario) => {
      return [scenario.name, scenario.theme, scenario.date, scenario.active ? 'actief' : 'concept']
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }

  if (selectedTheme.value !== 'all') {
    items = items.filter((scenario) => scenario.theme === selectedTheme.value)
  }

  if (selectedStatus.value === 'active') {
    items = items.filter((scenario) => scenario.active)
  }

  if (selectedStatus.value === 'concept') {
    items = items.filter((scenario) => !scenario.active)
  }

  return items
})

const visibleScenarioIds = computed(() => filteredScenarios.value.map((scenario) => scenario.id))

const allVisibleSelected = computed(
  () => visibleScenarioIds.value.length > 0 && visibleScenarioIds.value.every((id) => selectedScenarioIds.value.includes(id)),
)

const hasPartialSelection = computed(
  () => visibleScenarioIds.value.some((id) => selectedScenarioIds.value.includes(id)) && !allVisibleSelected.value,
)

function toggleSelectAllVisible() {
  const ids = visibleScenarioIds.value

  if (!ids.length) return

  if (allVisibleSelected.value) {
    selectedScenarioIds.value = selectedScenarioIds.value.filter((id) => !ids.includes(id))
    return
  }

  selectedScenarioIds.value = Array.from(new Set([...selectedScenarioIds.value, ...ids]))
}

function toggleSelection(id) {
  if (selectedScenarioIds.value.includes(id)) {
    selectedScenarioIds.value = selectedScenarioIds.value.filter((scenarioId) => scenarioId !== id)
    return
  }

  selectedScenarioIds.value = [...selectedScenarioIds.value, id]
}

function toggleActionMenu(id) {
  openActionMenuId.value = openActionMenuId.value === id ? null : id
}

function closeActionMenu() {
  openActionMenuId.value = null
}

function handleWindowClick(event) {
  if (event.target instanceof Element && event.target.closest('.actions-menu-wrap')) {
    return
  }

  closeActionMenu()
}

function showToast(message) {
  toastMessage.value = message

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId)
  }

  toastTimeoutId = setTimeout(() => {
    toastMessage.value = ''
  }, 2500)
}

function generateDocumentId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function openDeleteModal(scenario) {
  closeActionMenu()
  confirmModal.value = {
    open: true,
    title: 'Scenario verwijderen?',
    message: 'Ben je zeker dat je dit scenario wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.',
    type: 'single',
    scenarioId: scenario.id,
    scenarioIds: [scenario.id],
  }
}

function openBulkDeleteModal() {
  if (!selectedScenarioIds.value.length) return

  confirmModal.value = {
    open: true,
    title: 'Scenario’s verwijderen?',
    message: 'Ben je zeker dat je deze scenario’s wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.',
    type: 'bulk',
    scenarioId: null,
    scenarioIds: [...selectedScenarioIds.value],
  }
}

function closeConfirmModal() {
  confirmModal.value = {
    open: false,
    title: '',
    message: '',
    type: 'single',
    scenarioId: null,
    scenarioIds: [],
  }
}

async function confirmDeletion() {
  if (confirmModal.value.type === 'bulk') {
    await deleteScenarios(confirmModal.value.scenarioIds)
    return
  }

  await deleteScenario(confirmModal.value.scenarioId)
}

async function deleteScenario(id) {
  if (!id) return

  isActionBusy.value = true

  try {
    const { error } = await supabase.from('scenarios').delete().eq('id', id)

    if (error) throw error

    selectedScenarioIds.value = selectedScenarioIds.value.filter((scenarioId) => scenarioId !== id)
    showToast('Scenario verwijderd')
    closeConfirmModal()
    await loadScenarios()
  } catch (error) {
    console.error(error)
    errorMessage.value = error?.message || 'Scenario verwijderen mislukt.'
  } finally {
    isActionBusy.value = false
  }
}

async function deleteScenarios(ids) {
  if (!ids.length) return

  isActionBusy.value = true

  try {
    const { error } = await supabase.from('scenarios').delete().in('id', ids)

    if (error) throw error

    selectedScenarioIds.value = []
    showToast('Scenario’s verwijderd')
    closeConfirmModal()
    await loadScenarios()
  } catch (error) {
    console.error(error)
    errorMessage.value = error?.message || 'Scenario’s verwijderen mislukt.'
  } finally {
    isActionBusy.value = false
  }
}

async function duplicateScenario(scenario) {
  closeActionMenu()
  isActionBusy.value = true

  try {
    const { data, error } = await supabase.from('scenarios').select('*').eq('id', scenario.id).single()

    if (error) throw error
    if (!data) throw new Error('Scenario niet gevonden.')

    const now = new Date().toISOString()
    const duplicatePayload = { ...data }

    delete duplicatePayload.id
    delete duplicatePayload.created_at
    delete duplicatePayload.updated_at
    delete duplicatePayload.published_at

    duplicatePayload.title = `${data.title || 'Scenario'} kopie`
    duplicatePayload.slug = `${data.slug || 'scenario'}-kopie-${Date.now()}`
    duplicatePayload.document_id = generateDocumentId()
    duplicatePayload.is_active = false
    duplicatePayload.published_at = null
    duplicatePayload.created_at = now
    duplicatePayload.updated_at = now

    const { error: insertError } = await supabase.from('scenarios').insert(duplicatePayload)

    if (insertError) throw insertError

    showToast('Scenario gedupliceerd')
    await loadScenarios()
  } catch (error) {
    console.error(error)
    errorMessage.value = error?.message || 'Scenario dupliceren mislukt.'
  } finally {
    isActionBusy.value = false
  }
}

async function toggleScenarioStatus(scenario) {
  const oldValue = scenario.is_active
  const newValue = !oldValue

  scenario.is_active = newValue
  scenario.active = newValue

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('scenarios')
    .update({
      is_active: newValue,
      updated_at: now,
      published_at: newValue ? now : null,
    })
    .eq('id', scenario.id)

  if (error) {
    scenario.is_active = oldValue
    scenario.active = oldValue
    console.error('Status update failed:', error)
    return
  }
}
</script>

<style scoped>
.scenarios-view {
  padding: 0 var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
  padding-top: 6px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-title {
  margin: 0;
  font-size: 48px;
  font-weight: 700;
  line-height: 0.98;
  color: var(--color-text);
  letter-spacing: -0.03em;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 2px;
}

.tab-button {
  border: none;
  background: transparent;
  padding: 0;
  font-family: var(--font-family-base);
  font-size: 18px;
  color: var(--color-text-soft);
  cursor: pointer;
  position: relative;
}

.tab-button.active {
  color: var(--color-text);
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -10px;
  height: 2px;
  background: var(--color-text);
}

.primary-button {
  border: none;
  border-radius: 16px;
  background: var(--color-primary-600);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: 18px;
  font-weight: 700;
  padding: 16px 30px;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  min-width: 248px;
}

.primary-button:hover {
  background: var(--color-primary-700);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.overview-card {
  padding: 14px 10px 10px;
  border-radius: 18px;
}

.table-state {
  min-height: 96px;
  display: flex;
  align-items: center;
  color: var(--color-text-soft);
  font-size: var(--text-md);
}

.table-state-error {
  color: var(--color-danger);
}

.filters-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px 150px;
  gap: 10px;
  margin-bottom: 0;
}

.bulk-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: 14px;
  margin-bottom: 12px;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.bulk-action-count {
  color: var(--color-text);
  font-size: var(--text-md);
  font-weight: 600;
}

.bulk-delete-button {
  border: none;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: var(--text-sm);
  font-weight: 700;
  padding: 10px 16px;
  cursor: pointer;
  transition: filter var(--transition-fast), transform var(--transition-fast);
}

.bulk-delete-button:hover {
  filter: brightness(0.92);
}

.bulk-delete-button:active {
  transform: translateY(1px);
}

.search-field,
.select-field {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--color-text-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.search-input,
.select-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: 17px;
  outline: none;
  box-sizing: border-box;
  box-shadow: var(--shadow-sm);
}

.search-input {
  padding: 14px 16px 14px 42px;
}

.select-input {
  padding: 14px 40px 14px 14px;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--color-text-soft) 50%), linear-gradient(135deg, var(--color-text-soft) 50%, transparent 50%);
  background-position: calc(100% - 20px) 20px, calc(100% - 14px) 20px;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

.table-wrap {
  overflow: visible;
  border-radius: 14px;
  margin-top: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.scenarios-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
}

.scenarios-table thead th {
  text-align: left;
  color: var(--color-text-soft);
  font-size: var(--text-md);
  font-weight: 500;
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--color-border);
}

.scenarios-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-soft);
  font-size: var(--text-md);
  vertical-align: middle;
}

.scenarios-table tbody tr:last-child td {
  border-bottom: none;
}

.scenario-row:hover {
  background: var(--color-neutral-100);
}

.checkbox-col,
.actions-col {
  width: 1%;
  white-space: nowrap;
}

.checkbox-col {
  text-align: center;
  vertical-align: middle;
}

.checkbox {
  width: 24px;
  height: 24px;
  margin: 0;
  vertical-align: middle;
  accent-color: var(--color-primary-600);
  cursor: pointer;
}

.name-cell {
  color: var(--color-text);
  font-weight: 600;
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
  transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.actions-button:hover {
  background: var(--color-neutral-100);
}

.actions-button:active {
  transform: translateY(1px);
}

.actions-button-icon {
  width: 20px;
  height: 20px;
}

.actions-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  min-width: 198px;
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
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.actions-menu-item:hover {
  background: var(--color-neutral-100);
}

.actions-menu-item--danger {
  color: var(--color-danger);
}

.actions-menu-item--danger:hover {
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-surface));
}

.action-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  color: currentColor;
}

.empty-state {
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-soft);
  font-size: var(--text-md);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  color: var(--color-text-soft);
}

.pagination-button {
  border: none;
  background: transparent;
  color: inherit;
  font-family: var(--font-family-base);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}

.pagination-divider {
  width: 1px;
  height: 18px;
  background: var(--color-border);
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

.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
  background: color-mix(in srgb, var(--color-neutral-900) 52%, transparent);
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

.confirm-title {
  margin: 0 0 10px;
  color: var(--color-text);
  font-size: 24px;
  font-weight: 700;
}

.confirm-text {
  margin: 0;
  color: var(--color-text-soft);
  font-size: var(--text-md);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
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
  transition: background var(--transition-fast), color var(--transition-fast), filter var(--transition-fast);
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

.confirm-button--danger {
  background: var(--color-danger);
  color: var(--color-surface);
}

.confirm-button--danger:hover {
  filter: brightness(0.92);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
