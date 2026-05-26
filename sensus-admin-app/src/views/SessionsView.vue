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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { formatDuration } from '@/utils/formatDuration'

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
let sessionsChannel = null

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
})

onUnmounted(() => {
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
    errorMessage.value = error?.message || 'Sessies konden niet worden geladen.'
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
  const id = shortenId(rawId)

  const startDate = getFirstDate(record, ['started_at'])
  const endDate = getFirstDate(record, ['ended_at'])
  const displayDate = startDate || getFirstDate(record, ['created_at']) || endDate 

  const normalizedStatus = normalizeStatus(record)
  const isOffline = getOfflineState(record)

  const scenarioId = getFirstString(record, ['scenario_id'])
  const scenario = scenarioId ? mapScenario(scenarioId) : 'Onbekend scenario'

  return {
    id,
    scenario,
    scenarioSlug: scenarioId || '',
    age: getFirstNumber(record, ['age']) ?? null,
    gender: normalizeGender(getFirstString(record, ['gender'])),
    date: formatDate(displayDate),
    start: formatTime(startDate),
    end: formatTime(endDate),
    status: normalizedStatus,
    statusKey: statusKeyFromLabel(normalizedStatus),
    isOffline,
    durationMs: getDurationMs(record, startDate, endDate),
    sessionDate: displayDate,
    sortStamp: displayDate?.getTime?.() || 0,
  }
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
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function formatTime(date) {
  if (!date) return '--:--'
  return new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

function calculateDurationMs(startDate, endDate) {
  if (!startDate || !endDate) return null

  const diffMs = endDate.getTime() - startDate.getTime()
  if (diffMs <= 0) return null

  return diffMs
}

function getDurationMs(record, startDate, endDate) {
  const durationMs = getFirstNumber(record, ['duration_seconds'])

  if (typeof durationMs === 'number' && durationMs >= 0) {
    return durationMs
  }

  return calculateDurationMs(startDate, endDate) || 0
}

function getDurationMinutes(record, startDate, endDate) {
  const durationMs = getDurationMs(record, startDate, endDate)

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
    .map((s) => s.durationMs)
    .filter((value) => typeof value === 'number' && value >= 0)

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
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 0;
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
