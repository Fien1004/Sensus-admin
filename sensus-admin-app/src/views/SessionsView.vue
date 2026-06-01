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

    <section class="kpi-grid" aria-label="Sessie KPI overzicht">
      <article class="card kpi-card">
        <div class="kpi-label">Sessies deze week</div>
        <div class="kpi-value">{{ kpi.sessionsThisWeek }}</div>
        <div class="kpi-meta">Op basis van live data</div>
      </article>

      <article class="card kpi-card">
        <div class="kpi-label">Voltooid</div>
        <div class="kpi-value">{{ kpi.completedPct }}%</div>
      </article>

      <article class="card kpi-card">
        <div class="kpi-label">Gem. sessie duur</div>
        <div class="kpi-value">{{ kpi.avgDuration }}</div>
      </article>

      <article class="card kpi-card">
        <div class="kpi-label">Afhaak %</div>
        <div class="kpi-value">{{ kpi.dropoffPct }}%</div>
      </article>

      <article class="card kpi-card">
        <div class="kpi-label">Offline %</div>
        <div class="kpi-value">{{ kpi.offlinePct }}%</div>
      </article>
    </section>

    <section class="card overview-card">
      <header class="section-header">
        <div>
          <h2 class="section-title">Recente sessies</h2>
          <p class="section-description">Filter en zoek door de laatste sessies.</p>
        </div>
      </header>

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
          <select v-model="selectedScenario" class="select-input scenario-select">
            <option value="all">Alle scenario’s</option>
            <option v-for="scenario in scenarioOptions" :key="scenario.slug" :value="scenario.slug">{{ mapScenario(scenario.slug) }}</option>
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

      <div v-if="selectedSessionIds.length" class="bulk-action-bar" role="status">
        <span class="bulk-action-count">{{ selectedSessionIds.length }} sessies geselecteerd</span>
        <button type="button" class="bulk-delete-button" :disabled="isActionBusy" @click="openBulkDeleteModal">Verwijderen</button>
      </div>

      <div class="table-wrap">
        <table class="sessions-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input
                  ref="headerCheckboxRef"
                  type="checkbox"
                  class="checkbox"
                  aria-label="Selecteer alle zichtbare sessies"
                  :checked="allVisibleSelected"
                  :aria-checked="hasPartialSelection ? 'mixed' : allVisibleSelected ? 'true' : 'false'"
                  @click.stop
                  @change="toggleSelectAllVisible"
                />
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
                <ErrorState type="api" />
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="filteredSessions.length">
            <tr v-for="item in filteredSessions" :key="item.id" class="session-row">
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  class="checkbox"
                  :aria-label="`Selecteer ${item.shortId}`"
                  :checked="selectedSessionIds.includes(item.id)"
                  @click.stop
                  @change="toggleSelection(item.id)"
                />
              </td>
              <td class="name-cell">{{ item.shortId }}</td>
              <td>{{ item.scenario }}</td>
              <td>{{ item.date }}</td>
              <td>{{ item.start }}</td>
              <td>{{ item.end }}</td>
              <td>
                <span :class="['status-badge', statusClass(item.status)]">{{ item.status }}</span>
              </td>
              <td class="actions-col">
                <div class="actions-menu-wrap">
                  <button
                    type="button"
                    class="actions-button"
                    aria-label="Acties"
                    aria-haspopup="menu"
                    :aria-expanded="openActionMenuId === item.id"
                    @click.stop="toggleActionMenu(item.id)"
                  >
                    ⋯
                  </button>

                  <div v-if="openActionMenuId === item.id" class="actions-menu" role="menu" :aria-label="`Acties voor ${item.id}`">
                    <button type="button" class="actions-menu-item" role="menuitem" @click="handleViewSession(item)">Bekijken</button>
                    <button type="button" class="actions-menu-item" role="menuitem" @click="closeActionMenu">Exporteren</button>
                    <button type="button" class="actions-menu-item actions-menu-item--danger" role="menuitem" @click="closeActionMenu">Verwijderen</button>
                  </div>
                </div>
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
        <button type="button" class="pagination-button" :disabled="isPreviousDisabled" @click="goToPreviousPage">‹ Vorige</button>
        <span class="pagination-divider"></span>
        <button type="button" class="pagination-button" :disabled="isNextDisabled" @click="goToNextPage">Volgende ›</button>
      </footer>
    </section>

    <section class="card overview-card analytics-card">
      <header class="section-header">
        <div>
          <h2 class="section-title">Scenario prestaties</h2>
          <p class="section-description">De verdeling per scenario op basis van de huidige selectie.</p>
        </div>

        <div class="section-badge">{{ warningText }}</div>
      </header>

      <div class="table-wrap analytics-table-wrap">
        <table class="sessions-table analytics-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Sessies</th>
              <th>Voltooid %</th>
              <th>Gem. duur</th>
              <th>Afhaak %</th>
            </tr>
          </thead>

          <tbody v-if="loading">
            <tr>
              <td colspan="5">
                <div class="empty-state">Scenario prestaties laden...</div>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="scenarioPerformanceRows.length">
            <tr v-for="row in scenarioPerformanceRows" :key="row.key">
              <td class="scenario-name-cell">{{ row.label }}</td>
              <td>{{ row.sessions }}</td>
              <td>{{ row.completedPct }}%</td>
              <td>{{ row.avgDuration }}</td>
              <td>{{ row.dropoffPct }}%</td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="5">
                <div class="empty-state">Geen scenario’s gevonden.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Drawer
      :open="Boolean(selectedSession)"
      title="Sessie bekijken"
      :subtitle="selectedSession ? `${selectedSession.id} · ${selectedSession.scenario}` : ''"
      @close="closeSessionDrawer"
    >
      <div v-if="selectedSession" class="drawer-stack">
        <section class="drawer-section">
          <div class="drawer-section-header">
            <h3 class="drawer-section-title">Algemene informatie</h3>
          </div>

          <dl class="detail-grid detail-grid--two">
            <div v-for="item in selectedSessionDetails.general" :key="item.label" class="detail-item">
              <dt>{{ item.label }}</dt>
              <dd :class="item.emphasis ? 'detail-value detail-value--emphasis' : 'detail-value'">{{ item.value }}</dd>
            </div>
          </dl>
        </section>

        <section class="drawer-section">
          <div class="drawer-section-header">
            <h3 class="drawer-section-title">Gebruikersinformatie</h3>
          </div>

          <dl class="detail-grid detail-grid--three">
            <div v-for="item in selectedSessionDetails.user" :key="item.label" class="detail-item">
              <dt>{{ item.label }}</dt>
              <dd class="detail-value">{{ item.value }}</dd>
            </div>
          </dl>
        </section>

        <section class="drawer-section">
          <div class="drawer-section-header">
            <h3 class="drawer-section-title">Scenario verloop</h3>
          </div>

          <div v-if="isSessionEventsLoading" class="empty-state">Antwoorden laden...</div>

          <div v-else-if="sessionEventsError" class="empty-state table-state-error">{{ sessionEventsError }}</div>

          <div v-else-if="selectedSessionDetails.events.length">
            <ol class="step-list">
              <li v-for="(event, index) in selectedSessionDetails.events" :key="`${event.stepId}-${event.type}-${index}`" class="step-list-item">
                <div class="step-list-badge">{{ event.stepId }}</div>
                <div class="step-list-body">
                  <div class="step-list-title">{{ event.type }}</div>
                  <div class="step-list-answer"><span>Antwoord:</span> {{ event.value }}</div>
                  <div v-if="event.time" class="step-list-time">{{ event.time }}</div>
                </div>
              </li>
            </ol>
          </div>

          <div v-else class="empty-state">Geen antwoorden gevonden.</div>
        </section>

        <section class="drawer-section">
          <div class="drawer-section-header">
            <h3 class="drawer-section-title">Reflectie</h3>
          </div>

          <p class="drawer-copy">{{ selectedSessionDetails.reflection }}</p>
        </section>

      </div>
    </Drawer>

    <div v-if="toastMessage" class="toast" role="status" aria-live="polite">{{ toastMessage }}</div>

    <div v-if="confirmModal.open" class="confirm-backdrop" @click.self="closeConfirmModal">
      <div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <h2 id="confirm-title" class="confirm-title">{{ confirmModal.title }}</h2>
        <p id="confirm-description" class="confirm-text">{{ confirmModal.message }}</p>

        <div class="confirm-actions">
          <button type="button" class="confirm-button confirm-button--ghost" :disabled="isActionBusy" @click="closeConfirmModal">Annuleren</button>
          <button type="button" class="confirm-button confirm-button--danger" :disabled="isActionBusy" @click="confirmDeletion">Verwijderen</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Drawer from '@/components/Drawer.vue'
