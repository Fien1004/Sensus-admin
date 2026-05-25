<template>
  <main class="sessions-view">
    <header class="page-header">
      <div class="title-block">
        <h1 class="page-title">Sessies</h1>

        <nav class="tabs" aria-label="Sessies overzicht tabs">
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
    </header>

    <section class="card overview-card">
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
          <span class="sr-only">Scenario</span>
          <select v-model="selectedScenario" class="select-input">
            <option value="all">Scenario</option>
            <option v-for="opt in scenarioOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>

        <label class="select-field">
          <span class="sr-only">Datum</span>
          <select v-model="selectedDate" class="select-input">
            <option value="all">Datum</option>
            <option value="today">Vandaag</option>
            <option value="week">Deze week</option>
          </select>
        </label>
      </div>

      <div class="table-wrap">
        <table class="sessions-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" class="checkbox" aria-label="Selecteer alle sessies" />
              </th>
              <th>Naam/id</th>
              <th>Scenario</th>
              <th>Datum</th>
              <th>Start</th>
              <th>Einde</th>
              <th>Status</th>
              <th class="actions-col"></th>
            </tr>
          </thead>

          <tbody v-if="loading">
            <tr>
              <td colspan="8">
                <div class="empty-state">Sessies laden...</div>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="errorMessage">
            <tr>
              <td colspan="8">
                <div class="empty-state table-state-error">{{ errorMessage }}</div>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="filteredSessions.length">
            <tr v-for="item in filteredSessions" :key="item.id" class="session-row">
              <td class="checkbox-col">
                <input type="checkbox" class="checkbox" :aria-label="`Selecteer ${item.id}`" />
              </td>
              <td class="name-cell">{{ item.id }}</td>
              <td>{{ item.scenario }}</td>
              <td>{{ item.date }}</td>
              <td>{{ item.start }}</td>
              <td>{{ item.end }}</td>
              <td>
                <span :class="['status-badge', statusClass(item.status)]">{{ item.status }}</span>
              </td>
              <td class="actions-col">
                <button type="button" class="actions-button" aria-label="Acties">⋯</button>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="8">
                <div class="empty-state">Geen sessies gevonden.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <div></div>
        <div>
          <button type="button" class="pagination-button" :disabled="isPreviousDisabled" @click="goToPreviousPage">‹ Vorige</button>
          <span class="pagination-divider"></span>
          <button type="button" class="pagination-button" :disabled="isNextDisabled" @click="goToNextPage">Volgende ›</button>
        </div>
      </footer>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Sessies deze week</div>
          <div class="kpi-value">{{ kpi.sessionsThisWeek }}</div>
          <div class="kpi-meta">Op basis van live data</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Voltooid</div>
          <div class="kpi-value">{{ kpi.completedPct }}%</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Gem. sessie duur</div>
          <div class="kpi-value">{{ kpi.avgDuration }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Afhaak %</div>
          <div class="kpi-value">{{ kpi.dropoffPct }}%</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Offline %</div>
          <div class="kpi-value">{{ kpi.offlinePct }}%</div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '@/services/supabase'

const pageSize = 10
const loading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedScenario = ref('all')
const selectedDate = ref('all')
const activeTab = ref('all')
const currentPage = ref(1)
const sessions = ref([])

onMounted(() => {
  void loadSessions()
})

async function loadSessions() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [{ data: sessionsRaw, error: sessionsError }, { data: scenariosRaw, error: scenariosError }] = await Promise.all([
      supabase.from('sessions').select('*'),
      supabase.from('scenarios').select('*'),
    ])

    if (sessionsError) throw sessionsError
    if (scenariosError) throw scenariosError

    const scenarioMap = buildScenarioMap(Array.isArray(scenariosRaw) ? scenariosRaw : [])
    const rows = Array.isArray(sessionsRaw)
      ? sessionsRaw.map((record, index) => mapSessionRecord(record, index, scenarioMap))
      : []

    sessions.value = rows.sort((left, right) => right.sortStamp - left.sortStamp)
  } catch (error) {
    sessions.value = []
    errorMessage.value = error?.message || 'Sessies konden niet worden geladen.'
  } finally {
    loading.value = false
  }
}

