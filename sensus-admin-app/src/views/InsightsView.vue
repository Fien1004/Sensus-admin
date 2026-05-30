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
            <option v-if="!safeScenarios.length" value="">Geen scenario's beschikbaar</option>
            <option v-for="scenario in safeScenarios" :key="scenario.key" :value="scenario.key">
              Scenario: {{ scenario.title }}
            </option>
          </select>
        </label>
        <div v-if="loadingScenarios || loadingScenarioData" class="small-label">Data laden...</div>
        <div v-else-if="errorMessage" class="small-label">{{ errorMessage }}</div>
      </div>
    </div>

    <div class="cards-row">
      <div class="insights-card" v-if="selectedScenario">
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

      <div v-else class="insights-card">
        <h2 class="section-title">Kern inzichten voor dit scenario</h2>
        <div class="warning-box">Selecteer een scenario om scenario-inzichten te zien.</div>
      </div>

      <aside class="behavior-card" v-if="selectedScenario">
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

      <aside v-else class="behavior-card">
        <h3 class="section-title">Gedrag van gebruikers</h3>
        <div class="behavior-note">Selecteer een scenario om gedrag te analyseren.</div>
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
          <tbody v-else-if="safeReflections.length">
            <tr v-for="r in safeReflections" :key="r.key" class="reflection-row">
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
        <div class="gender-card" v-for="g in safeGenders" :key="g.key">
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
        <div class="step-row" v-for="step in safeSteps" :key="step.key">
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
import { formatDuration } from '@/utils/formatDuration'

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
const events = ref([])
const selectedScenario = computed(() => {
  return scenarios.value.find((scenario) => scenario.key === selectedScenarioKey.value) || null
})

const safeScenarios = computed(() => (Array.isArray(scenarios.value) ? scenarios.value : []))
const safeSessions = computed(() => (Array.isArray(sessions.value) ? sessions.value : []))
const safeEvents = computed(() => (Array.isArray(events.value) ? events.value : []))
const safeReflections = computed(() => (Array.isArray(reflections.value) ? reflections.value : []))

const selectedScenarioSlug = computed(() => normalizeText(selectedScenario.value?.slug))

const scenarioSessions = computed(() => {
  if (!selectedScenarioSlug.value) return []

  return safeSessions.value.filter((session) => normalizeText(session?.scenario_id) === selectedScenarioSlug.value)
})

const scenarioSessionMap = computed(() => new Map(
  scenarioSessions.value.map((session) => [String(session.id), session]),
))

const scenarioEvents = computed(() => {
  if (!scenarioSessions.value.length) return []

  const sessionIds = new Set(scenarioSessions.value.map((session) => String(session.id)))
  return safeEvents.value.filter((event) => sessionIds.has(String(event?.session_id)))
})

const scenarioChoiceEvents = computed(() => {
  return scenarioEvents.value.filter((event) => normalizeText(event.type) === 'choice')
})

const scenarioReflectionEvents = computed(() => {
  return scenarioEvents.value.filter((event) => normalizeText(event.type) === 'reflection')
})

const reflections = computed(() => {
  return scenarioReflectionEvents.value.map((event, index) => {
    const session = scenarioSessionMap.value.get(String(event.session_id))
    const sessionId = getFirstString(event, ['session_id', 'sessionId']) || session?.id || `reflection-${index + 1}`

    return {
      key: getFirstString(event, ['id']) || `${sessionId}-${index}`,
      id: shortenId(sessionId),
      date: formatDate(getFirstDate(event, ['created_at'])),
      age: session?.age ?? 'Onbekend',
      gender: session?.gender || 'Onbekend',
      text: getFirstString(event, ['value']) || 'Onbekend',
    }
  })
})

const scenarioKpi = computed(() => calculateSessionSummary(scenarioSessions.value))

onMounted(() => {
  void loadScenarios()
  void loadScenarioData()
})

const filteredSessions = computed(() => {
  const all = [...safeSessions.value]

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
  return calculateSessionSummary(filteredSessions.value)
})

const dropoffMeta = computed(() => {
  if (!filteredSessions.value.length) {
    return 'Geen vergelijkingsdata'
  }

  return 'Op basis van live sessiedata'
})

const warningText = computed(() => {
  if (!scenarioSessions.value.length) {
    return 'Geen sessiedata beschikbaar voor dit scenario'
  }

  if (scenarioKpi.value.dropoffPct >= 50) {
    return `Afhaak ligt op ${scenarioKpi.value.dropoffPct}% voor dit scenario`
  }

  return `Afhaak ligt op ${scenarioKpi.value.dropoffPct}% voor dit scenario`
})