import ErrorState from '@/components/ErrorState.vue'
import { supabase } from '@/services/supabase'
import { formatDate as formatDateInBrussels } from '@/utils/dateFormatter'
import { formatDuration } from '@/utils/formatDuration'
import { mapStepsForLoad } from '@/utils/scenarioStepModel'

const pageSize = 10
const loading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedScenario = ref('all')
const selectedDate = ref('all')
const activeTab = ref('all')
const currentPage = ref(1)
const sessions = ref([])
const scenarios = ref([])
const reflections = ref([])
const analyticsRows = ref([])
const openActionMenuId = ref(null)
const selectedSession = ref(null)
const selectedSessionEvents = ref([])
const isSessionEventsLoading = ref(false)
const sessionEventsError = ref('')
const selectedSessionIds = ref([])
const headerCheckboxRef = ref(null)
const toastMessage = ref('')
const isActionBusy = ref(false)
const confirmModal = ref({
  open: false,
  title: '',
  message: '',
})
let sessionsChannel = null
let toastTimeoutId = null

onMounted(() => {
  void fetchSessions()

  sessionsChannel = supabase
    .channel('sessions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
      },
      () => {
        void fetchSessions()
      }
    )
    .subscribe()

    window.addEventListener('click', handleWindowClick)
})

onUnmounted(() => {
    window.removeEventListener('click', handleWindowClick)

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId)
  }

  if (sessionsChannel) {
    void supabase.removeChannel(sessionsChannel)
    sessionsChannel = null
  }
})

watch(selectedScenario, () => {
  if (!selectedScenario.value || selectedScenario.value === 'all') return
  void loadScenarioDetails()
})

async function fetchSessions() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [{ data: sessionsRaw, error: sessionsError }, { data: scenariosRaw, error: scenariosError }] = await Promise.all([
      supabase.from('sessions').select('*').order('started_at', { ascending: false }),
      supabase.from('scenarios').select('*'),
    ])

    if (sessionsError) throw sessionsError
    if (scenariosError) throw scenariosError

    scenarios.value = Array.isArray(scenariosRaw) ? scenariosRaw : []

    const rows = Array.isArray(sessionsRaw)
      ? sessionsRaw.map((record, index) => mapSessionRecord(record, index))
      : []

    sessions.value = rows.sort((left, right) => right.sortStamp - left.sortStamp)
  } catch (error) {
    sessions.value = []
    scenarios.value = []
    reflections.value = []
    analyticsRows.value = []
    errorMessage.value = 'De data kon niet geladen worden. Probeer opnieuw.'
  } finally {
    loading.value = false
  }
}

function mapScenario(scenarioId) {
  const scenario = scenarios.value.find((item) => String(item.slug) === String(scenarioId))
  return scenario?.title || 'Onbekend scenario'
}

async function loadScenarioDetails() {
  if (!selectedScenario.value) return

  try {
    const [reflectionRows, analyticsData] = await Promise.all([
      loadReflectionsForScenario(selectedScenario.value),
      loadScenarioAnalytics(selectedScenario.value),
    ])

    reflections.value = reflectionRows
    analyticsRows.value = analyticsData
  } catch (error) {
    reflections.value = []
    analyticsRows.value = []
    errorMessage.value = error?.message || 'Inzichten konden niet worden geladen.'
  }
}

