<template>
  <main class="dashboard-view">
    <section v-if="loading" class="card dashboard-state" aria-live="polite">
      <p class="state-title">Dashboard laden...</p>
      <p class="state-text">De data uit Supabase wordt opgehaald.</p>
    </section>

    <section v-if="errorMessage" class="card dashboard-state dashboard-state-error" aria-live="assertive">
      <p class="state-title">Dashboard kan niet volledig geladen worden.</p>
      <p class="state-text">{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadDashboard">Opnieuw laden</button>
    </section>

    <section v-if="!loading" class="dashboard-content">
      <section class="kpi-grid" aria-label="KPI overzicht">
        <article v-for="card in kpiCards" :key="card.label" class="card kpi-card">
          <p class="card-label">{{ card.label }}</p>
          <p class="card-value secondary-value">{{ card.value }}</p>
        </article>
      </section>

      <section class="content-grid">
        <article class="card sessions-card">
          <header class="card-header">
            <h2 class="card-title">Recente sessies</h2>
          </header>

          <div class="table-wrap">
            <table class="sessions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Datum</th>
                  <th>Scenario</th>
                  <th>Status</th>
                  <th>Duur</th>
                </tr>
              </thead>
              <tbody v-if="recentSessions.length">
                <tr v-for="session in recentSessions" :key="session.key">
                  <td class="session-id-cell">{{ session.shortId }}</td>
                  <td>{{ session.date }}</td>
                  <td class="scenario-cell">{{ session.scenario }}</td>
                  <td>
                    <span class="status-pill" :class="session.statusClass">
                      <span class="status-icon" aria-hidden="true">{{ session.statusIcon }}</span>
                      {{ session.status }}
                    </span>
                  </td>
                  <td>{{ session.duration }}</td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="5">
                    <div class="empty-state">Geen sessies gevonden.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-footer">All &rsaquo;</div>
        </article>

        <article class="card scenarios-card">
          <header class="card-header">
            <h2 class="card-title">Populaire scenario’s</h2>
          </header>

          <div v-if="popularScenarios.length" class="scenario-list">
            <div class="scenario-list-head">
              <span>Scenario</span>
              <span aria-hidden="true"></span>
              <span class="scenario-list-head-count">Sessies</span>
            </div>
            <div v-for="scenario in popularScenarios" :key="scenario.key" class="scenario-row">
              <span class="scenario-name">{{ scenario.name }}</span>

              <div class="scenario-meter">
                <div class="scenario-track">
                  <div class="scenario-fill" :style="{ width: `${scenario.percent}%` }"></div>
                </div>
                <span class="scenario-count">{{ scenario.sessions }}</span>
              </div>
            </div>
          </div>

          <div v-else class="empty-state empty-state-compact">Geen populaire scenario’s gevonden.</div>
        </article>

        <article class="card insights-card">
          <header class="card-header">
            <h2 class="card-title">Belangrijkste inzichten deze week</h2>
          </header>

          <div v-if="insightsLoading" class="insights-state" aria-live="polite">
            <p class="insights-state-title">Inzichten berekenen...</p>
            <p class="insights-state-text">De sessiedata van de afgelopen 7 dagen wordt geanalyseerd.</p>
          </div>

          <div v-else-if="insightsError" class="insights-state insights-state-error" aria-live="assertive">
            <p class="insights-state-title">Inzichten konden niet worden geladen.</p>
            <p class="insights-state-text">{{ insightsError }}</p>
            <button type="button" class="retry-button retry-button--compact" @click="loadDashboard">Opnieuw laden</button>
          </div>

          <template v-else-if="dashboardInsights.length">
            <ul class="insights-list">
              <li v-for="insight in dashboardInsights" :key="insight.id" class="insight-item">
                <span class="insight-icon" :class="`insight-icon--${insight.icon}`" aria-hidden="true">
                  <component :is="insightIconMap[insight.icon]" class="insight-icon-svg" :stroke-width="2.1" />
                </span>
                <div class="insight-body">
                  <p class="insight-title">{{ insight.title }}</p>
                  <p class="insight-text">{{ insight.text }}</p>
                </div>
              </li>
            </ul>

            <p v-if="insightsLastUpdated" class="insights-updated">
              Laatst bijgewerkt: {{ formatDate(insightsLastUpdated) }}
            </p>
          </template>

          <div v-else class="insights-state insights-state-empty">
            <p class="insights-state-title">Nog geen inzichten beschikbaar</p>
            <p class="insights-state-text">{{ insightsFallbackMessage }}</p>
          </div>
        </article>

        <article class="card quick-actions-card">
          <header class="card-header">
            <h2 class="card-title">Quick actions</h2>
          </header>

          <div class="quick-actions">
            <button
              type="button"
              class="action-button action-button-primary"
              aria-label="Nieuw scenario maken"
              @click="goToCreateScenario"
            >
              + Nieuw scenario maken
            </button>
            <button
              type="button"
              class="action-button action-button-secondary"
              aria-label="Scenario beheren"
              @click="goToScenarios"
            >
              ◫ Scenario beheren
            </button>
          </div>
        </article>
      </section>
      </section>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, CheckCircle, Clock3, MessageSquare, Trophy } from 'lucide-vue-next'