const behaviorSummary = computed(() => {
  return calculateChoiceSummary(scenarioChoiceEvents.value)
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

      return group.matcher.includes(normalizeText(session.gender))
    })

    return calculateChoiceBreakdown(group.key, group.label, groupSessions, scenarioChoiceEvents.value)
  })
})

const steps = computed(() => {
  const eventSteps = deriveStepsFromEvents(scenarioChoiceEvents.value)
  if (eventSteps.length) return eventSteps

  return [
    { key: 'step-1', title: 'Stap 1', desc: 'Nog geen padgegevens beschikbaar', padA: 0, padB: 0, drop: 0 },
  ]
})

const safeGenders = computed(() => (Array.isArray(genders.value) ? genders.value : []))
const safeSteps = computed(() => (Array.isArray(steps.value) ? steps.value : []))

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
      events.value = []
    }
  } catch (error) {
    scenarios.value = []
    selectedScenarioKey.value = ''
    sessions.value = []
    events.value = []
    errorMessage.value = error?.message || 'Scenario\'s konden niet worden geladen.'
  } finally {
    loadingScenarios.value = false
  }
}

async function loadScenarioData() {
  loadingScenarioData.value = true
  errorMessage.value = ''

  try {
    const [sessionRows, eventRows] = await Promise.all([
      loadSessions(),
      loadEvents(),
    ])

    sessions.value = sessionRows
    console.log('sessions count', sessionRows.length)
    console.log('sessions', sessionRows)

    console.log('events count', eventRows.length)
    console.log('events', eventRows)

    events.value = eventRows
  } catch (error) {
    sessions.value = []
    events.value = []
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

async function loadSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, scenario_id, age, gender, started_at, ended_at, status')
    .order('started_at', { ascending: false })

  if (error) throw error

  const rows = Array.isArray(data) ? data : []

  return rows
    .map((record, index) => mapSession(record, index))
    .sort((left, right) => right.sortStamp - left.sortStamp)
}

async function loadEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('id, session_id, step_id, type, value, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error

  return Array.isArray(data) ? data : []
}

function mapSession(record, index) {
  const id = getFirstString(record, ['id']) || `session-${index + 1}`
  const scenarioId = getFirstString(record, ['scenario_id'])
  const startDate = getFirstDate(record, ['started_at'])
  const endDate = getFirstDate(record, ['ended_at'])
  const dateObj = startDate || endDate
  const status = getFirstString(record, ['status'])
  const statusKey = normalizeStatusKey(status)
  const gender = normalizeGender(getFirstString(record, ['gender']))

  return {
    id,
    shortId: shortenId(id),
    scenario_id: scenarioId,
    age: getFirstNumber(record, ['age']) ?? 'Onbekend',
    gender,
    started_at: startDate,
    ended_at: endDate,
    status,
    statusKey,
    dateObj,
    durationMs: getDurationFromDates(startDate, endDate),
    date: formatDate(dateObj),
    sortStamp: dateObj?.getTime?.() || 0,
  }
}

function deriveStepsFromEvents(eventRows) {
  const groups = new Map()

  for (const event of eventRows) {
    const type = normalizeText(event?.type)
    if (!type || type === 'reflection') continue

    const rawStep = getFirstString(event, ['step_id', 'stepId'])
    if (!rawStep) continue

    const key = String(rawStep)
    if (!groups.has(key)) {
      groups.set(key, { total: 0, a: 0, b: 0, drop: 0 })
    }

    const group = groups.get(key)
    group.total += 1

    const normalizedValue = extractChoiceSide(getFirstString(event, ['value', 'answer', 'choice', 'selected_choice']))
    if (normalizedValue === 'A') group.a += 1
    if (normalizedValue === 'B') group.b += 1
    if (type === 'dropoff' || type === 'stopped' || type === 'drop') group.drop += 1
  }

  const entries = Array.from(groups.entries())
  entries.sort((left, right) => normalizeStepOrder(left[0]) - normalizeStepOrder(right[0]))

  return entries.map(([stepKey, value], index) => {
    const total = value.total || 1
    return {
      key: `step-event-${stepKey}`,
      title: `Stap ${index + 1}`,
      desc: String(stepKey),
      padA: Math.round((value.a / total) * 100),
      padB: Math.round((value.b / total) * 100),
      drop: Math.round((value.drop / total) * 100),
    }
  })
}

function calculateChoiceBreakdown(key, label, sessionRows, choiceEvents) {
  const total = sessionRows.length
  const sessionIds = new Set(sessionRows.map((session) => String(session.id)))
  const choiceBySession = buildChoiceSideBySession(choiceEvents, sessionIds)

  let aCount = 0
  let bCount = 0
  let dropCount = 0

  for (const session of sessionRows) {
    const statusKey = normalizeStatusKey(session.status)

    if (statusKey === 'stopped') {
      dropCount += 1
      continue
    }

    const chosenSide = choiceBySession.get(String(session.id))
    if (chosenSide === 'A') {
      aCount += 1
    } else if (chosenSide === 'B') {
      bCount += 1
    }
  }

  return {
    key,
    label,
    padA: clampPercent(total ? Math.round((aCount / total) * 100) : 0),
    padB: clampPercent(total ? Math.round((bCount / total) * 100) : 0),
    drop: clampPercent(total ? Math.round((dropCount / total) * 100) : 0),
  }
}

function buildChoiceSideBySession(choiceEvents, sessionIds) {
  const choiceBySession = new Map()

  for (const event of choiceEvents) {
    const sessionId = String(event?.session_id || '')
    if (!sessionId || !sessionIds.has(sessionId) || choiceBySession.has(sessionId)) continue

    const side = extractChoiceSide(getFirstString(event, ['value', 'answer', 'choice', 'selected_choice', 'step_id']))
    if (side) {
      choiceBySession.set(sessionId, side)
    }
  }

  return choiceBySession
}

function calculateSessionSummary(sessionRows) {
  const total = sessionRows.length
  const completed = sessionRows.filter((session) => normalizeStatusKey(session.status) === 'completed').length
  const dropped = sessionRows.filter((session) => normalizeStatusKey(session.status) === 'stopped').length
  const durationValues = sessionRows
    .map((session) => session.durationMs)
    .filter((value) => typeof value === 'number' && value >= 0)

  const avgDuration = durationValues.length
    ? Math.round(durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length)
    : 0

  return {
    totalSessions: total,
    completedPct: total ? Math.round((completed / total) * 100) : 0,
    dropoffPct: total ? Math.round((dropped / total) * 100) : 0,
    avgDuration,
    avgDurationLabel: formatDuration(avgDuration),
  }
}

function calculateChoiceSummary(choiceEvents) {
  const counts = choiceEvents.reduce((acc, event) => {
    const side = extractChoiceSide(getFirstString(event, ['value', 'step_id']))
    if (side === 'A') acc.a += 1
    if (side === 'B') acc.b += 1
    return acc
  }, { a: 0, b: 0 })

  const total = counts.a + counts.b

  if (!total) {
    return {
      mostPopularPath: '-',
      leastPopularPath: '-',
      mostPopularPct: 0,
      leastPopularPct: 0,
      note: 'Nog geen padgegevens beschikbaar',
    }
  }

  const aPct = Math.round((counts.a / total) * 100)
  const bPct = Math.round((counts.b / total) * 100)
  const mostPopularPath = bPct >= aPct ? 'B' : 'A'
  const leastPopularPath = bPct >= aPct ? 'A' : 'B'

  return {
    mostPopularPath,
    leastPopularPath,
    mostPopularPct: Math.max(aPct, bPct),
    leastPopularPct: Math.min(aPct, bPct),
    note: `${Math.max(aPct, bPct)}% kiest pad ${mostPopularPath} in dit scenario`,
  }
}

function extractChoiceSide(value) {
  const text = normalizeText(value)
  if (!text) return ''

  const aMatches = ['a', 'pad a', 'path a', 'choice a', 'option a', 'antwoord a']
  const bMatches = ['b', 'pad b', 'path b', 'choice b', 'option b', 'antwoord b']

  if (aMatches.some((item) => text === item || text.includes(item))) return 'A'
  if (bMatches.some((item) => text === item || text.includes(item))) return 'B'

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

function getDurationFromDates(startDate, endDate) {
  if (!startDate || !endDate) return 0

  const diff = endDate.getTime() - startDate.getTime()
  return diff > 0 ? diff : 0
}

function getDurationFromRecord(record, startDate, endDate) {
  return getDurationFromDates(startDate, endDate)
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