async function loadReflectionsForScenario(scenarioSlug) {
  const { data, error } = await safeSelectTable('reflections')
  if (error) throw error

  const rows = Array.isArray(data) ? data : []
  return rows.filter((record) => recordMatchesScenario(record, scenarioSlug)).map(mapReflection)
}

async function loadScenarioAnalytics(scenarioSlug) {
  const { data, error } = await safeSelectTable('scenario_analytics')
  if (error) throw error

  const rows = Array.isArray(data) ? data : []
  return rows.filter((record) => recordMatchesScenario(record, scenarioSlug))
}

async function safeSelectTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')

  if (error) {
    const message = String(error.message || '').toLowerCase()
    if (message.includes('does not exist') || message.includes('could not find')) {
      return { data: [], error: null }
    }
  }

  return { data, error }
}

function recordMatchesScenario(record, scenarioSlug) {
  if (!scenarioSlug) return false

  const scenarioId = getFirstString(record, ['scenario_id', 'scenarioId'])
  if (scenarioId && String(scenarioId) === String(scenarioSlug)) return true

  const slug = getFirstString(record, ['scenario_slug', 'slug'])
  if (slug && normalizeText(slug) === normalizeText(scenarioSlug)) return true

  return false
}

function mapReflection(record, index) {
  const rawDate = getFirstDate(record, ['created_at', 'date', 'reflection_date', 'submitted_at'])

  return {
    id: getFirstString(record, ['user_id', 'id', 'reflection_id']) || `r-${index + 1}`,
    date: formatDate(rawDate),
    age: getFirstNumber(record, ['age', 'user_age']) ?? 'Onbekend',
    gender: getFirstString(record, ['gender', 'user_gender']) || 'Onbekend',
    text: getFirstString(record, ['text', 'reflection', 'content', 'message']) || 'Onbekend',
  }
}

function extractStepAnalytics(rows) {
  if (!rows.length) return []

  const nestedRow = rows.find((row) => Array.isArray(row.step_analytics) || Array.isArray(row.steps) || Array.isArray(row.dropoff_steps))
  if (nestedRow) {
    const nested = nestedRow.step_analytics || nestedRow.steps || nestedRow.dropoff_steps || []

    return nested
      .map((item, index) => ({
        key: `step-analytics-${index}`,
        title: getFirstString(item, ['title', 'label', 'step']) || `Stap ${index + 1}`,
        desc: getFirstString(item, ['desc', 'description']) || 'Onbekend',
        padA: clampPercent(getFirstNumber(item, ['pad_a', 'path_a', 'a', 'padA']) ?? 0),
        padB: clampPercent(getFirstNumber(item, ['pad_b', 'path_b', 'b', 'padB']) ?? 0),
        drop: clampPercent(getFirstNumber(item, ['drop', 'dropoff', 'afhaak']) ?? 0),
      }))
      .filter((item) => item.title)
  }

  return rows
    .map((row, index) => ({
      key: `step-row-${index}`,
      title: getFirstString(row, ['title', 'label', 'step']) || `Stap ${index + 1}`,
      desc: getFirstString(row, ['desc', 'description']) || 'Onbekend',
      padA: clampPercent(getFirstNumber(row, ['pad_a', 'path_a', 'a', 'padA']) ?? 0),
      padB: clampPercent(getFirstNumber(row, ['pad_b', 'path_b', 'b', 'padB']) ?? 0),
      drop: clampPercent(getFirstNumber(row, ['drop', 'dropoff', 'afhaak']) ?? 0),
    }))
    .filter((item) => item.title)
}

function deriveStepsFromSessions(sessionRows) {
  const groups = new Map()

  for (const session of sessionRows) {
    const rawStep = getFirstString(session, ['step', 'current_step', 'session_step', 'stage'])
    const key = rawStep || 'Stap 1'

    if (!groups.has(key)) {
      groups.set(key, { total: 0, a: 0, b: 0, drop: 0 })
    }

    const group = groups.get(key)
    group.total += 1

    const path = normalizePath(session.path)
    if (path === 'A') group.a += 1
    if (path === 'B') group.b += 1
    if (session.statusKey === 'stopped') group.drop += 1
  }

  const entries = Array.from(groups.entries())
  entries.sort((left, right) => normalizeStepOrder(left[0]) - normalizeStepOrder(right[0]))

  if (!entries.length) {
    const total = sessionRows.length || 1
    const aCount = sessionRows.filter((session) => normalizePath(session.path) === 'A').length
    const bCount = sessionRows.filter((session) => normalizePath(session.path) === 'B').length
    const dropCount = sessionRows.filter((session) => session.statusKey === 'stopped').length

    return [
      {
        key: 'step-fallback',
        title: 'Stap 1',
        desc: 'Onbekend',
        padA: Math.round((aCount / total) * 100),
        padB: Math.round((bCount / total) * 100),
        drop: Math.round((dropCount / total) * 100),
      },
    ]
  }

  return entries.map(([stepKey, value], index) => {
    const total = value.total || 1
    return {
      key: `step-session-${stepKey}-${index}`,
      title: `Stap ${index + 1}`,
      desc: String(stepKey),
      padA: Math.round((value.a / total) * 100),
      padB: Math.round((value.b / total) * 100),
      drop: Math.round((value.drop / total) * 100),
    }
  })
}

function calculatePathBreakdown(key, label, sessionRows) {
  const total = sessionRows.length || 1
  const aCount = sessionRows.filter((session) => normalizePath(session.path) === 'A').length
  const bCount = sessionRows.filter((session) => normalizePath(session.path) === 'B').length
  const dropCount = sessionRows.filter((session) => session.statusKey === 'stopped').length

  return {
    key,
    label,
    padA: Math.round((aCount / total) * 100),
    padB: Math.round((bCount / total) * 100),
    drop: Math.round((dropCount / total) * 100),
  }
}

function normalizePath(path) {
  const value = normalizeText(path)
  if (!value) return ''
  if (value === 'a' || value.includes('pad a') || value.includes('path a')) return 'A'
  if (value === 'b' || value.includes('pad b') || value.includes('path b')) return 'B'
  return ''
}