import { supabase } from '@/services/supabase'
import { formatDate } from '@/utils/dateFormatter'
import { formatDuration } from '@/utils/formatDuration'
import { useDashboardInsights } from '@/composables/useDashboardInsights'

const router = useRouter()
const insightIconMap = {
  'message-square': MessageSquare,
  'clock-3': Clock3,
  'alert-triangle': AlertTriangle,
  trophy: Trophy,
  'check-circle': CheckCircle,
}
const {
  insights: dashboardInsights,
  isLoading: insightsLoading,
  errorMessage: insightsError,
  fallbackMessage: insightsFallbackMessage,
  lastUpdated: insightsLastUpdated,
  loadDashboardInsights,
  clearDashboardInsights,
} = useDashboardInsights()

const loading = ref(true)
const errorMessage = ref('')
const sessions = ref([])
const scenarios = ref([])
const events = ref([])

let sessionsChannel = null
let eventsChannel = null

onMounted(() => {
  setupRealtimeSubscriptions()
  void loadDashboard()
})

onUnmounted(() => {
  cleanupRealtimeSubscriptions()
})

function goToCreateScenario() {
  void router.push('/scenarios/new')
}

function goToScenarios() {
  void router.push('/scenarios')
}

async function loadDashboard(options = {}) {
  const silent = Boolean(options.silent)

  if (!silent) {
    loading.value = true
  }

  errorMessage.value = ''

  try {
    const [sessionsResult, eventsResult, scenariosResult] = await Promise.all([
      supabase.from('sessions').select('*').order('started_at', { ascending: false }),
      safeSelectTable('events'),
      safeSelectTable('scenarios'),
    ])

    if (sessionsResult.error) throw sessionsResult.error

    sessions.value = Array.isArray(sessionsResult.data) ? sessionsResult.data : []
    events.value = Array.isArray(eventsResult.data) ? eventsResult.data : []
    scenarios.value = Array.isArray(scenariosResult.data) ? scenariosResult.data : []

    await loadDashboardInsights({
      sessions: sessions.value,
      events: events.value,
      scenarios: scenarios.value,
    })

    const secondaryError = [eventsResult.error, scenariosResult.error].find(Boolean)
    if (secondaryError) {
      errorMessage.value = secondaryError.message || 'Niet alle dashboarddata kon worden geladen.'
    }
  } catch (error) {
    console.error('Dashboard data kon niet worden geladen.', error)
    sessions.value = []
    scenarios.value = []
    events.value = []
    clearDashboardInsights()
    errorMessage.value = error?.message || 'Dashboard data kon niet worden geladen.'
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

function setupRealtimeSubscriptions() {
  sessionsChannel = supabase
    .channel('dashboard-sessions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
      void loadDashboard({ silent: true })
    })
    .subscribe()

  eventsChannel = supabase
    .channel('dashboard-events-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
      void loadDashboard({ silent: true })
    })
    .subscribe()
}

function cleanupRealtimeSubscriptions() {
  if (sessionsChannel) {
    void supabase.removeChannel(sessionsChannel)
    sessionsChannel = null
  }

  if (eventsChannel) {
    void supabase.removeChannel(eventsChannel)
    eventsChannel = null
  }
}

