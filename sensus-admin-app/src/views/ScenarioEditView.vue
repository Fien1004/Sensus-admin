<template>
  <main class="scenario-create-view">
    <section v-if="isLoading" class="editor-shell">
      <section class="editor-panel card">
        <p class="section-title">Scenario laden...</p>
      </section>
    </section>

    <section v-else-if="loadError" class="editor-shell">
      <section class="editor-panel card">
        <div class="save-error" role="alert">
          {{ loadError }}
        </div>
      </section>
    </section>

    <template v-else>
      <header class="page-header">
        <div class="title-block">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <span class="save-status" :class="`save-status--${saveStatusClass}`">
            <span class="save-status-dot" aria-hidden="true"></span>
            {{ saveStatus }}
          </span>
        </div>

        <div class="actions">
          <button type="button" class="action-button save-button" :disabled="isSaving" @click="handleSave('draft')">
            {{ isSaving ? 'Opslaan...' : '+ Opslaan' }}
          </button>
          <button type="button" class="action-button publish-button" :disabled="isSaving" @click="handleSave('published')">Publiceren</button>
          <button type="button" class="action-button cancel-button" @click="handleCancel">Annuleer</button>
        </div>
      </header>

      <section class="flow-nav-row" aria-label="Scenario flow navigatie">
        <nav class="flow-nav-scroll" aria-label="Stappen" role="tablist">
          <template v-for="step in flowSteps" :key="step.id">
            <div v-if="step.type === 'question'" class="flow-tab-group">
              <button
                type="button"
                class="flow-tab"
                :class="{ active: selectedStepKey === step.id }"
                role="tab"
                :aria-selected="selectedStepKey === step.id"
                @click="selectStep(step.id)"
              >
                {{ step.label }}
              </button>

              <button
                v-if="step.canDelete"
                type="button"
                class="flow-tab-delete"
                aria-label="Verwijder vraag"
                title="Verwijder vraag"
                @click.stop="removeQuestionStep(step.id)"
              >
                ×
              </button>
            </div>

            <button
              v-else
              type="button"
              class="flow-tab"
              :class="{ active: selectedStepKey === step.id }"
              role="tab"
              :aria-selected="selectedStepKey === step.id"
              @click="selectStep(step.id)"
            >
              {{ step.label }}
            </button>
          </template>
        </nav>

        <button type="button" class="flow-add-button" @click="handleAddStep">+ Vraag toevoegen</button>
      </section>

      <section class="editor-shell">
        <section class="editor-panel card">
          <div v-if="saveSuccess" class="save-success" role="status">
            {{ saveSuccess }}
          </div>

          <div v-if="saveError" class="save-error" role="alert">
            {{ saveError }}
          </div>

          <div v-if="selectedStepKey === 'intro'" class="form-block">
          <h2 class="section-title">Basisinfo</h2>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Scenario naam</span>
              <input v-model="scenario.title" type="text" class="field-input" placeholder="Naam" />
            </label>

            <label class="field">
              <span class="field-label">Thema</span>
              <input v-model="scenario.theme" type="text" class="field-input" placeholder="Thema's" />
            </label>
          </div>

          <label class="field field-wide">
            <span class="field-label">Korte beschrijving</span>
            <textarea v-model="scenario.description" class="field-textarea" placeholder="Beschrijving"></textarea>
          </label>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Intro titel</span>
              <input v-model="scenario.intro.title" type="text" class="field-input" placeholder="Titel" />
            </label>

            <label class="field">
              <span class="field-label">Duur</span>
              <input v-model="scenario.duration" type="text" class="field-input" placeholder="5 minuten" />
            </label>
          </div>

          <label class="field field-wide">
            <span class="field-label">Intro body</span>
            <textarea v-model="scenario.intro.body" class="field-textarea" placeholder="Intro tekst"></textarea>
          </label>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Knoptekst</span>
              <input v-model="scenario.intro.button" type="text" class="field-input" placeholder="Start scenario" />
            </label>

            <label class="field">
              <span class="field-label">Notitie</span>
              <input v-model="scenario.intro.note" type="text" class="field-input" placeholder="Dit scenario duurt ongeveer 5 minuten." />
            </label>
          </div>
        </div>

          <div v-else-if="currentStep?.type === 'question'" class="form-block">
              <h2 class="section-title">Vraag {{ currentStepIndex + 1 }}</h2>

              <label class="field field-wide">
                <span class="field-label">Titel</span>
                <input v-model="currentStep.title" type="text" class="field-input" placeholder="Titel" />
              </label>

              <label class="field field-wide">
                <span class="field-label">Beschrijving</span>
                <textarea v-model="currentStep.description" class="field-textarea" placeholder="Beschrijving"></textarea>
              </label>

              <label class="field field-wide">
                <span class="field-label">Vraag</span>
                <input v-model="currentStep.question" type="text" class="field-input" placeholder="Vraag" />
              </label>

              <label class="field field-wide">
                <span class="field-label">Layout</span>
                <select v-model="currentStep.layout" class="field-input">
                  <option value="chat">Chat</option>
                  <option value="narrative">Narrative</option>
                </select>
              </label>

              <div v-if="currentStep.layout === 'chat'" class="form-block">
                <h3 class="section-title">Chatberichten</h3>
                <div v-for="(msg, msgIndex) in currentStep.chatMessages" :key="msgIndex" class="chat-message-row">
                  <select v-model="msg.sender" class="field-input chat-sender-select">
                    <option value="user">you</option>
                    <option value="other">other</option>
                  </select>
                  <input v-model="msg.text" type="text" class="field-input" placeholder="Tekst" />
                  <input v-model="msg.time" type="time" class="field-input" />
                  <button type="button" class="flow-tab-delete" @click="removeChatMessage(msgIndex)">×</button>
                </div>
                <button type="button" class="flow-add-button" @click="addChatMessage">+ Chatbericht toevoegen</button>
              </div>

              <div v-else class="form-block">
                <h3 class="section-title">Content card</h3>
                <label class="field field-wide">
                  <span class="field-label">Tekst</span>
                  <textarea v-model="currentStep.contentCard.text" class="field-textarea" placeholder="Tekst"></textarea>
                </label>
                <label class="field field-wide">
                  <span class="field-label">Cursieve actie tekst</span>
                  <input v-model="currentStep.contentCard.italicText" type="text" class="field-input" placeholder="(komt nog iets dichter staan)" />
                </label>
              </div>

            <div class="question-options">
            <div v-for="(option, optionIndex) in currentQuestion.options" :key="optionIndex" class="question-option-row">
              <label class="question-option-label">Keuze {{ optionIndex + 1 }}</label>

              <input
                v-model="option.label"
                type="text"
                class="question-option-input"
                placeholder="Schrijf hier iets"
              />

              <span class="question-option-arrow" aria-hidden="true">&gt;</span>

              <select v-model="option.next" class="question-option-select">
                <option disabled value="">Selectie</option>
                <option v-for="step in nextStepOptions" :key="step.value" :value="step.value">
                  {{ step.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="question-actions">
            <button type="button" class="question-add-choice" @click="addQuestionOption">+ Keuze toevoegen</button>

            <label class="question-custom-input-toggle">
              <input v-model="currentQuestion.allowCustomInput" type="checkbox" />
              <span>Eigen input</span>
            </label>
          </div>
        </div>

          <div v-else-if="selectedStepKey === 'reflection'" class="form-block">
          <h2 class="section-title">Reflectie</h2>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Reflectie titel</span>
              <input v-model="scenario.reflection.title" type="text" class="field-input" placeholder="Titel" />
            </label>

            <label class="field">
              <span class="field-label">Reflectie vraag</span>
              <input v-model="scenario.reflection.question" type="text" class="field-input" placeholder="Vraag" />
            </label>
          </div>

          <label class="field field-wide">
            <span class="field-label">Reflectie body</span>
            <textarea v-model="scenario.reflection.body" class="field-textarea" placeholder="Reflectietekst"></textarea>
          </label>
        </div>

          <div v-else-if="selectedStepKey === 'ending'" class="form-block">
          <h2 class="section-title">Afsluiting</h2>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Afsluit titel</span>
              <input v-model="scenario.ending.title" type="text" class="field-input" placeholder="Titel" />
            </label>
          </div>

          <label class="field field-wide">
            <span class="field-label">Afsluit tekst</span>
            <textarea v-model="scenario.ending.body" class="field-textarea" placeholder="Afsluitende tekst"></textarea>
          </label>
        </div>
        </section>

        <aside class="preview-panel card">
          <h2 class="preview-title">Live preview</h2>

          <div class="preview-card">
            <template v-if="selectedStepKey === 'intro'">
              <p class="preview-heading">{{ scenario.title || 'Naam' }}</p>
              <p class="preview-text">{{ scenario.intro.title || scenario.description || 'Beschrijving' }}</p>
              <p class="preview-body">{{ scenario.intro.body || 'Introductie van het scenario.' }}</p>
              <button type="button" class="preview-button">{{ scenario.intro.button || 'Start scenario' }}</button>
              <p class="preview-note">{{ scenario.intro.note || 'Dit scenario duurt ongeveer 5 minuten.' }}</p>
            </template>

            <template v-else-if="currentStep?.type === 'question'">
              <ChatScenarioPreview v-if="currentStep.layout === 'chat'" :step="currentStep" />
              <NarrativeScenarioPreview v-else :step="currentStep" />
            </template>

            <template v-else-if="selectedStepKey === 'reflection'">
              <p class="preview-heading">{{ scenario.reflection.title || 'Reflectie' }}</p>
              <p class="preview-text">{{ scenario.reflection.question || 'Reflectievraag' }}</p>
              <p class="preview-body">{{ scenario.reflection.body || 'Reflectietekst' }}</p>
            </template>

            <template v-else>
              <p class="preview-heading">{{ scenario.ending.title || 'Afsluiting' }}</p>
              <p class="preview-body">{{ scenario.ending.body || 'Afsluitende tekst' }}</p>
            </template>
          </div>
        </aside>
      </section>
    </template>
  </main>
</template>

<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import ChatScenarioPreview from '@/components/ChatScenarioPreview.vue'
import NarrativeScenarioPreview from '@/components/NarrativeScenarioPreview.vue'

const route = useRoute()
const router = useRouter()

const scenarioId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const isEditMode = computed(() => route.name === 'ScenarioEdit' || route.path.includes('/edit'))
const pageTitle = 'Scenario bewerken'

function createQuestionStep(index, overrides = {}) {
  return {
    id: `step-${index + 1}`,
    type: 'question',
    layout: index === 1 ? 'narrative' : 'chat',
    title: '',
    description: '',
    question: '',
    allowCustomInput: index === 2,
    options: [
      { label: '', next: '' },
      { label: '', next: '' },
    ],
    chatMessages: [
      { sender: 'user', text: '', time: '' },
      { sender: 'other', text: '', time: '' },
    ],
    contentCard: { text: '', italicText: '' },
    ...overrides,
  }
}

function createDefaultScenarioState() {
  return {
    title: '',
    description: '',
    theme: '',
    duration: '5 minuten',
    intro: {
      title: '',
      description: '',
      body: '',
      button: 'Start scenario',
      note: 'Dit scenario duurt ongeveer 5 minuten.',
    },
    questionSteps: [createQuestionStep(0), createQuestionStep(1), createQuestionStep(2)],
    reflection: {
      title: '',
      body: '',
      question: '',
    },
    ending: {
      title: '',
      body: '',
    },
  }
}

function normalizeEngineJson(engineJson) {
  if (!engineJson) return {}

  if (typeof engineJson === 'string') {
    try {
      return JSON.parse(engineJson)
    } catch {
      return {}
    }
  }

  if (typeof engineJson === 'object') {
    return engineJson
  }

  return {}
}

function normalizeQuestionOptions(options) {
  const normalizedOptions = Array.isArray(options)
    ? options.map((option) => ({
        label: typeof option?.label === 'string' ? option.label : '',
        next: typeof option?.next === 'string' ? option.next : '',
      }))
    : []

  while (normalizedOptions.length < 2) {
    normalizedOptions.push({ label: '', next: '' })
  }

  return normalizedOptions
}

const scenario = reactive(createDefaultScenarioState())
const selectedStepKey = ref('intro')
const saveError = ref('')
const saveSuccess = ref('')
const isSaving = ref(false)
const hasUnsavedChanges = ref(false)
const saveStatus = ref('Niet opgeslagen')
let autosaveTimeoutId = null
const isLoading = ref(true)
const loadError = ref('')

const currentStep = computed(() => scenario.questionSteps.find((step) => step.id === selectedStepKey.value) || null)
const currentStepIndex = computed(() => scenario.questionSteps.findIndex((step) => step.id === selectedStepKey.value))
const editorSteps = computed(() =>
  scenario.questionSteps.map((step, index) => ({
    id: step.id,
    label: step.title || `Vraag ${index + 1}`,
  })),
)
const currentQuestion = computed(() => currentStep.value || { layout: 'chat', options: [] })
const flowSteps = computed(() => [
  { id: 'intro', label: 'Intro', type: 'static' },
  ...editorSteps.value.map((step, index) => ({
    id: step.id,
    label: step.label,
    type: 'question',
    canDelete: index > 0,
  })),
  { id: 'reflection', label: 'Reflectie', type: 'static' },
  { id: 'ending', label: 'Afsluiting', type: 'static' },
])
const nextStepOptions = computed(() => [
  { value: 'reflection', label: 'Reflectie' },
  { value: 'ending', label: 'Afsluiting' },
  ...editorSteps.value.map((step) => ({ value: step.id, label: step.label })),
])

function resetScenarioState() {
  Object.assign(scenario, createDefaultScenarioState())
  selectedStepKey.value = 'intro'
}

function clearAutosaveTimer() {
  if (autosaveTimeoutId) {
    clearTimeout(autosaveTimeoutId)
    autosaveTimeoutId = null
  }
}

function markDirty() {
  hasUnsavedChanges.value = true

  if (isLoading.value) return
  if (!scenarioId.value) {
    saveStatus.value = 'Niet opgeslagen'
    clearAutosaveTimer()
    return
  }

  saveStatus.value = 'Niet opgeslagen'
  clearAutosaveTimer()
  autosaveTimeoutId = setTimeout(() => {
    void runAutosave()
  }, 1500)
}

const saveStatusClass = computed(() => {
  if (saveStatus.value === 'Opslaan...') return 'saving'
  if (saveStatus.value === 'Opgeslagen') return 'success'
  if (saveStatus.value === 'Opslaan mislukt') return 'error'
  return 'idle'
})

async function runAutosave() {
  clearAutosaveTimer()

  if (isLoading.value) return
  if (!scenarioId.value) {
    saveStatus.value = 'Niet opgeslagen'
    return
  }

  const errors = validateEditorState()
  if (errors.length > 0) {
    saveStatus.value = 'Opslaan mislukt'
    saveError.value = errors.join(' ')
    return
  }

  saveError.value = ''
  saveSuccess.value = ''
  saveStatus.value = 'Opslaan...'
  isSaving.value = true

  try {
    const payload = buildScenarioPayload()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('scenarios')
      .update({
        title: payload.title,
        slug: slugify(payload.title),
        description: payload.description,
        theme: payload.theme,
        duration: payload.duration,
        engine_json: {
          intro: payload.intro,
          steps: payload.steps,
        },
        updated_at: now,
      })
      .eq('id', scenarioId.value)

    if (error) throw error

    hasUnsavedChanges.value = false
    saveStatus.value = 'Opgeslagen'
  } catch (error) {
    console.error(error)
    saveStatus.value = 'Opslaan mislukt'
    saveError.value = error?.message || 'Autosave mislukt'
  } finally {
    isSaving.value = false
  }
}

function selectStep(stepId) {
  selectedStepKey.value = stepId
}

function calculateQuestionProgress(index, totalQuestions) {
  const totalSteps = totalQuestions + 2
  return Math.round(((index + 1) / totalSteps) * 100)
}

function getDefaultNextStep(questionIndex, questionCount) {
  return questionIndex < questionCount - 1 ? scenario.questionSteps[questionIndex + 1].id : 'reflectie'
}

function normalizeNextStep(nextStep, fallbackStep) {
  if (!nextStep) return fallbackStep

  if (nextStep === 'reflection') return 'reflectie'
  if (nextStep === 'ending') return 'end'

  return nextStep
}

function buildQuestionStep(question, index, questionCount) {
  const defaultNextStep = getDefaultNextStep(index, questionCount)
  const options = question.options
    .filter((option) => option.label.trim())
    .map((option) => ({
      label: option.label.trim(),
      next: normalizeNextStep(option.next, defaultNextStep),
    }))

  const description = question.description.trim() || question.question.trim()

  return {
    id: question.id,
    type: 'question',
    layout: question.layout,
    title: question.title,
    description,
    question: question.question,
    inputType: 'choice',
    allowCustomInput: question.allowCustomInput,
    options,
    // include chat or narrative content depending on layout
    ...(question.layout === 'chat' ? { chatMessages: Array.isArray(question.chatMessages) ? question.chatMessages.map((m) => ({ sender: m.sender === 'user' ? 'user' : 'other', text: m.text || '', time: m.time || '' })) : [] } : {}),
    ...(question.layout === 'narrative' ? { contentCard: { text: question.contentCard?.text || '', italicText: question.contentCard?.italicText || '' } } : {}),
    progress: calculateQuestionProgress(index, questionCount),
  }
}

function validateEditorState() {
  const errors = []

  if (!scenario.title.trim()) errors.push('Scenario naam is verplicht.')
  if (!scenario.description.trim()) errors.push('Scenario beschrijving is verplicht.')
  if (!scenario.theme.trim()) errors.push('Thema is verplicht.')
  if (!scenario.intro.title.trim()) errors.push('Intro titel is verplicht.')
  if (scenario.questionSteps.length < 1) errors.push('Minstens 1 vraag is verplicht.')

  scenario.questionSteps.forEach((question, index) => {
    const questionNumber = index + 1
    const filledOptions = question.options.filter((option) => option.label.trim())

    if (!question.title.trim()) {
      errors.push(`Vraag ${questionNumber}: titel is verplicht.`)
    }

    if (!question.question.trim()) {
      errors.push(`Vraag ${questionNumber}: vraag is verplicht.`)
    }

    if (!question.layout) {
      errors.push(`Vraag ${questionNumber}: layout is verplicht.`)
    }

    if (filledOptions.length < 2) {
      errors.push(`Vraag ${questionNumber} moet minstens 2 ingevulde opties hebben.`)
    }

    if (question.options.some((option) => option.next === question.id)) {
      errors.push('Een keuze mag niet naar dezelfde stap verwijzen.')
    }
  })

  if (!scenario.reflection.title.trim()) errors.push('Reflectie titel is verplicht.')
  if (!scenario.reflection.question.trim()) errors.push('Reflectie vraag is verplicht.')
  if (!scenario.ending.title.trim()) errors.push('Afsluit titel is verplicht.')

  return errors
}

function buildScenarioPayload() {
  const questionCount = scenario.questionSteps.length
  const steps = scenario.questionSteps.map((question, index) => buildQuestionStep(question, index, questionCount))

  steps.push({
    id: 'reflectie',
    type: 'reflection',
    title: scenario.reflection.title,
    description: scenario.reflection.body,
    question: scenario.reflection.question,
    progress: calculateQuestionProgress(questionCount, questionCount),
  })

  steps.push({
    id: 'end',
    type: 'ending',
    title: scenario.ending.title,
    description: scenario.ending.body,
    progress: 100,
  })

  return {
    title: scenario.title,
    description: scenario.description,
    theme: scenario.theme,
    duration: scenario.duration,
    intro: {
      ...scenario.intro,
      description: scenario.intro.description || scenario.description,
    },
    steps,
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function addStep() {
  const nextIndex = scenario.questionSteps.length + 1
  scenario.questionSteps.push({
    id: `step-${nextIndex}`,
    type: 'question',
    layout: 'chat',
    title: '',
    description: '',
    question: '',
    allowCustomInput: false,
    options: [
      { label: '', next: '' },
      { label: '', next: '' },
    ],
  })
  selectedStepKey.value = `step-${nextIndex}`
}

function removeQuestionStep(stepId) {
  if (scenario.questionSteps.length <= 1) return

  const stepIndex = scenario.questionSteps.findIndex((step) => step.id === stepId)
  if (stepIndex <= 0) return

  const wasActive = selectedStepKey.value === stepId
  const fallbackStep = scenario.questionSteps[stepIndex - 1] || scenario.questionSteps[0]

  scenario.questionSteps.splice(stepIndex, 1)

  if (wasActive) {
    selectedStepKey.value = fallbackStep.id
  }
}

function addQuestionOption() {
  if (!currentStep.value) return

  currentStep.value.options.push({ label: '', next: '' })
}

function addChatMessage() {
  if (!currentStep.value) return
  if (!Array.isArray(currentStep.value.chatMessages)) currentStep.value.chatMessages = []
  currentStep.value.chatMessages.push({ sender: 'user', text: '', time: '' })
}

function removeChatMessage(index) {
  if (!currentStep.value || !Array.isArray(currentStep.value.chatMessages)) return
  currentStep.value.chatMessages.splice(index, 1)
}

async function loadScenarioIntoEditor() {
  isLoading.value = true
  loadError.value = ''
  saveError.value = ''
  saveSuccess.value = ''
  resetScenarioState()

  try {
    if (!isEditMode.value) {
      throw new Error('Scenario niet gevonden.')
    }

    const id = scenarioId.value

    if (!id) {
      throw new Error('Scenario niet gevonden.')
    }

    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Scenario niet gevonden.')
    }

    const engineJson = normalizeEngineJson(data.engine_json)
    const steps = Array.isArray(engineJson.steps) ? engineJson.steps : []
    const questionSteps = steps
      .filter((step) => step?.type === 'question')
      .map((step, index) => ({
        id: typeof step?.id === 'string' && step.id.trim() ? step.id : `step-${index + 1}`,
        type: 'question',
        layout: step?.layout || 'chat',
        title: typeof step?.title === 'string' ? step.title : '',
        description: typeof step?.description === 'string' ? step.description : '',
        question: typeof step?.question === 'string' ? step.question : '',
        allowCustomInput: Boolean(step?.allowCustomInput),
        options: normalizeQuestionOptions(step?.options),
        chatMessages: Array.isArray(step?.chatMessages)
          ? step.chatMessages.map((m) => ({ sender: m?.sender === 'user' ? 'user' : 'other', text: typeof m?.text === 'string' ? m.text : '', time: typeof m?.time === 'string' ? m.time : '' }))
          : [
              { sender: 'user', text: '', time: '' },
              { sender: 'other', text: '', time: '' },
            ],
        contentCard: typeof step?.contentCard === 'object' && step.contentCard !== null ? { text: step.contentCard.text || '', italicText: step.contentCard.italicText || '' } : { text: '', italicText: '' },
      }))
    const reflectionStep = steps.find((step) => step?.type === 'reflection') || {}
    const endingStep = steps.find((step) => step?.type === 'ending') || {}

    scenario.title = data.title || ''
    scenario.description = data.description || ''
    scenario.theme = data.theme || ''
    scenario.duration = data.duration || '5 minuten'
    scenario.intro = engineJson.intro || {
      title: '',
      description: data.description || '',
      body: '',
      button: 'Start scenario',
      note: 'Dit scenario duurt ongeveer 5 minuten.',
    }
    scenario.questionSteps = questionSteps.length > 0 ? questionSteps : createDefaultScenarioState().questionSteps
    scenario.reflection = {
      title: typeof reflectionStep.title === 'string' ? reflectionStep.title : '',
      body: typeof reflectionStep.description === 'string' ? reflectionStep.description : '',
      question: typeof reflectionStep.question === 'string' ? reflectionStep.question : '',
    }
    scenario.ending = {
      title: typeof endingStep.title === 'string' ? endingStep.title : '',
      body: typeof endingStep.description === 'string' ? endingStep.description : '',
    }
    selectedStepKey.value = 'intro'
  } catch (error) {
    console.error(error)
    loadError.value = error?.message || 'Scenario kon niet worden geladen.'
  } finally {
    isLoading.value = false
  }
}

async function handleSave(status = 'draft') {
  const errors = validateEditorState()

  if (errors.length > 0) {
    saveError.value = errors.join(' ')
    saveSuccess.value = ''
    return
  }

  saveError.value = ''
  saveSuccess.value = ''
  isSaving.value = true

  const payload = buildScenarioPayload()
  const isPublished = status === 'published'
  const now = new Date().toISOString()

  try {
    const scenarioSlug = slugify(payload.title)

    if (!scenarioSlug) {
      throw new Error('Ongeldige scenario naam voor slug')
    }

    const { error } = await supabase
      .from('scenarios')
      .update({
        title: payload.title,
        slug: scenarioSlug,
        description: payload.description,
        theme: payload.theme,
        duration: payload.duration,
        engine_json: {
          intro: payload.intro,
          steps: payload.steps,
        },
        updated_at: now,
        is_active: isPublished,
        published_at: isPublished ? now : null,
      })
      .eq('id', scenarioId.value)

    if (error) {
      throw error
    }

    saveSuccess.value = isPublished ? 'Scenario gepubliceerd' : 'Scenario opgeslagen als concept'
  } catch (error) {
    console.error(error)
    saveError.value = error?.message || 'Opslaan mislukt'
  } finally {
    isSaving.value = false
  }
}

function handleCancel() {
  router.push('/scenarios')
}

watch(
  scenarioId,
  () => {
    void loadScenarioIntoEditor()
  },
  { immediate: true },
)

// watch entire scenario for changes (deep) to trigger autosave
watch(
  scenario,
  () => {
    if (isLoading.value) return
    markDirty()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  clearAutosaveTimer()
})
</script>

<style scoped>
.scenario-create-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 var(--space-5) var(--space-5);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-top: 6px;
}

.page-title {
  margin: 0;
  font-size: 48px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-neutral-900);
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.action-button {
  border: none;
  border-radius: 16px;
  padding: 16px 26px;
  font-family: var(--font-family-base);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.flow-nav-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.flow-nav-scroll {
  display: flex;
  align-items: center;
  gap: 18px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 2px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.flow-tab-group {
  display: inline-flex;
  align-items: center;
  gap: 0;
  flex: 0 0 auto;
  position: relative;
  transition: padding-right 0.15s ease;
}

.flow-tab-group:hover,
.flow-tab-group:focus-within {
  padding-right: 16px;
}

.flow-tab-group:hover .flow-tab-delete,
.flow-tab-group:focus-within .flow-tab-delete {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.flow-tab {
  flex: 0 0 auto;
  border: none;
  border-radius: 0;
  padding: 8px 4px;
  background: transparent;
  color: #454147;
  font-family: var(--font-family-base);
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
}

.flow-tab-delete {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #9ca3af;
  font-family: var(--font-family-base);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, color 0.15s ease, visibility 0.15s ease;
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
}

.flow-tab-delete:hover {
  color: #1f252d;
}

.flow-tab.active {
  border-bottom: 3px solid #064660;
  background: transparent;
  border-radius: 0;
  padding: 8px 4px;
  color: #1f252d;
  font-weight: 700;
}

.flow-add-button {
  border: none;
  border-radius: 10px;
  padding: 11px 18px;
  background: #064660;
  color: #ffffff;
  font-family: var(--font-family-base);
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  height: 38px;
}

.save-button {
  background: #0d5778;
  color: var(--color-surface);
}

.publish-button {
  background: #cde4ef;
  color: #0d5778;
}

.cancel-button {
  background: #a50a7e;
  color: var(--color-surface);
}

.editor-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 16px;
  align-items: start;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
}

.editor-panel {
  min-height: 540px;
  padding: 22px;
}

.save-success,
.save-error {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
}

.save-success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.save-error {
  padding: 12px 14px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title,
.preview-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--color-neutral-900);
}

.field-grid,
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-option-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) auto 140px;
  gap: 12px;
  align-items: center;
}

.question-option-label {
  font-size: 16px;
  color: #374151;
}

.question-option-input,
.question-option-select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: var(--color-surface);
  padding: 12px 14px;
  font-family: var(--font-family-base);
  font-size: 16px;
  color: var(--color-neutral-900);
  outline: none;
}

