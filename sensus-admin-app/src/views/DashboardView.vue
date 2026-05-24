<template>
  <main class="dashboard-view">
    <section v-if="loading" class="card dashboard-state" aria-live="polite">
      <p class="state-title">Dashboard laden...</p>
      <p class="state-text">De data uit Supabase wordt opgehaald.</p>
    </section>

    <section v-else-if="errorMessage" class="card dashboard-state dashboard-state-error" aria-live="assertive">
      <p class="state-title">Dashboard kan niet geladen worden.</p>
      <p class="state-text">{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadDashboard">Opnieuw proberen</button>
    </section>

    <template v-else>
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
                  <th>Datum</th>
                  <th>Scenario</th>
                  <th>Status</th>
                  <th>Duur</th>
                </tr>
              </thead>
              <tbody v-if="recentSessions.length">
                <tr v-for="session in recentSessions" :key="session.key">
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
                  <td colspan="4">
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
            <h2 class="card-title">Inzichten</h2>
          </header>
          <p class="insights-placeholder">Inzichten worden hier later toegevoegd.</p>
        </article>

        <article class="card quick-actions-card">
          <header class="card-header">
            <h2 class="card-title">Quick actions</h2>
          </header>

          <div class="quick-actions">
            <button type="button" class="action-button action-button-primary">+ Nieuw scenario maken</button>
            <button type="button" class="action-button action-button-secondary">◫ Scenario beheren</button>
          </div>
        </article>
      </section>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/services/supabase'

const loading = ref(true)
const errorMessage = ref('')
const sessions = ref([])
const scenarios = ref([])

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

onMounted(() => {
  void loadDashboard()
})

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [sessionsResult, scenariosResult] = await Promise.all([
      supabase.from('sessions').select('*'),
      supabase.from('scenarios').select('*'),
    ])

    if (sessionsResult.error) throw sessionsResult.error
    if (scenariosResult.error) throw scenariosResult.error

    sessions.value = Array.isArray(sessionsResult.data) ? sessionsResult.data : []
    scenarios.value = Array.isArray(scenariosResult.data) ? scenariosResult.data : []
  } catch (error) {
    sessions.value = []
    scenarios.value = []
    errorMessage.value = error?.message || 'Dashboard data kon niet worden geladen.'
  } finally {
    loading.value = false
  }
}

function normalizeKey(value) {
  return String(value ?? '').trim().toLowerCase()
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

function toDate(value) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function getWeekStart(date) {
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

function getScenarioName(record) {
  return getFirstString(record, ['title', 'name', 'display_name', 'scenario_name']) || 'Onbekend scenario'
}

function getScenarioKey(record) {
  return normalizeKey(record?.id ?? record?.scenario_id ?? record?.scenarioId ?? record?.uuid ?? record?.slug ?? getScenarioName(record))
}

const scenarioMap = computed(() => {
  const map = new Map()

  scenarios.value.forEach((scenario) => {
    const scenarioKey = getScenarioKey(scenario)
    const scenarioTitle = getScenarioName(scenario)

    if (scenarioKey) {
      map.set(scenarioKey, scenarioTitle)
    }

    const titleKey = normalizeKey(scenarioTitle)
    if (titleKey) {
      map.set(titleKey, scenarioTitle)
    }
  })

  return map
})

function getSessionScenarioKey(session) {
  return normalizeKey(
    session?.scenario_id ??
      session?.scenarioId ??
      session?.scenario?.id ??
      session?.scenario?.uuid ??
      session?.scenario_slug ??
      session?.scenarioSlug ??
      getSessionScenarioName(session),
  )
}

function getSessionScenarioName(session) {
  const directName =
    getFirstString(session?.scenario, ['title', 'name', 'display_name']) ||
    getFirstString(session, ['scenario_name', 'scenarioName', 'scenario_title', 'title', 'name'])

  if (directName) {
    return directName
  }

  const scenarioKey = normalizeKey(session?.scenario_id ?? session?.scenarioId ?? session?.scenario?.id ?? session?.scenario?.uuid)

  return scenarioMap.value.get(scenarioKey) || 'Onbekend scenario'
}

function getSessionSortStamp(session) {
  const dateValue =
    getFirstString(session, ['started_at', 'created_at', 'date', 'updated_at', 'finished_at']) ||
    session?.started_at ||
    session?.created_at ||
    session?.date ||
    session?.updated_at ||
    session?.finished_at

  const date = toDate(dateValue)

  return date ? date.getTime() : 0
}

function getSessionDate(session) {
  const dateValue =
    getFirstString(session, ['started_at', 'created_at', 'date', 'updated_at', 'finished_at']) ||
    session?.started_at ||
    session?.created_at ||
    session?.date ||
    session?.updated_at ||
    session?.finished_at

  const date = toDate(dateValue)

  return date ? dateFormatter.format(date) : 'Onbekend'
}

function getSessionDurationMinutes(session) {
  const directMinutes = getFirstNumber(session, ['duration_minutes', 'durationMinutes', 'duration_mins', 'duration_min', 'length_minutes'])

  if (directMinutes !== null) {
    return directMinutes
  }

  const durationSeconds = getFirstNumber(session, ['duration_seconds', 'durationSeconds', 'duration_sec', 'durationSec'])
  if (durationSeconds !== null) {
    return durationSeconds / 60
  }

  const durationMilliseconds = getFirstNumber(session, ['duration_ms', 'durationMs'])
  if (durationMilliseconds !== null) {
    return durationMilliseconds / 60000
  }

  const durationValue = getFirstString(session, ['duration', 'length', 'time_spent'])
  if (durationValue) {
    const parsedDuration = Number(durationValue.replace(',', '.').replace(/[^\d.]/g, ''))

    if (!Number.isNaN(parsedDuration)) {
      if (durationValue.toLowerCase().includes('sec')) {
        return parsedDuration / 60
      }

      return parsedDuration
    }
  }

  const startedAt = toDate(getFirstString(session, ['started_at', 'created_at', 'date']) || session?.started_at || session?.created_at || session?.date)
  const finishedAt = toDate(
    getFirstString(session, ['ended_at', 'finished_at', 'completed_at', 'updated_at']) ||
      session?.ended_at ||
      session?.finished_at ||
      session?.completed_at ||
      session?.updated_at,
  )

  if (startedAt && finishedAt && finishedAt.getTime() >= startedAt.getTime()) {
    return (finishedAt.getTime() - startedAt.getTime()) / 60000
  }

  return null
}

function formatDuration(minutes) {
  if (minutes === null || Number.isNaN(minutes)) {
    return '—'
  }

  return `${Math.round(minutes)} min`
}

function getSessionStatusInfo(session) {
  const rawStatus = normalizeKey(getFirstString(session, ['status', 'state', 'session_status']))

  if (!rawStatus && session?.ended_at && !session?.stopped_at) {
    return { label: 'Voltooid', className: 'status-success', icon: '◉' }
  }

  if (['voltooid', 'completed', 'done', 'afgerond', 'finished', 'success'].some((status) => rawStatus.includes(status))) {
    return { label: 'Voltooid', className: 'status-success', icon: '◉' }
  }

  if (['gestopt', 'stopped', 'cancelled', 'canceled', 'aborted', 'failed'].some((status) => rawStatus.includes(status))) {
    return { label: 'Gestopt', className: 'status-danger', icon: '◉' }
  }

  if (['actief', 'active', 'running', 'in progress', 'ongoing', 'open'].some((status) => rawStatus.includes(status))) {
    return { label: 'Actief', className: 'status-neutral', icon: '◉' }
  }

  return {
    label: rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1) : 'Onbekend',
    className: 'status-neutral',
    icon: '◉',
  }
}

function isCompletedSession(session) {
  const status = normalizeKey(getFirstString(session, ['status', 'state', 'session_status']))

  return ['voltooid', 'completed', 'done', 'afgerond', 'finished', 'success'].some((value) => status.includes(value))
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

  const status = normalizeKey(getFirstString(record, ['status']))

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
  return [...sessions.value]
    .map((session, index) => {
      const statusInfo = getSessionStatusInfo(session)

      return {
        key: `${getSessionSortStamp(session)}-${index}-${getSessionScenarioName(session)}`,
        date: getSessionDate(session),
        scenario: getSessionScenarioName(session),
        status: statusInfo.label,
        statusClass: statusInfo.className,
        statusIcon: statusInfo.icon,
        duration: formatDuration(getSessionDurationMinutes(session)),
        sortStamp: getSessionSortStamp(session),
      }
    })
    .sort((left, right) => right.sortStamp - left.sortStamp)
    .slice(0, 4)
})