async function safeSelectTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*')

  if (error) {
    console.error(`Tabel '${tableName}' kon niet worden geladen.`, error)

    const message = String(error.message || '').toLowerCase()
    if (message.includes('does not exist') || message.includes('could not find')) {
      return { data: [], error: null }
    }
  }

  return { data, error }
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function getFirstString(record, keys) {
  for (const key of keys) {
    const value = record?.[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
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

function toDate(value) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function getFirstDate(record, keys) {
  for (const key of keys) {
    const value = record?.[key]
    const date = toDate(value)

    if (date) {
      return date
    }
  }

  return null
}

function getScenarioName(record) {
  return getFirstString(record, ['title', 'name', 'display_name', 'scenario_name']) || 'Onbekend scenario'
}

function getScenarioKey(record) {
  return normalizeText(record?.slug ?? record?.id ?? record?.scenario_id ?? record?.scenarioId ?? record?.uuid)
}

const scenarioMap = computed(() => {
  const map = new Map()

  scenarios.value.forEach((scenario) => {
    const scenarioKey = getScenarioKey(scenario)
    const scenarioTitle = getScenarioName(scenario)

    if (scenarioKey) {
      map.set(scenarioKey, scenarioTitle)
    }
  })

  return map
})

const eventTimelines = computed(() => {
  const map = new Map()

  events.value.forEach((event) => {
    const sessionKey = getEventSessionKey(event)
    if (!sessionKey) {
      return
    }

    const timestamp = getEventTimestamp(event)
    if (!map.has(sessionKey)) {
      map.set(sessionKey, { first: timestamp, last: timestamp, count: 1 })
      return
    }

    const entry = map.get(sessionKey)
    entry.count += 1

    if (timestamp) {
      if (!entry.first || timestamp < entry.first) {
        entry.first = timestamp
      }

      if (!entry.last || timestamp > entry.last) {
        entry.last = timestamp
      }
    }
  })

  return map
})

const dashboardSessions = computed(() => {
  return [...sessions.value]
    .map((session, index) => normalizeDashboardSession(session, index))
    .sort((left, right) => right.sortStamp - left.sortStamp)
})

const shortenId = (id) => {
  if (!id) return '-'
  return String(id).slice(0, 8)
}

function getSessionRawId(session) {
  return getFirstString(session, ['id', 'session_id', 'sessionId', 'uuid'])
}

function getSessionScenarioKey(session) {
  return normalizeText(session?.scenario_id ?? session?.scenarioId ?? session?.scenario_slug ?? session?.scenarioSlug ?? session?.scenario?.slug)
}

function getSessionScenarioName(session) {
  const scenarioKey = getSessionScenarioKey(session)

  return scenarioMap.value.get(scenarioKey) || 'Onbekend scenario'
}

function getSessionTimeline(session) {
  const sessionKey = normalizeText(getSessionRawId(session))

  if (!sessionKey) {
    return null
  }

  return eventTimelines.value.get(sessionKey) || null
}

function getSessionSortStamp(session) {
  const date = getDashboardSessionDate(session)

  return date ? date.getTime() : 0
}

function getSessionDate(session) {
  const date = getDashboardSessionDate(session)

  return formatDate(date)
}

function getSessionDurationMs(session) {
  const directDurationMs = getFirstNumber(session, ['duration_ms', 'durationMs'])

  if (directDurationMs !== null) {
    return directDurationMs
  }

  const directDurationSeconds = getFirstNumber(session, ['duration_seconds', 'durationSeconds', 'duration_sec', 'durationSec'])

  if (directDurationSeconds !== null) {
    return directDurationSeconds * 1000
  }

  const startedAt = getFirstDate(session, ['started_at', 'created_at', 'date'])
  const finishedAt = getFirstDate(session, ['ended_at', 'finished_at', 'completed_at', 'updated_at'])

  if (startedAt && finishedAt && finishedAt.getTime() >= startedAt.getTime()) {
    return finishedAt.getTime() - startedAt.getTime()
  }

  const timeline = getSessionTimeline(session)

  if (timeline?.first && timeline?.last && timeline.last.getTime() >= timeline.first.getTime()) {
    return timeline.last.getTime() - timeline.first.getTime()
  }

  return 0
}

function formatPercent(value) {
  if (value === null || Number.isNaN(value)) {
    return '0%'
  }

  return `${value}%`
}

function getSessionStatusKey(session) {
  const status = normalizeText(getFirstString(session, ['status', 'state', 'session_status']))

  if (!status && session?.ended_at && !session?.stopped_at) {
    return 'completed'
  }

  if (['completed', 'voltooid', 'done', 'afgerond', 'finished', 'success'].some((value) => status.includes(value))) {
    return 'completed'
  }

  if (['stopped', 'gestopt', 'cancelled', 'canceled', 'aborted', 'failed'].some((value) => status.includes(value))) {
    return 'stopped'
  }

  if (['active', 'actief', 'running', 'in progress', 'ongoing', 'open'].some((value) => status.includes(value))) {
    return 'active'
  }

  return 'unknown'
}

function getSessionStatusInfo(session) {
  const statusKey = getSessionStatusKey(session)

  if (statusKey === 'completed') {
    return { label: 'Voltooid', className: 'status-success', icon: '◉' }
  }

  if (statusKey === 'stopped') {
    return { label: 'Gestopt', className: 'status-danger', icon: '◉' }
  }

  if (statusKey === 'active') {
    return { label: 'Actief', className: 'status-neutral', icon: '◉' }
  }

  const rawStatus = getFirstString(session, ['status', 'state', 'session_status'])

  return {
    label: rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1) : 'Onbekend',
    className: 'status-neutral',
    icon: '◉',
  }
}

function getDashboardSessionDate(session) {
  return (
    getFirstDate(session, ['started_at', 'created_at', 'date', 'updated_at', 'finished_at']) ||
    getSessionTimeline(session)?.first ||
    getSessionTimeline(session)?.last ||
    null
  )
}

function getEventSessionKey(event) {
  return normalizeText(getFirstString(event, ['session_id', 'sessionId', 'session_uuid', 'sessionUuid']))
}

function isActiveScenario(record) {
  for (const key of ['active', 'is_active', 'enabled']) {
    if (typeof record?.[key] === 'boolean') {
      return record[key]
    }
  }

  if (typeof record?.archived === 'boolean') {
    return !record.archived
  }

  if (typeof record?.is_archived === 'boolean') {
    return !record.is_archived
  }

  const status = normalizeText(getFirstString(record, ['status']))

  if (!status) {
    return true
  }

  if (['inactive', 'archived', 'disabled', 'draft', 'closed'].some((value) => status.includes(value))) {
    return false
  }

  if (['active', 'published', 'live', 'open', 'available'].some((value) => status.includes(value))) {
    return true
  }

  return true
}

const recentSessions = computed(() => {
  return [...dashboardSessions.value]
    .map((session, index) => {
      return {
        key: `${session.id}-${index}`,
        shortId: session.shortId,
        date: session.date,
        scenario: session.scenario,
        status: session.status,
        statusClass: session.statusClass,
        statusIcon: session.statusIcon,
        duration: formatDuration(getSessionDurationMs(session)),
        sortStamp: session.sortStamp,
      }
    })
    .sort((left, right) => right.sortStamp - left.sortStamp)
    .slice(0, 4)
})

const popularScenarios = computed(() => {
  const counts = new Map()
  const knownScenarioKeys = new Set(scenarios.value.map((scenario) => normalizeText(scenario?.slug)).filter(Boolean))
  let unknownCount = 0

  dashboardSessions.value.forEach((session) => {
    const key = session.scenarioKey

    if (!key) {
      unknownCount += 1
      return
    }

    if (!knownScenarioKeys.has(key)) {
      unknownCount += 1
      return
    }

    counts.set(key, (counts.get(key) || 0) + 1)
  })

  const items = scenarios.value.map((scenario) => {
    const key = normalizeText(scenario?.slug)
    const count = counts.get(key) || 0

    return {
      key,
      name: getScenarioName(scenario),
      sessions: count,
    }
  })

  if (!items.length) {
    counts.forEach((count, key) => {
      items.push({
        key,
        name: scenarioMap.value.get(key) || key,
        sessions: count,
      })
    })
  }

  if (unknownCount) {
    items.push({
      key: 'unknown-scenario',
      name: 'Onbekend scenario',
      sessions: unknownCount,
    })
  }

  items.sort((left, right) => right.sessions - left.sessions || left.name.localeCompare(right.name, 'nl-NL'))

  const maxSessions = items[0]?.sessions || 0

  return items.slice(0, 5).map((item) => ({
    ...item,
    percent: maxSessions ? Math.max(0, Math.round((item.sessions / maxSessions) * 100)) : 0,
  }))
})

const kpiCards = computed(() => {
  const totalSessions = dashboardSessions.value.length
  const weekStart = getWeekStart(new Date()).getTime()
  const sessionsThisWeek = dashboardSessions.value.filter((session) => session.weekStamp >= weekStart).length
  const activeScenarioCount = new Set(dashboardSessions.value.map((session) => session.scenarioKey).filter(Boolean)).size
  const durations = dashboardSessions.value
    .map((session) => session.durationMs)
    .filter((value) => typeof value === 'number' && value >= 0)
  const averageDuration = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null
  const completedSessions = dashboardSessions.value.filter((session) => session.statusKey === 'completed' || session.status === 'Voltooid').length
  const completedPercentage = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0

  return [
    {
      label: 'Sessies deze week',
      value: `${sessionsThisWeek}`,
    },
    {
      label: 'Actieve scenario’s',
      value: `${activeScenarioCount}`,
    },
    {
      label: 'Gem. sessieduur',
      value: averageDuration === null ? '—' : formatDuration(averageDuration),
    },
    {
      label: 'Afgeronde sessies',
      value: `${completedPercentage}%`,
    },
  ]
})

function getWeekStart(date) {
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

function isCompletedSession(session) {
  return getSessionStatusKey(session) === 'completed'
}

function normalizeDashboardSession(session, index) {
  const id = getSessionRawId(session) || `sessie-${index + 1}`
  const displayDate = getDashboardSessionDate(session)
  const statusInfo = getSessionStatusInfo(session)
  const statusKey = getSessionStatusKey(session)
  const scenarioKey = getSessionScenarioKey(session)

  return {
    id,
    shortId: shortenId(id),
    scenarioKey,
    scenario: getSessionScenarioName(session),
    status: statusInfo.label,
    statusKey,
    statusClass: statusInfo.className,
    statusIcon: statusInfo.icon,
    durationMs: getSessionDurationMs(session),
    date: formatDate(displayDate),
    sessionDate: displayDate,
    weekStamp: displayDate?.getTime?.() || 0,
    sortStamp: displayDate?.getTime?.() || 0,
    raw: session,
  }
}
</script>

<style scoped>
.dashboard-view {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.dashboard-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: var(--space-2);
}

.dashboard-state-error {
  border-color: rgba(255, 0, 0, 0.24);
}

.state-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-neutral-900);
}

.state-text {
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text-soft);
}

