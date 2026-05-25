<template>
  <main class="insights-view">
    <header class="page-header">
      <div class="title-block">
        <h1 class="page-title">Inzichten</h1>

        <nav class="tabs" aria-label="Inzichten tabs">
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

    <section class="kpi-row">
      <div class="kpi-card big">
        <div class="kpi-label">Sessies</div>
        <div class="kpi-value">{{ kpi.totalSessions }}</div>
      </div>

      <div class="kpi-card big">
        <div class="kpi-label">Voltooid</div>
        <div class="kpi-value">{{ kpi.completedPct }}%</div>
      </div>

      <div class="kpi-card big">
        <div class="kpi-label">Afhaak %</div>
        <div class="kpi-value">{{ kpi.dropoffPct }}%</div>
        <div class="kpi-meta success">{{ dropoffMeta }}</div>
      </div>

      <div class="kpi-card big">
        <div class="kpi-label">Gem. sessieduur</div>
        <div class="kpi-value">{{ kpi.avgDurationLabel }}</div>
      </div>
    </section>

    <div class="selector-wrapper">
      <div class="selector-card">
        <label class="select-field">
          <span class="sr-only">Scenario</span>
          <select class="select-input" v-model="selectedScenarioKey" :disabled="loadingScenarios">
            <option v-for="scenario in scenarios" :key="scenario.key" :value="scenario.key">
              Scenario: {{ scenario.title }}
            </option>
          </select>
        </label>
        <div v-if="loadingScenarios || loadingScenarioData" class="small-label">Data laden...</div>
        <div v-else-if="errorMessage" class="small-label">{{ errorMessage }}</div>
      </div>
    </div>

    <div class="cards-row">
      <div class="insights-card">
        <h2 class="section-title">Kern inzichten voor dit scenario</h2>

        <div class="insights-grid">
          <div class="small-card">
            <div class="small-label">Voltooid %</div>
            <div class="small-value">{{ kpi.completedPct }}%</div>
          </div>

          <div class="small-card">
            <div class="small-label">Afhaak %</div>
            <div class="small-value">{{ kpi.dropoffPct }}%</div>
          </div>

          <div class="warning-box">{{ warningText }}</div>
        </div>
      </div>

      <aside class="behavior-card">
        <h3 class="section-title">Gedrag van gebruikers</h3>

        <div class="behavior-grid-vertical">
          <div class="small-card">
            <div class="behavior-title">Populairste pad</div>
            <div class="behavior-value">{{ behaviorSummary.mostPopularPath }}</div>
            <div class="behavior-meta">{{ behaviorSummary.mostPopularPct }}% koos dit pad</div>
          </div>

          <div class="small-card">
            <div class="behavior-title">Minst populairste pad</div>
            <div class="behavior-value">{{ behaviorSummary.leastPopularPath }}</div>
            <div class="behavior-meta">{{ behaviorSummary.leastPopularPct }}% koos dit pad</div>
          </div>
        </div>

        <div class="behavior-note">{{ behaviorSummary.note }}</div>
      </aside>
    </div>

    <section class="card reflections-card">
      <h3 class="section-title">Reflecties van gebruikers</h3>

      <div class="table-wrap">
        <table class="reflections-table">
          <thead>
            <tr>
              <th>Gebruiker/id</th>
              <th>Datum</th>
              <th>Leeftijd</th>
              <th>Gender</th>
              <th>Reflectie</th>
            </tr>
          </thead>
          <tbody v-if="loadingScenarioData">
            <tr>
              <td colspan="5" class="reflection-text">Reflecties laden...</td>
            </tr>
          </tbody>
          <tbody v-else-if="reflections.length">
            <tr v-for="r in reflections" :key="r.id" class="reflection-row">
              <td>{{ r.id }}</td>
              <td>{{ r.date }}</td>
              <td>{{ r.age }}</td>
              <td>{{ r.gender }}</td>
              <td class="reflection-text">{{ r.text }}</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="5" class="reflection-text">Geen reflecties beschikbaar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <button class="pagination-button">‹ Vorige</button>
        <span class="pagination-divider"></span>
        <button class="pagination-button">Volgende ›</button>
      </footer>
    </section>

    <section class="card behavior-breakdown">
      <h3 class="section-title">Gedrag in het scenario</h3>

      <div class="gender-grid">
        <div class="gender-card" v-for="g in genders" :key="g.key">
          <div class="gender-title">{{ g.label }}</div>
          <div class="progress-bar-container">
            <div class="progress-full">
              <div class="segment segment-a" :style="{ width: g.padA + '%' }">
                <span class="segment-text">{{ g.padA }}%</span>
              </div>
              <div class="segment segment-b" :style="{ width: g.padB + '%' }">
                <span class="segment-text">{{ g.padB }}%</span>
              </div>
              <div class="segment segment-drop" :style="{ width: g.drop + '%' }">
                <span class="segment-text segment-drop-text">{{ g.drop }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="legend" aria-hidden="true">
        <div class="legend-item"><span class="dot a"></span> Pad A</div>
        <div class="legend-item"><span class="dot b"></span> Pad B</div>
        <div class="legend-item"><span class="dot drop"></span> Afhaak</div>
      </div>
    </section>

    <section class="card drop-per-step">
      <h3 class="section-title">Afhaak per stap</h3>

      <div class="steps-outer">
        <div class="step-row" v-for="step in steps" :key="step.key">
          <div class="step-left">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-desc">{{ step.desc }}</div>
          </div>

          <div class="step-center">
            <div class="bar-row">
              <div class="bar-wrap">
                <div class="bar-a" :style="{ width: step.padA + '%' }"><span class="bar-text">Pad A</span></div>
              </div>
              <div class="bar-percent">{{ step.padA }}%</div>
            </div>

            <div class="bar-row">
              <div class="bar-wrap">
                <div class="bar-b" :style="{ width: step.padB + '%' }"><span class="bar-text">Pad B</span></div>
              </div>
              <div class="bar-percent">{{ step.padB }}%</div>
            </div>
          </div>

          <div class="step-right">
            <div class="drop-card">Afhaak<br>{{ step.drop }}%</div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '@/services/supabase'

const tabs = [
  { key: 'all', label: 'Alle sessies' },
  { key: 'week', label: 'Deze week' },
  { key: 'today', label: 'Vandaag' },
]

const activeTab = ref('all')
const loadingScenarios = ref(true)
const loadingScenarioData = ref(false)
const errorMessage = ref('')
const scenarios = ref([])
const selectedScenarioKey = ref('')
const sessions = ref([])
const reflections = ref([])
const analyticsRows = ref([])

onMounted(() => {
  void loadScenarios()
})

watch(selectedScenarioKey, () => {
  if (!selectedScenario.value) return
  void loadScenarioData()
})

const selectedScenario = computed(() => {
  return scenarios.value.find((scenario) => scenario.key === selectedScenarioKey.value) || null
})

const filteredSessions = computed(() => {
  const all = [...sessions.value]

  if (activeTab.value === 'week') {
    return all.filter((session) => session.dateObj && isInCurrentWeek(session.dateObj))
  }

  if (activeTab.value === 'today') {
    const today = new Date()
    return all.filter((session) => session.dateObj && isSameDay(session.dateObj, today))
  }

  return all
})

const kpi = computed(() => {
  const total = filteredSessions.value.length
  const completed = filteredSessions.value.filter((session) => session.statusKey === 'completed').length
  const dropped = filteredSessions.value.filter((session) => session.statusKey === 'stopped').length
  const durationValues = filteredSessions.value
    .map((session) => session.durationMinutes)
    .filter((value) => typeof value === 'number' && value > 0)

  const avgDuration = durationValues.length
    ? Math.round(durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length)
    : 0

  return {
    totalSessions: total,
    completedPct: total ? Math.round((completed / total) * 100) : 0,
    dropoffPct: total ? Math.round((dropped / total) * 100) : 0,
    avgDuration,
    avgDurationLabel: `${avgDuration} min`,
  }
})

const dropoffMeta = computed(() => {
  if (!filteredSessions.value.length) {
    return 'Geen vergelijkingsdata'
  }

  return 'Op basis van live sessiedata'
})

const warningText = computed(() => {
  if (!filteredSessions.value.length) {
    return 'Geen sessiedata beschikbaar voor dit scenario'
  }

  if (kpi.value.dropoffPct >= 50) {
    return `Afhaak ligt op ${kpi.value.dropoffPct}% voor dit scenario`
  }

  return `Afhaak ligt op ${kpi.value.dropoffPct}% voor dit scenario`
})

const behaviorSummary = computed(() => {
  const pathCounts = filteredSessions.value.reduce((acc, session) => {
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
    const groupSessions = filteredSessions.value.filter((session) => {
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

  const sessionSteps = deriveStepsFromSessions(filteredSessions.value)
  if (sessionSteps.length) return sessionSteps

  return [
    { key: 'step-1', title: 'Stap 1', desc: 'Onbekend', padA: 0, padB: 0, drop: 0 },
  ]
})

async function loadScenarios() {
  loadingScenarios.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')

    if (error) throw error

    const mapped = Array.isArray(data) ? data.map(mapScenario).filter(Boolean) : []
    scenarios.value = mapped

    if (mapped.length) {
      selectedScenarioKey.value = mapped[0].key
    } else {
      selectedScenarioKey.value = ''
      sessions.value = []
      reflections.value = []
      analyticsRows.value = []
    }
  } catch (error) {
    scenarios.value = []
    selectedScenarioKey.value = ''
    sessions.value = []
    reflections.value = []
    analyticsRows.value = []
    errorMessage.value = error?.message || 'Scenario\'s konden niet worden geladen.'
  } finally {
    loadingScenarios.value = false
  }
}

async function loadScenarioData() {
  if (!selectedScenario.value) return

  loadingScenarioData.value = true
  errorMessage.value = ''

  try {
    const [sessionRows, reflectionRows, analyticsData] = await Promise.all([
      loadSessionsForScenario(selectedScenario.value),
      loadReflectionsForScenario(selectedScenario.value),
      loadScenarioAnalytics(selectedScenario.value),
    ])

    sessions.value = sessionRows
    reflections.value = reflectionRows
    analyticsRows.value = analyticsData
  } catch (error) {
    sessions.value = []
    reflections.value = []
    analyticsRows.value = []
    errorMessage.value = error?.message || 'Inzichten konden niet worden geladen.'
  } finally {
    loadingScenarioData.value = false
  }
}

function mapScenario(record) {
  const id = getFirstString(record, ['id', 'scenario_id', 'uuid'])
  const slug = getFirstString(record, ['slug'])
  const title = getFirstString(record, ['title', 'name', 'display_name', 'slug']) || 'Onbekend scenario'
  const key = id || slug || title

  if (!key) return null

  return { key: String(key), id: id || '', slug: slug || '', title }
}

async function loadSessionsForScenario(scenario) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')

  if (error) throw error

  const rows = Array.isArray(data) ? data : []

  return rows
    .filter((record) => recordMatchesScenario(record, scenario))
    .map((record, index) => mapSession(record, index))
    .sort((left, right) => right.sortStamp - left.sortStamp)
}

async function loadReflectionsForScenario(scenario) {
  const { data, error } = await safeSelectTable('reflections')
  if (error) throw error

  const rows = Array.isArray(data) ? data : []
  return rows
    .filter((record) => recordMatchesScenario(record, scenario))
    .map((record, index) => mapReflection(record, index))
}

async function loadScenarioAnalytics(scenario) {
  const { data, error } = await safeSelectTable('scenario_analytics')
  if (error) throw error

  const rows = Array.isArray(data) ? data : []
  return rows.filter((record) => recordMatchesScenario(record, scenario))
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

function recordMatchesScenario(record, scenario) {
  const recordIdValues = collectRecordValues(record, [
    'scenario_id',
    'scenarioId',
    'id_scenario',
  ])

  // Prefer strict id matching whenever an id-like field exists on the record.
  if (recordIdValues.length) {
    if (!scenario.id) return false

    return recordIdValues.some((value) => String(value) === String(scenario.id))
  }

  const recordSlugValues = collectRecordValues(record, [
    'scenario_slug',
    'slug',
  ])

  // If slug-like fields are present, match strictly on slug.
  if (recordSlugValues.length) {
    if (!scenario.slug) return false

    return recordSlugValues.some((value) => normalizeText(value) === normalizeText(scenario.slug))
  }

  // Last fallback only when no scenario id/slug fields are available.
  const recordTitleValues = collectRecordValues(record, [
    'scenario_title',
    'scenario',
    'title',
    'scenario_name',
  ])

  return recordTitleValues.some((value) => normalizeText(value) === normalizeText(scenario.title))
}

function collectRecordValues(record, keys) {
  const values = []

  for (const key of keys) {
    const raw = record?.[key]

    if (typeof raw === 'string' && raw.trim()) {
      values.push(raw.trim())
      continue
    }

    if (typeof raw === 'number' && !Number.isNaN(raw)) {
      values.push(String(raw))
    }
  }

  return values
}

function mapSession(record, index) {
  const rawId = getFirstString(record, ['id', 'session_id', 'sessionId', 'uuid']) || `session-${index + 1}`
  const startDate = getFirstDate(record, ['started_at', 'start_at', 'start_time', 'created_at'])
  const endDate = getFirstDate(record, ['ended_at', 'end_at', 'end_time', 'updated_at'])
  const dateObj = startDate || endDate || getFirstDate(record, ['created_at'])
  const statusKey = normalizeStatusKey(getFirstString(record, ['status', 'state']))
  const path = getFirstString(record, ['path', 'selected_path', 'decision_path', 'result_path', 'choice'])
  const gender = normalizeGender(getFirstString(record, ['gender', 'user_gender', 'sex']))

  return {
    id: shortenId(rawId),
    statusKey,
    path,
    gender,
    dateObj,
    durationMinutes: getDurationFromRecord(record, startDate, endDate),
    step: getFirstString(record, ['step', 'current_step', 'session_step', 'stage']),
    date: formatDate(dateObj),
    sortStamp: dateObj?.getTime?.() || 0,
  }
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

  const source = rows[0]
  const candidates = [source?.step_analytics, source?.steps, source?.dropoff_steps]

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue

    const mapped = candidate.map((item, index) => {
      const title = getFirstString(item, ['title', 'label', 'step']) || `Stap ${index + 1}`
      const desc = getFirstString(item, ['desc', 'description']) || 'Onbekend'
      const padA = clampPercent(getFirstNumber(item, ['pad_a', 'path_a', 'a', 'padA']) ?? 0)
      const padB = clampPercent(getFirstNumber(item, ['pad_b', 'path_b', 'b', 'padB']) ?? 0)
      const drop = clampPercent(getFirstNumber(item, ['drop', 'dropoff', 'afhaak']) ?? 0)

      return {
        key: `step-analytics-${index}`,
        title,
        desc,
        padA,
        padB,
        drop,
      }
    })

    if (mapped.length) return mapped
  }

  return []
}

function deriveStepsFromSessions(sessionRows) {
  const groups = new Map()

  for (const session of sessionRows) {
    const rawStep = session.step
    if (!rawStep) continue

    const key = String(rawStep)
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

  return entries.map(([stepKey, value], index) => {
    const total = value.total || 1
    return {
      key: `step-session-${stepKey}`,
      title: `Stap ${index + 1}`,
      desc: String(stepKey),
      padA: Math.round((value.a / total) * 100),
      padB: Math.round((value.b / total) * 100),
      drop: Math.round((value.drop / total) * 100),
    }
  })
}

function calculatePathBreakdown(key, label, sessionRows) {
  const total = sessionRows.length
  const aCount = sessionRows.filter((session) => normalizePath(session.path) === 'A').length
  const bCount = sessionRows.filter((session) => normalizePath(session.path) === 'B').length
  const dropCount = sessionRows.filter((session) => session.statusKey === 'stopped').length

  return {
    key,
    label,
    padA: total ? Math.round((aCount / total) * 100) : 0,
    padB: total ? Math.round((bCount / total) * 100) : 0,
    drop: total ? Math.round((dropCount / total) * 100) : 0,
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

function normalizeStatusKey(status) {
  const value = normalizeText(status)
  if (value === 'completed' || value === 'voltooid') return 'completed'
  if (value === 'stopped' || value === 'gestopt') return 'stopped'
  if (value === 'active' || value === 'actief') return 'active'
  return 'unknown'
}

function normalizeStepOrder(stepValue) {
  const number = Number(String(stepValue).replace(/[^0-9]/g, ''))
  if (!Number.isNaN(number) && number > 0) return number
  return Number.MAX_SAFE_INTEGER
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function getDurationFromRecord(record, startDate, endDate) {
  const directMinutes = getFirstNumber(record, ['duration_minutes', 'duration', 'session_duration'])
  if (typeof directMinutes === 'number' && directMinutes > 0) return directMinutes

  if (startDate && endDate) {
    const diff = endDate.getTime() - startDate.getTime()
    if (diff > 0) return Math.round(diff / 60000)
  }

  return 0
}

function getFirstString(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }

  return ''
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

function getFirstDate(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (!value) continue

    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }

  return null
}

function shortenId(value) {
  const text = String(value)
  if (text.length <= 10) return text
  return text.slice(0, 10)
}

function formatDate(date) {
  if (!date) return 'Onbekend'

  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
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

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function clampPercent(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return 0
  return Math.min(100, Math.max(0, Math.round(number)))
}
</script>

<style scoped>
/* ---------- Base ---------- */
* { box-sizing: border-box }

/* Page layout */
.insights-view {
  padding: 0 var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ---------- Header / Tabs ---------- */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
  padding-top: 6px;
}
.title-block { display:flex; flex-direction:column; gap:14px }
.page-title { margin: 0; font-size: 48px; font-weight: 700; color: var(--color-neutral-900) }
.tabs { display:flex; gap:24px }
.tab-button { border: none; background: transparent; padding: 0; font-size: 18px; color: var(--color-neutral-800); cursor: pointer }
.tab-button.active { color: var(--color-neutral-900); font-weight: 600 }

/* ---------- KPI cards ---------- */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px }
.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  height: 106px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}
.kpi-card.big .kpi-label { color: var(--color-neutral-700); font-size: 14px }
.kpi-value { font-size: 34px; font-weight: 800; color: var(--color-primary-700); line-height: 1 }
.kpi-meta.success { color: var(--color-success); font-size: 13px; margin-top: 8px }

/* ---------- Selector (standalone) ---------- */
.selector-wrapper { margin-bottom: 0 }
.selector-card { padding: 0 }
.selector-card .select-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  background: var(--color-surface);
  box-sizing: border-box;
}

/* ---------- Cards row: two equal cards ---------- */
.cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: stretch; /* ensure equal heights */
}
.insights-card,
.behavior-card,
.reflections-card,
.behavior-breakdown,
.drop-per-step {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.cards-row > .insights-card,
.cards-row > .behavior-card { flex: 1 1 auto }

.section-title { margin: 0 0 12px 0; font-size: 18px; font-weight: 600 }

/* ---------- Insights grid & small cards ---------- */
.insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: stretch }
.small-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
}
.small-label { color: var(--color-neutral-700); font-size: 13px }
.small-value { font-size: 22px; font-weight: 700 }
.warning-box {
  grid-column: 1 / -1;
  background: rgba(255,235,230,0.9);
  border: 1px solid rgba(255,180,160,0.5);
  padding: 12px;
  border-radius: 10px;
  color: var(--color-danger);
}

/* ---------- Behavior cards inside the right column ---------- */
.behavior-grid-vertical { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
.behavior-card.small { padding: 12px }
.behavior-title { color: var(--color-neutral-700); font-weight: 600 }
.behavior-value { font-size: 22px; font-weight: 700 }
.behavior-meta { font-size: 13px; color: var(--color-neutral-700) }
.behavior-note { margin-top: 10px; color: var(--color-neutral-700) }

/* Make sure the right column card places the note at the bottom */
.cards-row > .behavior-card { justify-content: space-between }

/* ---------- Reflections table ---------- */
.table-wrap { overflow: hidden; border-radius: 12px; margin-top: 8px; border: 1px solid var(--color-border); background: var(--color-surface) }
.reflections-table { width: 100%; border-collapse: collapse }
.reflections-table thead th { text-align: left; color: #6d7280; font-size: 14px; padding: 16px 20px; border-bottom: 1px solid #e3e7ef }
.reflections-table td { padding: 18px 20px; border-bottom: 1px solid #e3e7ef; color: #6d7280; vertical-align: middle; height: 64px; white-space: normal }
.reflection-text { color: #374151; white-space: normal }
.reflection-row:hover { background: #fafbfe }
.pagination { display: flex; justify-content: flex-end; gap: 10px; padding-top: 10px }
.pagination-button { border: none; background: transparent; font-weight: 600; cursor: pointer }
.pagination-divider { width: 1px; height: 18px; background: var(--color-border) }

/* ---------- Gender breakdown (stacked bars) ---------- */
.gender-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px }
.gender-card {
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 10px;
  height: 107px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.gender-title { font-weight: 700; margin-bottom: 8px }
.progress-bar-container { display: flex; align-items: center }
.progress-full {
  width: 100%;
  background: var(--color-neutral-200);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  height: 46px;
}
.segment {
  height: 46px;
  display: flex;
  align-items: center;
  padding-left: 12px;
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
  white-space: nowrap;
}
.segment-a { background: var(--color-secondary-600); color: #fff }
.segment-b { background: var(--color-primary-600); color: #fff }
.segment-drop { background: var(--color-neutral-300); color: var(--color-text) }

/* ---------- Steps / Afhaak per stap ---------- */
.steps-outer {
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  padding: 24px 8px;
  box-shadow: var(--shadow-sm);
}
.step-row {
  display: grid;
  grid-template-columns: 180px 1fr 90px;
  align-items: center;
  column-gap: 24px;
  padding: 24px 8px;
  border-bottom: 1px solid var(--color-border);
}
.step-row:last-child { border-bottom: none }
.step-left { display: flex; flex-direction: column; gap: 6px }
.step-left .step-title { font-weight: 700 }
.step-left .step-desc { color: var(--color-neutral-700); font-size: 13px }
.step-center { width: 100%; display: flex; flex-direction: column; gap: 10px }
.bar-row { display: grid; grid-template-columns: auto 40px; align-items: center; gap: 12px }
.bar-wrap { display: block; width: 100% }
.bar-a,
.bar-b {
  height: 46px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 30px;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}
.bar-a { background: var(--color-secondary-600) }
.bar-b { background: var(--color-primary-600) }
.bar-text { display: inline-block }
.bar-percent { width: 40px; font-size: 14px; color: var(--color-text); text-align: left }
.step-right { width: 90px; justify-self: end }
.drop-card {
  width: 90px;
  min-height: 72px;
  border-radius: 8px;
  background: var(--color-neutral-100);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* ---------- Legend ---------- */
.legend { display: flex; gap: 12px; margin-top: 12px; align-items: center }
.legend-item { display: flex; gap: 8px; align-items: center; color: var(--color-neutral-700); font-size: 13px }
.dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block }
.dot.a { background: #0f5a78 }
.dot.b { background: var(--color-primary-600) }
.dot.drop { background: #eef2f6; border: 1px solid var(--color-border) }

/* ---------- Utilities / Accessibility ---------- */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0 }
</style>