const popularScenarios = computed(() => {
  const counts = new Map()

  sessions.value.forEach((session) => {
    const key = normalizeKey(session?.scenario_id ?? session?.scenarioId ?? session?.scenario?.id ?? session?.scenario?.uuid)

    if (!key) {
      return
    }

    counts.set(key, (counts.get(key) || 0) + 1)
  })

  const items = scenarios.value.map((scenario) => {
    const key = getScenarioKey(scenario)
    const count = counts.get(key) || counts.get(normalizeKey(getScenarioName(scenario))) || 0

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

  items.sort((left, right) => right.sessions - left.sessions || left.name.localeCompare(right.name, 'nl-NL'))

  const maxSessions = items[0]?.sessions || 0

  return items.slice(0, 5).map((item) => ({
    ...item,
    percent: maxSessions ? Math.max(0, Math.round((item.sessions / maxSessions) * 100)) : 0,
  }))
})

const kpiCards = computed(() => {
  const totalSessions = sessions.value.length
  const weekStart = getWeekStart(new Date()).getTime()
  const sessionsThisWeek = sessions.value.filter((session) => getSessionSortStamp(session) >= weekStart).length
  const activeScenarioCount = scenarios.value.filter(isActiveScenario).length
  const durations = sessions.value
    .map((session) => getSessionDurationMinutes(session))
    .filter((minutes) => minutes !== null && !Number.isNaN(minutes))
  const averageDuration = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null
  const completedSessions = sessions.value.filter(isCompletedSession).length
  const completedPercentage = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : null

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
      value: averageDuration === null ? '—' : `${averageDuration} min`,
    },
    {
      label: 'Afgeronde sessies',
      value: completedPercentage === null ? '—' : `${completedPercentage}%`,
    },
  ]
})
</script>

<style scoped>
.dashboard-view {
  padding: var(--space-5);
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
.scenario-name,
.table-footer,
.insights-placeholder,
.state-text,
.sessions-table th,
.sessions-table td {
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
  min-height: 150px;
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

.sessions-table {
  width: 100%;
  border-collapse: collapse;
}

.sessions-table th {
  text-align: left;
  color: var(--color-neutral-700);
  font-size: var(--text-md);
  font-weight: 500;
  padding: 0 0 var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.sessions-table td {
  padding: var(--space-4) 0;
  font-size: var(--text-md);
  color: var(--color-neutral-800);
  border-bottom: 1px solid var(--color-border);
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

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.scenario-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.scenario-name {
  font-size: var(--text-md);
  color: var(--color-neutral-800);
}

.scenario-meter {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.scenario-track {
  flex: 1;
  height: 8px;
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
  min-width: 30px;
  text-align: right;
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-neutral-800);
}

.insights-placeholder {
  margin: 0;
  color: var(--color-text-soft);
  font-size: var(--text-md);
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