function normalizeGender(gender) {
  const value = normalizeText(gender)
  if (!value) return 'unknown'
  return value
}

function normalizeStepOrder(stepValue) {
  const number = Number(String(stepValue).replace(/[^0-9]/g, ''))
  if (!Number.isNaN(number) && number > 0) return number
  return Number.MAX_SAFE_INTEGER
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function getFirstNumber(source, keys) {
  for (const key of keys) {
    const value = source?.[key]

    if (typeof value === 'number' && !Number.isNaN(value)) return value

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.replace(',', '.'))
      if (!Number.isNaN(parsed)) return parsed
    }
  }

  return null
}

function mapSessionRecord(record, index) {
  const rawId = getFirstString(record, ['id', 'session_id', 'sessionId', 'uuid']) || `sessie-${index + 1}`

  const startDate = getFirstDate(record, ['started_at', 'start_time'])
  const endDate = getFirstDate(record, ['ended_at', 'end_time'])
  const displayDate = startDate || getFirstDate(record, ['created_at']) || endDate
  const durationFromDatesMs = calculateDurationMs(startDate, endDate)

  const normalizedStatus = normalizeStatus(record)
  const isOffline = getOfflineState(record)

  const scenarioId = getFirstString(record, ['scenario_id'])
  const scenario = scenarioId ? mapScenario(scenarioId) : 'Onbekend scenario'

  return {
    id: rawId,
    shortId: shortenId(rawId),
    rawId,
    scenario,
    scenarioSlug: scenarioId || '',
    age: getFirstNumber(record, ['age']) ?? null,
    gender: normalizeGender(getFirstString(record, ['gender'])),
    accessCode: getFirstString(record, ['access_code', 'accessCode', 'code']) || '',
    date: formatDate(displayDate),
    start: formatTime(startDate),
    end: formatTime(endDate),
    status: normalizedStatus,
    statusKey: statusKeyFromLabel(normalizedStatus),
    isOffline,
    durationMs: getDurationMs(record, durationFromDatesMs),
    hasValidDurationWindow: typeof durationFromDatesMs === 'number' && durationFromDatesMs > 0,
    sessionDate: displayDate,
    sortStamp: displayDate?.getTime?.() || 0,
    reflectionText: getFirstString(record, ['reflection_text', 'reflectionText', 'reflection', 'user_reflection', 'reflection_message', 'message']),
    aiInput: getFirstString(record, ['ai_input', 'aiInput', 'input', 'user_input', 'prompt']),
    aiClassification: getFirstString(record, ['ai_classification', 'aiClassification', 'classification', 'ai_label']),
    nextStep: getFirstString(record, ['selected_next_step', 'next_step', 'nextStep', 'recommended_next_step']),
    raw: record,
  }
}

function formatTimelineTime(date) {
  if (!date) return ''

  return formatDateInBrussels(date)
}

function getScenarioTitle(scenario) {
  return getFirstString(scenario, ['title']) || 'Onbekend scenario'
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

function normalizeStatus(record) {
  const completed = getFirstBoolean(record, ['completed'])
  const normalized = String(getFirstString(record, ['status', 'state']) || '').trim().toLowerCase()
  const stoppedReason = getFirstString(record, ['stopped_reason'])

  if (completed || normalized === 'completed' || normalized === 'voltooid') return 'Voltooid'
  if (normalized === 'active' || normalized === 'actief') return 'Actief'
  if (normalized === 'stopped' || normalized === 'gestopt' || stoppedReason) return 'Gestopt'
  return 'Onbekend'
}

function getFirstBoolean(source, keys) {
  for (const key of keys) {
    const value = source?.[key]

    if (typeof value === 'boolean') return value

    if (typeof value === 'number') {
      if (value === 1) return true
      if (value === 0) return false
    }

    if (typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toLowerCase()
      if (['true', '1', 'yes', 'y'].includes(normalized)) return true
      if (['false', '0', 'no', 'n'].includes(normalized)) return false
    }
  }

  return false
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
  return formatDateInBrussels(date)
}

function formatTime(date) {
  if (!date) return '--:--'
  return formatDateInBrussels(date)
}

function calculateDurationMs(startDate, endDate) {
  if (!startDate || !endDate) return null

  const diffMs = endDate.getTime() - startDate.getTime()
  if (diffMs <= 0) return null

  return diffMs
}

function getDurationMs(record, durationFromDatesMs) {
  const durationSeconds = getFirstNumber(record, ['duration', 'duration_seconds'])

  if (typeof durationSeconds === 'number' && durationSeconds > 0) {
    return durationSeconds * 1000
  }

  return durationFromDatesMs
}

function getDurationMinutes(record, startDate, endDate) {
  const durationMs = getDurationMs(record, calculateDurationMs(startDate, endDate))

  if (typeof durationMs === 'number' && durationMs >= 0) {
    return durationMs / 60000
  }

  return 0
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
  const all = scenarioSessions.value.length
  const active = scenarioSessions.value.filter((s) => s.statusKey === 'active').length
  const completed = scenarioSessions.value.filter((s) => s.statusKey === 'completed').length

  return [
    { key: 'all', label: `Alle sessies (${all})` },
    { key: 'active', label: `Actief (${active})` },
    { key: 'completed', label: `Voltooid (${completed})` },
  ]
})

const scenarioOptions = computed(() => scenarios.value)

const scenarioSessions = computed(() => {
  if (selectedScenario.value === 'all') return sessions.value
  if (!selectedScenario.value) return []

  return sessions.value.filter((session) => session.scenarioSlug === selectedScenario.value)
})