.retry-button {
  margin-top: var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary-600);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  font-weight: 700;
  padding: 12px 18px;
  cursor: pointer;
}

.retry-button:hover {
  background: var(--color-primary-700);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
  box-sizing: border-box;
}

.kpi-card {
  min-height: 124px;
}

.card-label,
.table-footer,
.insights-placeholder,
.state-text,
.sessions-table th,
.sessions-table td,
.scenarios-table th,
.scenarios-table td {
  font-family: var(--font-family-base);
}

.card-label {
  margin: 0 0 var(--space-2);
  color: var(--color-neutral-800);
  font-size: var(--text-lg);
  line-height: 1.2;
}

.card-value {
  margin: 0;
  font-weight: 700;
  line-height: 1.1;
}

.secondary-value {
  color: var(--color-secondary-600);
  font-size: 40px;
}

.content-grid > .card {
  min-height: 100%;
}

.sessions-card {
  min-height: 350px;
}

.scenarios-card {
  min-height: 350px;
}

.insights-card {
  min-height: 220px;
}

.quick-actions-card {
  min-height: 150px;
}

.card-header {
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-3);
}

.card-title {
  margin: 0;
  font-size: var(--text-xl);
  line-height: 1.2;
  color: var(--color-neutral-900);
  font-weight: 700;
}

