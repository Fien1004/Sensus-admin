import { computed, ref } from 'vue'
import { mapStepsForLoad } from '@/utils/scenarioStepModel'

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

export function useDashboardInsights() {
  const insights = ref([])
  const isLoading = ref(false)
  const errorMessage = ref('')
  const lastUpdated = ref('')

  const hasInsights = computed(() => insights.value.length > 0)
  const fallbackMessage = computed(() => {
    if (errorMessage.value) {
      return 'Inzichten konden niet worden berekend.'
    }

    return 'Nog onvoldoende sessies in de afgelopen 7 dagen om inzichten te tonen.'
  })

  async function loadDashboardInsights({ sessions = [], events = [], scenarios = [], now = new Date() } = {}) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      insights.value = buildWeeklyInsights({ sessions, events, scenarios, now }).slice(0, 2)
      lastUpdated.value = new Date().toISOString()
      return insights.value
    } catch (error) {
      insights.value = []
      errorMessage.value = error?.message || 'Inzichten konden niet worden berekend.'
      lastUpdated.value = new Date().toISOString()
      return []
    } finally {
      isLoading.value = false
    }
  }

  function clearDashboardInsights() {
    insights.value = []
    errorMessage.value = ''
    lastUpdated.value = ''
    isLoading.value = false
  }

  return {
    insights,
    hasInsights,
    isLoading,
    errorMessage,
    fallbackMessage,
    lastUpdated,
    loadDashboardInsights,
    clearDashboardInsights,
  }
}

function buildWeeklyInsights({ sessions = [], events = [], scenarios = [], now = new Date() } = {}) {
  const cutoff = new Date(now.getTime() - WEEK_IN_MS)
  const scenarioCatalog = buildScenarioCatalog(scenarios)
  const recentSessions = Array.isArray(sessions)
    ? sessions.filter((session) => {
        const sessionDate = getSessionDate(session)
        return Boolean(sessionDate) && sessionDate.getTime() >= cutoff.getTime()
      })
    : []

  if (!recentSessions.length) {
    return []
  }

  const sessionById = new Map()
  const eventsBySessionId = new Map()

  recentSessions.forEach((session) => {
    const sessionId = getSessionId(session)

    if (sessionId) {
      sessionById.set(sessionId, session)
    }
  })

  const recentSessionIds = new Set(sessionById.keys())

  Array.isArray(events) ? events.forEach((event) => {
    const sessionId = normalizeText(getFirstString(event, ['session_id', 'sessionId', 'session_uuid', 'sessionUuid']))

    if (!sessionId || !recentSessionIds.has(sessionId)) {
      return
    }

    if (!eventsBySessionId.has(sessionId)) {
      eventsBySessionId.set(sessionId, [])
    }

    eventsBySessionId.get(sessionId).push(event)
  }) : null

  const ownInputSessions = recentSessions.filter((session) => {
    const sessionId = getSessionId(session)
    const sessionEvents = sessionId ? eventsBySessionId.get(sessionId) || [] : []

    return sessionHasFreeTextInput(session, sessionEvents)
  }).length

  const scenarioCompletionCounts = new Map()
  recentSessions.forEach((session) => {
    if (!isCompletedSession(session)) {
      return
    }

    const scenarioKey = getSessionScenarioKey(session)
    const scenarioTitle = getScenarioTitle(session, scenarioCatalog)
    const current = scenarioCompletionCounts.get(scenarioKey) || { title: scenarioTitle, count: 0 }

    current.title = scenarioTitle
    current.count += 1
    scenarioCompletionCounts.set(scenarioKey, current)
  })

  const totalSessions = recentSessions.length
  const insights = []

  if (totalSessions > 0) {
    insights.push({
      id: 'own-input',
      icon: 'message-square',
      title: 'Eigen input gebruikt',
      text: `${Math.round((ownInputSessions / totalSessions) * 100)}% van de gebruikers gaf een eigen antwoord.`,
    })
  }

  const topScenario = getTopScenario(scenarioCompletionCounts)
  if (topScenario) {
    insights.push({
      id: 'top-scenario',
      icon: 'trophy',
      title: 'Populairste scenario',
      text: `'${topScenario.title}' werd het vaakst doorlopen.`,
    })
  }

  return insights
}