const filteredSessionsAll = computed(() => {
  let items = [...scenarioSessions.value]

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
  const all = scenarioSessions.value
  const total = all.length

  const completedCount = all.filter((s) => s.statusKey === 'completed').length
  const stoppedCount = all.filter((s) => s.statusKey === 'stopped').length
  const thisWeekCount = all.filter((s) => s.sessionDate && isInCurrentWeek(s.sessionDate)).length

  const durationSource = all
    .filter((s) => s.statusKey === 'completed' && s.hasValidDurationWindow)
    .map((s) => s.durationMs)
    .filter((value) => typeof value === 'number' && value > 0)

  const avgDuration = durationSource.length
    ? formatDuration(Math.round(durationSource.reduce((sum, value) => sum + value, 0) / durationSource.length))
    : formatDuration(0)

  return {
    sessionsThisWeek: thisWeekCount,
    completedPct: total ? Math.round((completedCount / total) * 100) : 0,
    avgDuration,
    dropoffPct: total ? Math.round((stoppedCount / total) * 100) : 0,
    offlinePct: 0,
  }
})

const warningText = computed(() => {
  if (!scenarioSessions.value.length) {
    return 'Geen sessiedata beschikbaar voor dit scenario'
  }

  return `Afhaak ligt op ${kpi.value.dropoffPct}% voor dit scenario`
})

const behaviorSummary = computed(() => {
  const pathCounts = scenarioSessions.value.reduce((acc, session) => {
    const pathKey = normalizePath(session.path)
    if (pathKey === 'A') acc.a += 1
    if (pathKey === 'B') acc.b += 1
    return acc
  }, { a: 0, b: 0 })

  const total = pathCounts.a + pathCounts.b
  const aPct = total ? Math.round((pathCounts.a / total) * 100) : 0
  const bPct = total ? Math.round((pathCounts.b / total) * 100) : 0

  const mostPopularPath = bPct >= aPct ? 'B' : 'A'
  const leastPopularPath = bPct >= aPct ? 'A' : 'B'
  const mostPopularPct = Math.max(aPct, bPct)
  const leastPopularPct = Math.min(aPct, bPct)

  return {
    mostPopularPath,
    leastPopularPath,
    mostPopularPct,
    leastPopularPct,
    note: total
      ? `${mostPopularPct}% kiest pad ${mostPopularPath} in dit scenario`
      : 'Nog geen padgegevens beschikbaar',
  }
})

const scenarioPerformanceRows = computed(() => {
  const groups = new Map()

  for (const session of scenarioSessions.value) {
    const key = session.scenarioSlug || session.scenario || session.id
    const label = session.scenario || 'Onbekend scenario'

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label,
        sessions: 0,
        completed: 0,
        dropped: 0,
        durationTotal: 0,
        durationCount: 0,
      })
    }

    const group = groups.get(key)
    group.sessions += 1

    if (session.statusKey === 'completed') group.completed += 1
    if (session.statusKey === 'stopped') group.dropped += 1

    if (typeof session.durationMs === 'number' && session.durationMs >= 0) {
      group.durationTotal += session.durationMs
      group.durationCount += 1
    }
  }

  return Array.from(groups.values())
    .sort((left, right) => right.sessions - left.sessions)
    .map((group) => ({
      key: group.key,
      label: group.label,
      sessions: group.sessions,
      completedPct: group.sessions ? Math.round((group.completed / group.sessions) * 100) : 0,
      avgDuration: group.durationCount ? formatDuration(Math.round(group.durationTotal / group.durationCount)) : formatDuration(0),
      dropoffPct: group.sessions ? Math.round((group.dropped / group.sessions) * 100) : 0,
    }))
})

const genders = computed(() => {
  const defaults = [
    { key: 'men', label: 'Mannen', matcher: ['m', 'man', 'male', 'mannen'] },
    { key: 'women', label: 'Vrouwen', matcher: ['v', 'vrouw', 'female', 'vrouwen'] },
    { key: 'nonbinary', label: 'Non-binair', matcher: ['non-binary', 'nonbinary', 'nb'] },
    { key: 'prefer', label: 'Wil ik liever niet zeggen', matcher: [] },
  ]

  return defaults.map((group) => {
    const groupSessions = scenarioSessions.value.filter((session) => {
      if (group.key === 'prefer') {
        return !session.gender || session.gender === 'unknown'
      }

      return group.matcher.includes(session.gender)
    })

    return calculatePathBreakdown(group.key, group.label, groupSessions)
  })
})

const steps = computed(() => {
  const analyticSteps = extractStepAnalytics(analyticsRows.value)
  if (analyticSteps.length) return analyticSteps

  const sessionSteps = deriveStepsFromSessions(scenarioSessions.value)
  if (sessionSteps.length) return sessionSteps

  return [
    { key: 'step-1', title: 'Stap 1', desc: 'Onbekend', padA: 0, padB: 0, drop: 0 },
  ]
})

const selectedSessionDetails = computed(() => buildSessionDrawerDetails(selectedSession.value, selectedSessionEvents.value))
const visibleSessionIds = computed(() => filteredSessions.value.map((session) => session.id))
const allVisibleSelected = computed(() => visibleSessionIds.value.length > 0 && visibleSessionIds.value.every((id) => selectedSessionIds.value.includes(id)))
const hasPartialSelection = computed(() => visibleSessionIds.value.some((id) => selectedSessionIds.value.includes(id)) && !allVisibleSelected.value)

watch([allVisibleSelected, hasPartialSelection], () => {
  if (headerCheckboxRef.value) {
    headerCheckboxRef.value.indeterminate = hasPartialSelection.value
  }
}, { immediate: true })

watch(sessions, () => {
  if (!selectedSession.value) return

  const refreshedSession = sessions.value.find((session) => session.id === selectedSession.value.id)
  if (refreshedSession) {
    selectedSession.value = refreshedSession
  }

  selectedSessionIds.value = selectedSessionIds.value.filter((id) => sessions.value.some((session) => session.id === id))
})

watch(filteredSessions, () => {
  if (headerCheckboxRef.value) {
    headerCheckboxRef.value.indeterminate = hasPartialSelection.value
  }
})

function toggleActionMenu(sessionId) {
  openActionMenuId.value = openActionMenuId.value === sessionId ? null : sessionId
}