.table-wrap {
  overflow: hidden;
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.scenario-list-head {
  display: grid;
  grid-template-columns: 1fr 120px 48px;
  align-items: center;
  gap: 16px;
  padding: 0 0 12px;
  color: var(--color-neutral-700);
  font-size: var(--text-md);
  font-weight: 500;
  border-bottom: 1px solid var(--color-border);
}

.scenario-list-head-count {
  width: 48px;
  justify-self: end;
  text-align: right;
}

.scenario-row {
  display: grid;
  grid-template-columns: 1fr 120px 48px;
  align-items: center;
  gap: 16px;
  min-height: 58px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.scenario-row:last-child {
  border-bottom: none;
}

.scenario-name {
  font-size: var(--text-md);
  color: var(--color-neutral-800);
  font-weight: 500;
  min-width: 0;
  line-height: 1.25;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
}

.scenario-meter {
  display: contents;
  align-items: center;
  min-width: 0;
}

.scenario-track {
  width: 120px;
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--color-neutral-200);
  overflow: hidden;
}

.scenario-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-secondary-700), var(--color-secondary-500));
}

.scenario-count {
  width: 48px;
  text-align: right;
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-neutral-800);
  justify-self: end;
}

.sessions-table {
  width: 100%;
  border-collapse: collapse;
}