function buildScenarioCatalog(scenarios) {
  const catalog = new Map()

  if (!Array.isArray(scenarios)) {
    return catalog
  }

  scenarios.forEach((scenario) => {
    const scenarioKey = normalizeText(getFirstString(scenario, ['slug', 'scenario_slug', 'id']))
    if (!scenarioKey) {
      return
    }

    const steps = extractScenarioSteps(scenario)
    const stepLookup = new Map()

    steps.forEach((step, index) => {
      const stepId = normalizeText(getFirstString(step, ['id']))
      const label = buildStepLabel(step, index)

      if (!stepId) {
        return
      }

      stepLookup.set(stepId, {
        label,
        order: index,
      })
    })

    catalog.set(scenarioKey, {
      title: getScenarioTitleFromRecord(scenario),
      stepLookup,
    })
  })

  return catalog
}

function extractScenarioSteps(scenario) {
  const engineJson = getFirstObject(scenario, ['engine_json', 'engineJson'])
  const rawSteps = Array.isArray(engineJson?.steps)
    ? engineJson.steps
    : Array.isArray(scenario?.steps)
      ? scenario.steps
      : []

  return mapStepsForLoad(rawSteps)
}

function buildStepLabel(step, index) {
  const title = getFirstString(step, ['title', 'label'])
  if (title) {
    return title
  }

  return `Stap ${index + 1}`
}

function getScenarioTitle(session, scenarioCatalog) {
  const sessionScenarioKey = getSessionScenarioKey(session)
  const catalogEntry = scenarioCatalog.get(sessionScenarioKey)

  if (catalogEntry?.title) {
    return catalogEntry.title
  }

  return getSessionScenarioName(session)
}

function getScenarioTitleFromRecord(scenario) {
  return getFirstString(scenario, ['title', 'name']) || 'Onbekend scenario'
}

function getTopScenario(completionCounts) {
  const items = [...completionCounts.values()]

  if (!items.length) {
    return null
  }

  return items.sort((left, right) => right.count - left.count || left.title.localeCompare(right.title, 'nl-NL'))[0] || null
}

function isCompletedSession(session) {
  return getSessionStatusKey(session) === 'completed'
}

function sessionHasFreeTextInput(session, sessionEvents) {
  const sessionTextFields = [
    'custom_input',
    'customInput',
    'free_text',
    'freeText',
    'input_text',
    'inputText',
    'reflection_text',
    'reflectionText',
    'response_text',
    'responseText',
  ]

  if (getFirstString(session, sessionTextFields)) {
    return true
  }

  const answerLists = [
    session?.answers,
    session?.responses,
    session?.scenario_progress,
    session?.flow,
    session?.events,
    session?.steps,
    session?.path,
    sessionEvents,
  ]

  return answerLists.some((list) => {
    if (!Array.isArray(list)) {
      return false
    }

    return list.some((entry) => {
      if (!entry || typeof entry !== 'object') {
        return false
      }

      if (getFirstString(entry, sessionTextFields)) {
        return true
      }

      const inputType = normalizeText(getFirstString(entry, ['input_type', 'inputType', 'kind', 'type']))
      if (inputType === 'text' || inputType === 'textarea') {
        return true
      }

      return Boolean(getFirstBoolean(entry, ['is_custom_input', 'isCustomInput', 'custom_input', 'customInput']))
    })
  })
}

function getSessionScenarioKey(session) {
  return normalizeText(getFirstString(session, ['scenario_slug', 'scenarioSlug', 'scenario_id', 'scenarioId', 'slug']))
}

function getSessionScenarioName(session) {
  return getFirstString(session, ['scenario', 'scenario_name', 'scenarioTitle']) || 'Onbekend scenario'
}

function getSessionId(session) {
  return normalizeText(getFirstString(session, ['id', 'session_id', 'sessionId', 'uuid']))
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

function getSessionDate(session) {
  return getFirstDate(session, ['started_at', 'created_at', 'updated_at', 'finished_at', 'ended_at'])
}

function getFirstString(source, keys) {
  for (const key of keys) {
    const value = source?.[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }

  return ''
}

function getFirstObject(source, keys) {
  for (const key of keys) {
    const value = source?.[key]

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value
    }
  }

  return null
}

function getFirstBoolean(source, keys) {
  for (const key of keys) {
    const value = source?.[key]

    if (typeof value === 'boolean') {
      return value
    }

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

function getFirstDate(source, keys) {
  for (const key of keys) {
    const value = source?.[key]

    if (!value) {
      continue
    }

    const date = value instanceof Date ? value : new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  return null
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}