function toggleSelection(id) {
  if (selectedSessionIds.value.includes(id)) {
    selectedSessionIds.value = selectedSessionIds.value.filter((sessionId) => sessionId !== id)
    return
  }

  selectedSessionIds.value = [...selectedSessionIds.value, id]
}

function toggleSelectAllVisible() {
  const ids = visibleSessionIds.value

  if (!ids.length) return

  if (allVisibleSelected.value) {
    selectedSessionIds.value = selectedSessionIds.value.filter((id) => !ids.includes(id))
    return
  }

  selectedSessionIds.value = Array.from(new Set([...selectedSessionIds.value, ...ids]))
}

function closeActionMenu() {
  openActionMenuId.value = null
}

function handleViewSession(session) {
  void openSessionDrawer(session)
  closeActionMenu()
}

function openBulkDeleteModal() {
  if (!selectedSessionIds.value.length) return

  closeActionMenu()
  confirmModal.value = {
    open: true,
    title: 'Sessies verwijderen?',
    message: 'Weet je zeker dat je deze sessies wilt verwijderen? Deze actie kan niet ongedaan worden.',
  }
}

function closeConfirmModal() {
  confirmModal.value = {
    open: false,
    title: '',
    message: '',
  }
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

async function confirmDeletion() {
  if (!selectedSessionIds.value.length) {
    closeConfirmModal()
    return
  }

  isActionBusy.value = true

  try {
    const ids = [...selectedSessionIds.value]

    const [{ error: eventsError }, { error: sessionsError }] = await Promise.all([
      supabase.from('events').delete().in('session_id', ids),
      supabase.from('sessions').delete().in('id', ids),
    ])

    if (eventsError) throw eventsError
    if (sessionsError) throw sessionsError

    selectedSessionIds.value = []
    closeConfirmModal()
    showToast('Sessies verwijderd')
    await fetchSessions()
  } catch (error) {
    console.error(error)
    errorMessage.value = error?.message || 'Sessies verwijderen mislukt.'
  } finally {
    isActionBusy.value = false
  }
}

async function openSessionDrawer(session) {
  console.log('selected session', selectedSession)
  selectedSession.value = session
  selectedSessionEvents.value = []
  sessionEventsError.value = ''

  if (!session?.id) {
    return
  }

  isSessionEventsLoading.value = true

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    selectedSessionEvents.value = Array.isArray(data) ? data.map(mapSessionEvent) : []
  } catch (error) {
    selectedSessionEvents.value = []
    sessionEventsError.value = error?.message || 'Antwoorden konden niet worden geladen.'
  } finally {
    isSessionEventsLoading.value = false
  }
}

function closeSessionDrawer() {
  selectedSession.value = null
  selectedSessionEvents.value = []
  sessionEventsError.value = ''
}

function handleWindowClick(event) {
  if (!(event.target instanceof HTMLElement)) {
    closeActionMenu()
    return
  }

  if (event.target.closest('.actions-menu-wrap')) return

  closeActionMenu()
}

function buildSessionDrawerDetails(session, events) {
  if (!session) {
    return {
      general: [],
      user: [],
      events: [],
      reflection: 'Geen antwoorden gevonden.',
    }
  }

  const rawId = session.rawId || session.id
  const durationValue = typeof session.durationMs === 'number' && session.durationMs >= 0 ? formatDuration(session.durationMs) : '0 sec'
  const mappedEvents = Array.isArray(events) ? events : []
  const reflectionEvents = mappedEvents.filter((event) => normalizeText(event.type) === 'reflection')
  const reflection = reflectionEvents.length
    ? reflectionEvents.map((event) => formatReflectionLine(event)).join('\n\n')
    : 'Geen antwoorden gevonden.'

  return {
    general: [
      { label: 'Sessie ID', value: rawId || 'Onbekend' },
      { label: 'Scenario naam', value: session.scenario || 'Onbekend scenario' },
      { label: 'Status', value: session.status, emphasis: true },
      { label: 'Datum', value: session.date || 'Onbekend' },
      { label: 'Starttijd', value: session.start || '--:--' },
      { label: 'Eindtijd', value: session.end || '--:--' },
      { label: 'Totale duur', value: durationValue },
    ],
    user: [
      { label: 'Leeftijd', value: session.age ?? 'Onbekend' },
      { label: 'Geslacht', value: session.gender || 'Onbekend' },
      { label: 'Access code', value: session.accessCode || 'Onbekend' },
    ],
    events: mappedEvents.length ? mappedEvents : [],
    reflection,
  }
}

function mapSessionEvent(event) {
  return {
    stepId: getFirstString(event, ['step_id', 'stepId']) || 'Onbekend',
    type: getFirstString(event, ['type']) || 'Onbekend',
    value: getFirstString(event, ['value']) || 'Geen antwoord opgeslagen',
    time: formatTimelineTime(getFirstDate(event, ['created_at'])),
    sortStamp: getFirstDate(event, ['created_at'])?.getTime?.() || 0,
  }
}

function formatReflectionLine(event) {
  const value = event?.value || 'Geen antwoord opgeslagen'

  return value
}

function buildScenarioStepCatalog(session) {
  const scenario = scenarios.value.find((item) => normalizeText(item?.slug) === normalizeText(session.scenarioSlug))
  const engineJson = normalizeEngineJson(scenario?.engine_json)
  const steps = mapStepsForLoad(Array.isArray(engineJson.steps) ? engineJson.steps : [])

  const questionSteps = []
  const reflectionSteps = []
  const stepById = new Map()

  steps.forEach((step, index) => {
    const catalogStep = {
      id: getFirstString(step, ['id']) || `step-${index + 1}`,
      title: getStepTitle(step, index),
      type: getFirstString(step, ['type']) || 'question',
      choices: normalizeStepChoices(step),
      order: index,
    }

    stepById.set(normalizeText(catalogStep.id), catalogStep)

    if (catalogStep.type === 'reflection') {
      reflectionSteps.push(catalogStep)
      return
    }

    if (catalogStep.type === 'question') {
      questionSteps.push(catalogStep)
    }
  })

  return {
    questionSteps,
    reflectionSteps,
    stepById,
  }
}