.sessions-table th,
.scenarios-table th {
  text-align: left;
  color: var(--color-neutral-700);
  font-size: var(--text-md);
  font-weight: 500;
  padding: 0 0 var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.sessions-table td,
.scenarios-table td {
  padding: var(--space-4) 0;
  font-size: var(--text-md);
  color: var(--color-neutral-800);
  border-bottom: 1px solid var(--color-border);
}

.session-id-cell {
  font-weight: 700;
  color: var(--color-neutral-900);
}

.scenario-cell {
  font-weight: 600;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
}

.status-icon {
  font-size: 11px;
}

.status-success {
  color: var(--color-success);
}

.status-danger {
  color: var(--color-danger);
}

.status-neutral {
  color: var(--color-secondary-600);
}

.table-footer {
  padding-top: var(--space-3);
  color: var(--color-neutral-700);
  font-size: var(--text-md);
}

.insights-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
}

.insight-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.insight-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(84, 99, 107, 0.08);
  color: var(--color-secondary-700);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  transition: background-color 160ms ease;
}

.insight-icon--message-square {
  background: rgba(165, 10, 126, 0.1);
  color: #a50a7e;
}

.insight-icon--message-square:hover {
  background: rgba(165, 10, 126, 0.16);
}

.insight-icon--clock-3 {
  background: rgba(6, 70, 96, 0.1);
  color: #064660;
}

.insight-icon--clock-3:hover {
  background: rgba(6, 70, 96, 0.16);
}

.insight-icon--alert-triangle {
  background: rgba(242, 140, 40, 0.12);
  color: #f28c28;
}

.insight-icon--alert-triangle:hover {
  background: rgba(242, 140, 40, 0.18);
}

.insight-icon--trophy {
  background: rgba(200, 162, 0, 0.14);
  color: #c8a200;
}

.insight-icon--trophy:hover {
  background: rgba(200, 162, 0, 0.2);
}

.insight-icon--check-circle {
  background: rgba(32, 160, 90, 0.1);
  color: #20a05a;
}

.insight-icon--check-circle:hover {
  background: rgba(32, 160, 90, 0.16);
}

.insight-icon-svg {
  width: 20px;
  height: 20px;
  display: block;
}

.insight-body {
  min-width: 0;
}

.insight-title {
  margin: 0 0 4px;
  color: var(--color-neutral-900);
  font-size: var(--text-md);
  font-weight: 700;
  line-height: 1.3;
}

.insight-text {
  margin: 0;
  color: var(--color-neutral-800);
  font-size: var(--text-md);
  line-height: 1.45;
}

.insights-state {
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.insights-state-empty {
  align-items: flex-start;
}

.insights-state-error {
  align-items: flex-start;
}

.insights-state-title {
  margin: 0;
  font-size: var(--text-lg);
  line-height: 1.2;
  font-weight: 700;
  color: var(--color-neutral-900);
}

.insights-state-text {
  margin: 0;
  color: var(--color-text-soft);
  font-size: var(--text-md);
  line-height: 1.5;
}

.retry-button--compact {
  margin-top: var(--space-1);
  padding: 10px 14px;
  font-size: var(--text-sm);
}

.insights-updated {
  margin: var(--space-3) 0 0;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  line-height: 1.4;
}

.empty-state {
  width: 100%;
  min-height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
  color: var(--color-text-soft);
  font-size: var(--text-md);
  text-align: center;
}

.empty-state-compact {
  min-height: 120px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.action-button {
  width: 100%;
  border: none;
  border-radius: var(--radius-md);
  padding: 14px 18px;
  font-family: var(--font-family-base);
  font-size: var(--text-md);
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.action-button-primary {
  background: var(--color-primary-600);
  color: var(--color-surface);
}

.action-button-primary:hover {
  background: var(--color-primary-700);
}

.action-button-secondary {
  background: var(--color-secondary-700);
  color: var(--color-surface);
}

.action-button-secondary:hover {
  background: var(--color-secondary-800);
}

</style>