.question-option-select {
  min-width: 0;
}

.question-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.question-preview--narrative .preview-text {
  display: none;
}

.question-option-arrow {
  color: #6b7280;
  font-size: 18px;
  line-height: 1;
}

.question-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.question-add-choice {
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  background: #0d5778;
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.question-custom-input-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #374151;
}

.question-custom-input-toggle input {
  width: 18px;
  height: 18px;
}

.field-wide {
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 16px;
  color: #374151;
}

.field-input,
.field-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: var(--color-surface);
  padding: 12px 14px;
  font-family: var(--font-family-base);
  font-size: 16px;
  color: var(--color-neutral-900);
  outline: none;
}

.field-textarea {
  min-height: 74px;
  resize: vertical;
}

.preview-panel {
  padding: 18px;
  min-height: 540px;
}

.preview-card {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-heading {
  margin: 0;
  font-size: 24px;
  line-height: 1.15;
  font-weight: 700;
  color: var(--color-neutral-900);
}

.preview-text,
.preview-body,
.preview-note {
  margin: 0;
  color: var(--color-neutral-700);
  font-size: 16px;
  line-height: 1.5;
}

.preview-button {
  margin-top: 6px;
  border: none;
  border-radius: 14px;
  padding: 14px 20px;
  background: #a50a7e;
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.preview-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #ffffff;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #111827;
  font-size: 16px;
  font-family: var(--font-family-base);
}

.preview-option-custom {
  background: #f9fafb;
}

@media (max-width: 1100px) {
  .flow-nav-row {
    grid-template-columns: 1fr;
  }

  .editor-shell {
    grid-template-columns: 1fr;
  }

  .step-sidebar,
  .editor-panel,
  .preview-panel {
    min-height: auto;
  }
}

.save-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1;
}

.save-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-text-soft);
  flex: 0 0 auto;
}

.save-status--saving {
  color: var(--color-secondary-700);
}

.save-status--success {
  color: var(--color-text-soft);
}

.save-status--error {
  color: var(--color-danger);
}

.save-status--saving .save-status-dot {
  background: var(--color-secondary-600);
}

.save-status--success .save-status-dot {
  background: var(--color-primary-600);
}

.save-status--error .save-status-dot {
  background: var(--color-danger);
}

/* Chat preview styles */
.preview-chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.chat-bubble {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 15px;
}

.chat--user {
  align-self: flex-end;
  background: var(--color-primary-100);
  color: var(--color-neutral-900);
}

.chat--other {
  align-self: flex-start;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-neutral-900);
}

.chat-text {
  margin: 0 0 6px 0;
}

.chat-time {
  font-size: 12px;
  color: var(--color-text-soft);
}
</style>