function buildStepHistory(session, answerEntries, catalog) {
  const mappedRows = []

  if (catalog.questionSteps.length) {
    catalog.questionSteps.forEach((step, index) => {
      const match = findMatchingAnswerEntry(step, answerEntries, index)
      mappedRows.push({
        title: step.title,
        answer: resolveAnswerText(match, step),
        time: match?.time || '',
        sortStamp: match?.sortStamp ?? index,
      })
    })
  } else {
    answerEntries
      .filter((entry) => !entry.isReflection)
      .forEach((entry, index) => {
        mappedRows.push({
          title: entry.title || entry.stepId || `Stap ${index + 1}`,
          answer: resolveAnswerText(entry, null),
          time: entry.time || '',
          sortStamp: entry.sortStamp ?? index,
        })
      })
  }

  if (!mappedRows.length) {
    return [{ title: 'Geen antwoord opgeslagen', answer: 'Geen antwoord opgeslagen', time: '', sortStamp: 0 }]
  }

  return mappedRows.sort((left, right) => (left.sortStamp || 0) - (right.sortStamp || 0))
}

function resolveReflectionAnswer(session, answerEntries, catalog) {
  const rawReflection = getFirstString(session.raw, ['reflection_answer', 'reflectionAnswer', 'reflection_text', 'reflectionText', 'user_reflection', 'reflection_message'])
  if (rawReflection) return rawReflection

  const reflectionEntry = answerEntries.find((entry) => entry.isReflection || (entry.stepId && normalizeText(entry.stepId).startsWith('reflection')))
  if (reflectionEntry) return resolveAnswerText(reflectionEntry, catalog.reflectionSteps[0] || null)

  return 'Geen antwoord opgeslagen'
}

function extractSessionAnswerEntries(record) {
  const candidateArrays = [
    record?.answers,
    record?.responses,
    record?.scenario_progress,
    record?.flow,
    record?.events,
    record?.steps,
    record?.path,
  ]

  const source = candidateArrays.find((value) => Array.isArray(value))
  if (!source?.length) return []

  return source
    .map((item, index) => normalizeSessionAnswerEntry(item, index))
    .filter((item) => item.stepId || item.answer || item.title || item.isReflection)
    .sort((left, right) => (left.sortStamp || 0) - (right.sortStamp || 0))
}

function normalizeSessionAnswerEntry(item, index) {
  if (typeof item === 'string') {
    return {
      stepId: '',
      title: `Stap ${index + 1}`,
      answer: item.trim() || 'Geen antwoord opgeslagen',
      time: '',
      sortStamp: index,
      isReflection: false,
    }
  }

  const stepId = getFirstString(item, ['step_id', 'stepId', 'question_id', 'questionId', 'id', 'step', 'current_step', 'stage'])
  const reflectionAnswer = getFirstString(item, ['reflection_answer', 'reflectionAnswer', 'reflection_text', 'reflectionText'])
  const selectedOptionLabel = getFirstString(item, ['selected_option_label', 'option_label', 'choice_label', 'answer_label'])
  const title = getFirstString(item, ['title', 'label', 'step_title', 'question', 'name']) || stepId || `Stap ${index + 1}`
  const answer = reflectionAnswer || selectedOptionLabel || getFirstString(item, ['answer', 'response', 'selected_answer', 'value', 'choice', 'selected_choice', 'input', 'text', 'message']) || 'Geen antwoord opgeslagen'
  const timeSource = getFirstDate(item, ['created_at', 'timestamp', 'occurred_at', 'answered_at', 'time', 'date'])
  const isReflection = normalizeText(stepId).startsWith('reflection') || Boolean(reflectionAnswer) || normalizeText(getFirstString(item, ['type', 'kind', 'category'])) === 'reflection'

  return {
    stepId,
    title,
    answer,
    time: formatTimelineTime(timeSource),
    sortStamp: timeSource?.getTime?.() || getFirstNumber(item, ['progress', 'order', 'index', 'step_index', 'stepIndex']) || index,
    isReflection,
    raw: item,
  }
}

function findMatchingAnswerEntry(step, answerEntries, fallbackIndex) {
  const normalizedStepId = normalizeText(step.id)

  const directMatch = answerEntries.find((entry) => normalizeText(entry.stepId) === normalizedStepId)
  if (directMatch) return directMatch

  const titleMatch = answerEntries.find((entry) => normalizeText(entry.title) === normalizeText(step.title))
  if (titleMatch) return titleMatch

  const orderedMatch = answerEntries.filter((entry) => !entry.isReflection).find((entry) => Number(entry.sortStamp) === fallbackIndex)
  if (orderedMatch) return orderedMatch

  return null
}

function resolveAnswerText(entry, step) {
  if (!entry) return 'Geen antwoord opgeslagen'

  const directAnswer = normalizeAnswerText(entry.answer)
  if (!directAnswer) return 'Geen antwoord opgeslagen'

  const customInput = getFirstString(entry.raw, ['custom_input', 'customInput', 'free_text', 'freeText', 'input_text', 'inputText'])
  if (customInput) return customInput

  const selectedOptionLabel = getFirstString(entry.raw, ['selected_option_label', 'option_label', 'choice_label', 'answer_label'])
  if (selectedOptionLabel) return selectedOptionLabel

  if (!step?.choices?.length) return directAnswer

  const normalizedAnswer = normalizeText(directAnswer)
  const choiceByLabel = step.choices.find((choice) => normalizeText(choice.label) === normalizedAnswer)
  if (choiceByLabel?.label) return choiceByLabel.label

  const choiceByNext = step.choices.find((choice) => normalizeText(choice.next) === normalizedAnswer)
  if (choiceByNext?.label) return choiceByNext.label

  const choiceByValue = step.choices.find((choice) => normalizeText(choice.value) === normalizedAnswer)
  if (choiceByValue?.label) return choiceByValue.label

  return directAnswer
}

function normalizeAnswerText(value) {
  const text = String(value || '').trim()
  return text || ''
}

