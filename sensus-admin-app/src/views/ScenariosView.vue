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

        <div class="table-wrap">
          <table class="scenarios-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input type="checkbox" class="checkbox" aria-label="Selecteer alle scenario’s" />
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
              <tr v-for="scenario in filteredScenarios" :key="scenario.id" class="scenario-row">
                <td class="checkbox-col">
                  <input type="checkbox" class="checkbox" :aria-label="`Selecteer ${scenario.name}`" :checked="scenario.selected" @change="toggleSelection(scenario.id)" />
                </td>
                <td class="name-cell">{{ scenario.name }}</td>
                <td>{{ scenario.theme }}</td>
                <td>{{ scenario.date }}</td>
                <td>{{ scenario.sessions }}</td>
                <td>
                  <label class="switch" :title="scenario.is_active ? 'Actief' : 'Concept'">
                    <input type="checkbox" :checked="scenario.is_active" @change="toggleScenarioStatus(scenario)" />
                    <span class="switch-track" aria-hidden="true">
                      <span class="switch-thumb"></span>
                    </span>
                    <span class="sr-only">{{ scenario.is_active ? 'Actief' : 'Concept' }}</span>
                  </label>
                </td>
                <td class="actions-col">
                  <button type="button" class="actions-button" aria-label="Acties voor scenario">⋯</button>
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
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'

const loading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedTheme = ref('all')
const selectedStatus = ref('all')
const activeTab = ref('all')
const scenarioItems = ref([])
const router = useRouter()

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

onMounted(() => {
  void loadScenarios()
})

function goToCreateScenario() {
  router.push('/scenarios/new')
}

async function loadScenarios() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase.from('scenarios').select('*')

    if (error) throw error

    const rows = Array.isArray(data) ? data.map((record, index) => mapScenarioRecord(record, index)) : []

    scenarioItems.value = rows.sort((left, right) => right.sortStamp - left.sortStamp)
  } catch (error) {
    scenarioItems.value = []
    errorMessage.value = error?.message || 'Scenario’s konden niet worden geladen.'
  } finally {
    loading.value = false
  }
}

function mapScenarioRecord(record, index) {
  const name = getFirstString(record, ['title', 'name', 'display_name', 'scenario_name']) || 'Onbekend scenario'
  const theme = getFirstString(record, ['theme', 'theme_name', 'category', 'subject']) || 'Onbekend thema'
  const date = formatDateValue(getFirstString(record, ['date', 'created_at', 'updated_at', 'start_date', 'published_at']))
  const sessions = getFirstNumber(record, ['sessions', 'session_count', 'sessionCount', 'number_of_sessions']) ?? 0
  const isActive = getScenarioStatus(record)

  return {
    id: record?.id ?? record?.scenario_id ?? record?.scenarioId ?? record?.uuid ?? record?.slug ?? `${index}-${name}`,
    name,
    theme,
    date,
    sessions,
    active: isActive,
    is_active: isActive,
    selected: false,
    sortStamp: getSortStamp(record),
  }
}

function getSortStamp(record) {
  const dateValue = getFirstString(record, ['created_at', 'updated_at', 'date', 'start_date', 'published_at'])
  const date = dateValue ? new Date(dateValue) : null

  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
}

function formatDateValue(value) {
  if (!value) return 'Onbekende datum'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return dateFormatter.format(date)
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

function toggleSelection(id) {
  scenarioItems.value = scenarioItems.value.map((scenario) => {
    if (scenario.id !== id) return scenario

    return {
      ...scenario,
      selected: !scenario.selected,
    }
  })
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
  color: var(--color-neutral-900);
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
  color: var(--color-neutral-800);
  cursor: pointer;
  position: relative;
}

.tab-button.active {
  color: var(--color-neutral-900);
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -10px;
  height: 2px;
  background: var(--color-neutral-900);
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
  box-shadow: 0 6px 16px rgba(165, 10, 126, 0.18);
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

.search-field,
.select-field {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--color-neutral-700);
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
  color: var(--color-neutral-900);
  font-family: var(--font-family-base);
  font-size: 17px;
  outline: none;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.search-input {
  padding: 14px 16px 14px 42px;
}

.select-input {
  padding: 14px 40px 14px 14px;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--color-neutral-700) 50%), linear-gradient(135deg, var(--color-neutral-700) 50%, transparent 50%);
  background-position: calc(100% - 20px) 20px, calc(100% - 14px) 20px;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

.table-wrap {
  overflow: hidden;
  border-radius: 14px;
  margin-top: 12px;
  border: 1px solid var(--color-border);
}

.scenarios-table {
  width: 100%;
  border-collapse: collapse;
}

.scenarios-table thead th {
  text-align: left;
  color: #6d7280;
  font-size: 16px;
  font-weight: 500;
  padding: 16px 18px 14px;
  border-bottom: 1px solid #e3e7ef;
}

.scenarios-table td {
  padding: 14px 18px;
  border-bottom: 1px solid #e3e7ef;
  color: #6d7280;
  font-size: 16px;
  vertical-align: middle;
}

.scenario-row:hover {
  background: #fafbfe;
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
  color: #4b5563;
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
  background: #d1d5db;
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
  background: #0f5a78;
}

.switch input:checked + .switch-track .switch-thumb {
  transform: translateX(22px);
}

.actions-button {
  border: none;
  background: transparent;
  color: #111827;
  font-size: 26px;
  line-height: 1;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.actions-button:hover {
  background: var(--color-neutral-100);
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
  color: #6b7280;
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