function buildScenarioMap(scenarios) {
  const map = new Map()

  for (const scenario of scenarios) {
    const title = getScenarioTitle(scenario)
    const idCandidates = [scenario?.id, scenario?.scenario_id, scenario?.uuid, scenario?.slug].filter(Boolean)

    for (const key of idCandidates) {
      map.set(String(key), title)
    }
  }

  return map
}

function mapSessionRecord(record, index, scenarioMap) {
  const rawId = getFirstString(record, ['id', 'session_id', 'sessionId', 'uuid']) || `sessie-${index + 1}`
  const id = shortenId(rawId)

  const startDate = getFirstDate(record, ['started_at', 'start_at', 'start_time', 'created_at'])
  const endDate = getFirstDate(record, ['ended_at', 'end_at', 'end_time', 'updated_at'])
  const displayDate = startDate || endDate || getFirstDate(record, ['created_at'])

  const rawStatus = getFirstString(record, ['status', 'state'])
  const normalizedStatus = normalizeStatus(rawStatus)
  const isOffline = getOfflineState(record)

  const scenarioId = getFirstString(record, ['scenario_id', 'scenarioId'])
  const scenarioFromSession = getFirstString(record, ['scenario_title', 'scenario', 'title'])
  const scenario = scenarioFromSession || (scenarioId ? scenarioMap.get(String(scenarioId)) : '') || 'Onbekend scenario'

  return {
    id,
    scenario,
    date: formatDate(displayDate),
    start: formatTime(startDate),
    end: formatTime(endDate),
    status: normalizedStatus,
    statusKey: statusKeyFromLabel(normalizedStatus),
    isOffline,
    durationMinutes: calculateDurationMinutes(startDate, endDate),
    sessionDate: displayDate,
    sortStamp: displayDate?.getTime?.() || 0,
  }
}

function getScenarioTitle(scenario) {
  return getFirstString(scenario, ['title', 'name', 'display_name', 'slug']) || 'Onbekend scenario'
}

function getFirstString(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }

  return ''
}

function getFirstDate(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (!value) continue

    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }

  return null
}

function shortenId(id) {
  const text = String(id)
  return text.length > 8 ? text.slice(0, 8) : text
}

function normalizeStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()

  if (normalized === 'completed' || normalized === 'voltooid') return 'Voltooid'
  if (normalized === 'stopped' || normalized === 'gestopt') return 'Gestopt'
  if (normalized === 'active' || normalized === 'actief') return 'Actief'
  return 'Onbekend'
}

function statusKeyFromLabel(label) {
  if (label === 'Voltooid') return 'completed'
  if (label === 'Gestopt') return 'stopped'
  if (label === 'Actief') return 'active'
  return 'unknown'
}

function statusClass(statusLabel) {
  if (statusLabel === 'Voltooid') return 'status--done'
  if (statusLabel === 'Gestopt') return 'status--stopped'
  if (statusLabel === 'Actief') return 'status--active'
  return 'status--unknown'
}

function getOfflineState(record) {
  const booleanKeys = ['is_offline', 'offline']
  for (const key of booleanKeys) {
    if (typeof record?.[key] === 'boolean') return record[key]
  }

  const channel = getFirstString(record, ['mode', 'channel', 'session_type', 'type']).toLowerCase()
  if (!channel) return false
  return channel.includes('offline')
}