function buildScenarioStepChoice(choice) {
  return {
    label: getFirstString(choice, ['label', 'text', 'name']),
    next: getFirstString(choice, ['next', 'target', 'id']),
    value: getFirstString(choice, ['value', 'key', 'slug']),
  }
}

function normalizeStepChoices(step) {
  const sourceChoices = Array.isArray(step?.choices) ? step.choices : Array.isArray(step?.options) ? step.options : []
  return sourceChoices.map((choice) => buildScenarioStepChoice(choice)).filter((choice) => choice.label || choice.next || choice.value)
}

function getStepTitle(step, index) {
  return getFirstString(step, ['title', 'question', 'label', 'description']) || `Stap ${index + 1}`
}

function normalizeEngineJson(value) {
  if (!value) return {}

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  if (typeof value === 'object') {
    return value
  }

  return {}
}
</script>

<style scoped>
.sessions-view {
  padding: 0 var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  padding: 18px;
  border-radius: 18px;
}

.analytics-card {
  padding-top: 18px;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.search-field {
  flex: 1;
  min-width: 220px;
}

.search-field,
.select-field {
  position: relative;
  display: flex;
  align-items: center;
}

.select-field {
  flex: 0 0 auto;
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
  width: 100%;
  padding: 14px 16px 14px 42px;
}

.select-input {
  width: fit-content;
  padding: 14px 40px 14px 14px;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--color-neutral-700) 50%), linear-gradient(135deg, var(--color-neutral-700) 50%, transparent 50%);
  background-position: calc(100% - 20px) 20px, calc(100% - 14px) 20px;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  white-space: nowrap;
}

.scenario-select {
  min-width: 180px;
  width: fit-content;
  max-width: 260px;
}

.select-field:last-child .select-input {
  width: 140px;
  min-width: 140px;
  max-width: 140px;
}

.table-wrap {
  overflow: visible;
  border-radius: 14px;
  margin-top: 0;
  border: 1px solid var(--color-border);
}

.analytics-table-wrap {
  margin-top: 0;
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
  position: relative;
  overflow: visible;
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

.actions-menu-wrap {
  position: relative;
  display: inline-block;
}

.actions-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 180px;
  min-width: 180px;
  max-width: 180px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.16);
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-sizing: border-box;
}

.actions-menu-item {
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 12px;
  padding: 10px 12px;
  text-align: left;
  font-family: var(--font-family-base);
  font-size: 15px;
  color: var(--color-neutral-900);
  cursor: pointer;
  display: block;
}

.actions-menu-item:hover:not(:disabled) {
  background: var(--color-neutral-100);
}

.actions-menu-item:disabled {
  color: var(--color-neutral-500);
  cursor: not-allowed;
}

.actions-menu-item--danger {
  color: var(--color-danger);
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
  color: var(--color-neutral-900);
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

.bulk-delete-button:hover:not(:disabled) {
  filter: brightness(0.92);
}

.bulk-delete-button:active:not(:disabled) {
  transform: translateY(1px);
}

.bulk-delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.75;
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
  font-size: var(--text-md);
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  transition: color 160ms ease;
}

.pagination-button:hover:not(:disabled) {
  color: var(--color-neutral-900);
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
  color: var(--color-neutral-900);
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
  color: var(--color-neutral-900);
  font-size: 24px;
  font-weight: 700;
}

.confirm-text {
  margin: 0;
  color: var(--color-neutral-700);
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
  color: var(--color-neutral-900);
  border: 1px solid var(--color-border);
}

.confirm-button--ghost:hover:not(:disabled) {
  background: var(--color-neutral-100);
}

.confirm-button--danger {
  background: var(--color-danger);
  color: var(--color-surface);
}

.confirm-button--danger:hover:not(:disabled) {
  filter: brightness(0.92);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-neutral-900);
}

.section-description {
  margin: 6px 0 0;
  color: var(--color-neutral-700);
  font-size: 15px;
}

.section-badge {
  flex: 0 0 auto;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(0, 119, 255, 0.08);
  color: var(--color-info);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.scenario-name-cell {
  color: var(--color-neutral-900);
  font-weight: 600;
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

.drawer-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.drawer-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.drawer-section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-neutral-900);
}

.detail-grid {
  display: grid;
  gap: 12px 14px;
}

.detail-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detail-item {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.72);
}

.detail-item dt {
  color: var(--color-neutral-600);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.detail-value {
  margin: 0;
  color: var(--color-neutral-900);
  font-size: 15px;
  font-weight: 500;
  word-break: break-word;
}

.detail-value--emphasis {
  color: var(--color-primary-600);
  font-weight: 700;
}

.step-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-list-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: flex-start;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.72);
}

.step-list-badge {
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(0, 119, 255, 0.08);
  color: var(--color-info);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.step-list-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-list-title {
  color: var(--color-neutral-900);
  font-size: 15px;
  font-weight: 700;
}

.step-list-answer,
.step-list-time,
.drawer-copy {
  color: var(--color-neutral-700);
  font-size: 14px;
  line-height: 1.55;
}

.step-list-answer span {
  color: var(--color-neutral-900);
  font-weight: 600;
}

.drawer-copy {
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.72);
  white-space: pre-line;
}

@media (max-width: 1200px) {
  .detail-grid--three {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid--two,
  .detail-grid--three {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page-header,
  .section-header,
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-field,
  .select-field,
  .scenario-select,
  .select-field:last-child .select-input {
    width: 100%;
    max-width: none;
    min-width: 0;
  }

  .search-input,
  .select-input {
    width: 100%;
  }

  .actions-menu {
    right: auto;
    left: auto;
  }
}

@media (max-width: 640px) {
  .sessions-view {
    padding-left: var(--space-3);
    padding-right: var(--space-3);
  }

  .page-title {
    font-size: 36px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .overview-card,
  .drawer-section {
    padding: 14px;
  }

  .sessions-table thead th,
  .sessions-table td {
    padding-left: 14px;
    padding-right: 14px;
  }

  .step-list-item {
    grid-template-columns: 1fr;
  }
}
</style>