function formatDate(date) {
  if (!date) return 'Onbekende datum'
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function formatTime(date) {
  if (!date) return '--:--'
  return new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

function calculateDurationMinutes(startDate, endDate) {
  if (!startDate || !endDate) return null

  const diffMs = endDate.getTime() - startDate.getTime()
  if (diffMs <= 0) return null

  return Math.round(diffMs / 60000)
}

function isSameCalendarDay(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
}

function isInCurrentWeek(date) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = today.getDay() || 7
  const start = new Date(today)
  start.setDate(today.getDate() - day + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)

  return date >= start && date < end
}

const tabs = computed(() => {
  const all = sessions.value.length
  const active = sessions.value.filter((s) => s.statusKey === 'active').length
  const completed = sessions.value.filter((s) => s.statusKey === 'completed').length

  return [
    { key: 'all', label: `Alle sessies (${all})` },
    { key: 'active', label: `Actief (${active})` },
    { key: 'completed', label: `Voltooid (${completed})` },
  ]
})

const scenarioOptions = computed(() => [...new Set(sessions.value.map((s) => s.scenario))])

const filteredSessionsAll = computed(() => {
  let items = [...sessions.value]

  if (activeTab.value === 'active') {
    items = items.filter((s) => s.statusKey === 'active')
  }

  if (activeTab.value === 'completed') {
    items = items.filter((s) => s.statusKey === 'completed')
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    items = items.filter((s) => `${s.id} ${s.scenario}`.toLowerCase().includes(q))
  }

  if (selectedScenario.value !== 'all') {
    items = items.filter((s) => s.scenario === selectedScenario.value)
  }

  if (selectedDate.value === 'today') {
    const today = new Date()
    items = items.filter((s) => s.sessionDate && isSameCalendarDay(s.sessionDate, today))
  }

  if (selectedDate.value === 'week') {
    items = items.filter((s) => s.sessionDate && isInCurrentWeek(s.sessionDate))
  }

  return items
})

const totalPages = computed(() => {
  const totalItems = filteredSessionsAll.value.length
  return Math.max(1, Math.ceil(totalItems / pageSize))
})

const filteredSessions = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize

  return filteredSessionsAll.value.slice(start, end)
})

const isPreviousDisabled = computed(() => currentPage.value <= 1 || loading.value)
const isNextDisabled = computed(() => currentPage.value >= totalPages.value || loading.value)

function goToPreviousPage() {
  if (isPreviousDisabled.value) return
  currentPage.value -= 1
}

function goToNextPage() {
  if (isNextDisabled.value) return
  currentPage.value += 1
}

watch([searchQuery, selectedScenario, selectedDate, activeTab], () => {
  currentPage.value = 1
})

watch(filteredSessionsAll, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }

  if (currentPage.value < 1) {
    currentPage.value = 1
  }
})

const kpi = computed(() => {
  const all = sessions.value
  const total = all.length

  const completedCount = all.filter((s) => s.statusKey === 'completed').length
  const stoppedCount = all.filter((s) => s.statusKey === 'stopped').length
  const offlineCount = all.filter((s) => s.isOffline).length
  const thisWeekCount = all.filter((s) => s.sessionDate && isInCurrentWeek(s.sessionDate)).length

  const durationSource = all
    .map((s) => s.durationMinutes)
    .filter((value) => typeof value === 'number' && value >= 0)

  const avgDuration = durationSource.length
    ? `${Math.round(durationSource.reduce((sum, value) => sum + value, 0) / durationSource.length)} min`
    : '0 min'

  return {
    sessionsThisWeek: thisWeekCount,
    completedPct: total ? Math.round((completedCount / total) * 100) : 0,
    avgDuration,
    dropoffPct: total ? Math.round((stoppedCount / total) * 100) : 0,
    offlinePct: total ? Math.round((offlineCount / total) * 100) : 0,
  }
})
</script>

<style scoped>
.sessions-view {
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

.sessions-table {
  width: 100%;
  border-collapse: collapse;
}

.sessions-table thead th {
  text-align: left;
  color: #6d7280;
  font-size: 16px;
  font-weight: 500;
  padding: 16px 18px 14px;
  border-bottom: 1px solid #e3e7ef;
}

.sessions-table td {
  padding: 14px 18px;
  border-bottom: 1px solid #e3e7ef;
  color: #6d7280;
  font-size: 16px;
  vertical-align: middle;
}

.session-row:hover {
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

.status-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
}

.status--done {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-success);
}

.status--stopped {
  background: rgba(239, 68, 68, 0.08);
  color: var(--color-danger);
}

.status--active {
  background: rgba(0, 119, 255, 0.12);
  color: var(--color-info);
}

.status--unknown {
  background: rgba(108, 117, 125, 0.12);
  color: var(--color-neutral-700);
}

.table-state-error {
  color: var(--color-danger);
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
  justify-content: space-between;
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

.pagination-button:disabled {
  opacity: 0.45;
  cursor: default;
}

.pagination-divider {
  width: 1px;
  height: 18px;
  background: var(--color-border);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px;
  box-shadow: var(--shadow-sm);
}

.kpi-label {
  color: var(--color-neutral-700);
  font-size: 14px;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary-600);
}

.kpi-meta {
  color: var(--color-success);
  font-size: 13px;
  margin-top: 8px;
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
