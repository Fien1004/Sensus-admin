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

        <div class="flow-add-menu">
          <button type="button" class="flow-add-button" @click="toggleAddMenu">+ Vraag toevoegen</button>

          <div v-if="isAddMenuOpen" class="flow-add-dropdown">
            <button type="button" class="flow-add-option" @click="handleAddMenuAction('question')">Vraag toevoegen</button>
            <button type="button" class="flow-add-option" @click="handleAddMenuAction('reflection')">Reflectie toevoegen</button>
            <button type="button" class="flow-add-option" @click="handleAddMenuAction('end')">Einde toevoegen</button>
          </div>
        </div>
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
            <h2 class="section-title">Stap {{ currentStepIndex + 1 }}</h2>

            <label class="field field-wide">
              <span class="field-label">Titel</span>
              <input v-model="currentStep.title" type="text" class="field-input" placeholder="Titel" />
            </label>

            <label class="field field-wide">
              <span class="field-label">Beschrijving</span>
              <textarea v-model="currentStep.description" class="field-textarea" placeholder="Schrijf hier iets"></textarea>
            </label>

            <label v-if="!currentStep.onlyNextButton" class="field field-wide">
              <span class="field-label">Vraag</span>
              <input v-model="currentStep.question" type="text" class="field-input" placeholder="Schrijf hier iets" />
            </label>

            <label class="field field-wide">
              <span class="field-label">Layout</span>
              <select v-model="currentStep.layout" class="field-input">
                <option value="chat">Chat</option>
                <option value="narrative">Narrative</option>
              </select>
            </label>

            <div class="section-header">
              <h3 class="section-title">Content</h3>
              <button
                v-if="currentStep?.layout === 'chat' || currentStep?.layout === 'narrative'"
                type="button"
                class="section-add-button"
                @click="handleAddContentItem"
              >
                +
              </button>
            </div>

            <div v-if="currentStep.layout === 'chat'" class="content-list">
              <div v-for="(msg, msgIndex) in currentStep.chatMessages" :key="msgIndex" class="chat-message-row">
                <select v-model="msg.sender" class="field-input content-sender-select">
                  <option value="you">Jij</option>
                  <option value="other">Ander</option>
                </select>
                <input v-model="msg.time" type="text" class="field-input content-time-input" placeholder="--:--" />
                <input v-model="msg.text" type="text" class="field-input" placeholder="Schrijf hier iets" />
              </div>
            </div>

            <div v-else class="content-list">
              <label class="field field-wide">
                <span class="field-label">Tekst</span>
                <textarea v-model="currentStep.contentCard.text" class="field-textarea" placeholder="Schrijf hier iets"></textarea>
              </label>
              <label class="field field-wide">
                <span class="field-label">Cursieve actie tekst</span>
                <input v-model="currentStep.contentCard.italicText" type="text" class="field-input" placeholder="Schrijf hier iets" />
              </label>
            </div>

            <div v-if="!currentStep.onlyNextButton" class="section-header">
              <h3 class="section-title">Keuzes</h3>
              <button v-if="!currentStep.onlyNextButton" type="button" class="section-add-button" @click="addQuestionOption">+</button>
            </div>

            <div class="question-custom-input-toggle-row">
              <label class="question-custom-input-toggle">
                <input v-model="currentStep.allowCustomInput" type="checkbox" />
                <span>Eigen input</span>
              </label>

              <label class="question-custom-input-toggle">
                <input v-model="currentStep.onlyNextButton" type="checkbox" />
                <span>Alleen volgende knop</span>
              </label>
            </div>

            <div v-if="currentStep.onlyNextButton" class="single-button-row">
              <label class="field field-wide">
                <span class="field-label">Button tekst</span>
                <input v-model="currentStep.buttonText" type="text" class="field-input" placeholder="Schrijf hier iets" />
              </label>

              <label class="field field-wide">
                <span class="field-label">Next</span>
                <select v-model="currentStep.next" class="field-input">
                  <option disabled value="">Selectie</option>
                  <option v-for="step in nextStepOptions" :key="step.value" :value="step.value">
                    {{ step.label }}
                  </option>
                </select>
              </label>
            </div>

            <div v-else class="question-options">
              <div v-for="(option, optionIndex) in editorChoices" :key="optionIndex" class="question-option-row">
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

                <button
                  v-if="editorChoices.length > 2"
                  type="button"
                  class="question-option-delete"
                  :aria-label="`Verwijder keuze ${optionIndex + 1}`"
                  title="Verwijder keuze"
                  @click="removeQuestionOption(currentQuestion.options.indexOf(option))"
                >
                  <img :src="trashIcon" alt="" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep?.type === 'reflection'" class="form-block">
          <h2 class="section-title">{{ currentStepLabel }}</h2>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Titel</span>
              <input v-model="currentStep.title" type="text" class="field-input" placeholder="Titel" />
            </label>

            <label class="field">
              <span class="field-label">Button</span>
              <input v-model="currentStep.button" type="text" class="field-input" placeholder="Volgende" />
            </label>
          </div>

          <label class="field field-wide">
            <span class="field-label">Beschrijving</span>
            <textarea v-model="currentStep.description" class="field-textarea" placeholder="Beschrijving"></textarea>
          </label>

          <label class="field field-wide">
            <span class="field-label">Vraag</span>
            <input v-model="currentStep.question" type="text" class="field-input" placeholder="Vraag" />
          </label>

          <label class="field field-wide">
            <span class="field-label">Placeholder</span>
            <input v-model="currentStep.placeholder" type="text" class="field-input" placeholder="Vul hier je antwoord in." />
          </label>

          <label class="field field-wide">
            <span class="field-label">Next</span>
            <select v-model="currentStep.next" class="field-input">
              <option disabled value="">Selectie</option>
              <option v-for="step in reflectionNextOptions" :key="step.value" :value="step.value">
                {{ step.label }}
              </option>
            </select>
          </label>
        </div>

          <div v-else-if="currentStep?.type === 'end'" class="form-block">
          <h2 class="section-title">{{ currentStepLabel }}</h2>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Titel</span>
              <input v-model="currentStep.title" type="text" class="field-input" placeholder="Titel" />
            </label>

            <label class="field">
              <span class="field-label">Button</span>
              <input v-model="currentStep.button" type="text" class="field-input" placeholder="Afronden" />
            </label>
          </div>

          <label class="field field-wide">
            <span class="field-label">Beschrijving</span>
            <textarea v-model="currentStep.description" class="field-textarea" placeholder="Beschrijving"></textarea>
          </label>

          <label class="field field-wide">
            <span class="field-label">Extra tekst</span>
            <textarea v-model="currentStep.extraText" class="field-textarea" placeholder="Extra tekst"></textarea>
          </label>

          <label class="field field-wide">
            <span class="field-label">Remember title</span>
            <input v-model="currentStep.rememberTitle" type="text" class="field-input" placeholder="Onthoud dit" />
          </label>

          <div class="section-header">
            <h3 class="section-title">Remember items</h3>
            <button type="button" class="section-add-button" @click="addRememberItem">+</button>
          </div>

          <div class="remember-list">
            <div v-for="(item, itemIndex) in currentStep.remember" :key="itemIndex" class="remember-row">
              <input v-model="currentStep.remember[itemIndex]" type="text" class="field-input" placeholder="Herinnering" />

              <button
                v-if="currentStep.remember.length > 1"
                type="button"
                class="question-option-delete"
                :aria-label="`Verwijder remember item ${itemIndex + 1}`"
                title="Verwijder item"
                @click="removeRememberItem(itemIndex)"
              >
                <img :src="trashIcon" alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
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

            <template v-else-if="currentStep?.type === 'reflection'">
              <p class="preview-heading">{{ currentStep.title || 'Reflectie' }}</p>
              <p class="preview-text">{{ currentStep.question || 'Reflectievraag' }}</p>
              <p class="preview-body">{{ currentStep.description || 'Reflectietekst' }}</p>
              <p class="preview-note">{{ currentStep.placeholder || 'Vul hier je antwoord in.' }}</p>
              <button type="button" class="preview-button">{{ currentStep.button || 'Volgende' }}</button>
            </template>

            <template v-else-if="currentStep?.type === 'end'">
              <p class="preview-heading">{{ currentStep.title || 'Afsluiting' }}</p>
              <p class="preview-body">{{ currentStep.description || 'Afsluitende tekst' }}</p>
              <p class="preview-text">{{ currentStep.extraText || 'Extra tekst' }}</p>
              <p class="preview-note">{{ currentStep.rememberTitle || 'Onthoud dit' }}</p>
              <p class="preview-note">{{ (currentStep.remember || []).filter(Boolean).join(', ') || 'Geen remember items' }}</p>
              <button type="button" class="preview-button">{{ currentStep.button || 'Afronden' }}</button>
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
import { useNotificationsStore } from '@/stores/notifications'
import ChatScenarioPreview from '@/components/ChatScenarioPreview.vue'
import NarrativeScenarioPreview from '@/components/NarrativeScenarioPreview.vue'
import trashIcon from '@/assets/icons/trash.svg'
import { createQuestionStep as createScenarioQuestionStep, createReflectionStep, createEndStep, getNextReflectionId, getNextEndId, getStepIdsFromSteps, mapStepsForLoad, mapStepsForSave, mapReflectionStepForSave, mapEndStepForSave } from '@/utils/scenarioStepModel'

const route = useRoute()
const router = useRouter()
const notificationsStore = useNotificationsStore()

const scenarioId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const isEditMode = computed(() => route.name === 'ScenarioEdit' || route.path.includes('/edit'))
const pageTitle = 'Scenario bewerken'

function createQuestionStep(index, overrides = {}) {
  return createScenarioQuestionStep(index, overrides)
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
    questionSteps: [createQuestionStep(0, { title: 'Stap 1' })],
    reflections: [createReflectionStep(0, { title: 'Reflectie A', next: 'end-a' })],
    ends: [createEndStep(0, { title: 'Einde A' })],
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
const isAddMenuOpen = ref(false)

function getStepLabelLetter(index) {
  return String.fromCharCode(65 + index)
}

const currentStep = computed(() => [
  ...scenario.questionSteps,
  ...scenario.reflections,
  ...scenario.ends,
].find((step) => step.id === selectedStepKey.value) || null)
const currentStepIndex = computed(() => scenario.questionSteps.findIndex((step) => step.id === selectedStepKey.value))
const editorSteps = computed(() =>
  scenario.questionSteps.map((step, index) => ({
    id: step.id,
    label: `Stap ${index + 1}`,
  })),
)
const reflectionSteps = computed(() => scenario.reflections.map((step, index) => ({ id: step.id, label: `Reflectie ${getStepLabelLetter(index)}`, type: 'reflection' })))
const endSteps = computed(() => scenario.ends.map((step, index) => ({ id: step.id, label: `Einde ${getStepLabelLetter(index)}`, type: 'end' })))
const currentQuestion = computed(() => (currentStep.value?.type === 'question' ? currentStep.value : { layout: 'chat', options: [] }))
const editorChoices = computed(() => {
  const choices = Array.isArray(currentQuestion.value?.options) ? currentQuestion.value.options : []
  return choices.filter((choice) => choice?.label !== 'Eigen input')
})
const flowSteps = computed(() => [
  { id: 'intro', label: 'Intro', type: 'static' },
  ...editorSteps.value.map((step, index) => ({
    id: step.id,
    label: step.label,
    type: 'question',
    canDelete: index > 0,
  })),
  ...reflectionSteps.value,
  ...endSteps.value,
])
const currentStepLabel = computed(() => flowSteps.value.find((step) => step.id === selectedStepKey.value)?.label || '')
const nextStepOptions = computed(() => flowSteps.value.filter((step) => step.id !== 'intro').map((step) => ({ value: step.id, label: step.label })))
const reflectionNextOptions = computed(() => endSteps.value.map((step) => ({ value: step.id, label: step.label })))

function clearInvalidNextTargets() {
  const validStepIds = new Set(getStepIdsFromSteps([
    ...scenario.questionSteps,
    ...scenario.reflections,
    ...scenario.ends,
  ]))

  scenario.questionSteps.forEach((step) => {
    if (step.onlyNextButton && step.next && !validStepIds.has(step.next)) {
      step.next = ''
    }

    if (Array.isArray(step.options)) {
      step.options.forEach((option) => {
        if (option.next && !validStepIds.has(option.next)) {
          option.next = ''
        }
      })
    }
  })

  scenario.reflections.forEach((step) => {
    if (step.next && !scenario.ends.some((end) => end.id === step.next)) {
      step.next = ''
    }
  })
}

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

function validateEditorState() {
  const errors = []
  const stepIds = new Set(flowSteps.value.map((step) => step.id))
  const endIds = new Set(scenario.ends.map((step) => step.id))

  if (!scenario.title.trim()) errors.push('Scenario naam is verplicht.')
  if (!scenario.description.trim()) errors.push('Scenario beschrijving is verplicht.')
  if (!scenario.theme.trim()) errors.push('Thema is verplicht.')
  if (!scenario.intro.title.trim()) errors.push('Intro titel is verplicht.')
  if (scenario.questionSteps.length < 1) errors.push('Minstens 1 vraag is verplicht.')

  scenario.questionSteps.forEach((question, index) => {
    const questionNumber = index + 1
    const visibleOptions = Array.isArray(question.options)
      ? question.options.filter((option) => option?.label !== 'Eigen input')
      : []
    const filledOptions = visibleOptions.filter((option) => String(option?.label || '').trim())

    if (!question.title.trim()) {
      errors.push(`Vraag ${questionNumber}: titel is verplicht.`)
    }

    if (!question.layout) {
      errors.push(`Vraag ${questionNumber}: layout is verplicht.`)
    }

    if (question.onlyNextButton) {
      if (!question.buttonText.trim()) {
        errors.push(`Vraag ${questionNumber}: button tekst is verplicht.`)
      }

      if (!question.next.trim()) {
        errors.push(`Vraag ${questionNumber}: next is verplicht.`)
      }
    } else {
      if (!question.question.trim()) {
        errors.push(`Vraag ${questionNumber}: vraag is verplicht.`)
      }

      if (filledOptions.length < 2) {
        errors.push(`Vraag ${questionNumber} moet minstens 2 ingevulde opties hebben.`)
      }

      if (visibleOptions.some((option) => !String(option?.next || '').trim())) {
        errors.push(`Vraag ${questionNumber}: elke optie heeft een geldige next nodig.`)
      }
      visibleOptions.forEach((option, optionIndex) => {
        const next = String(option?.next || '').trim()

        if (!next) {
          errors.push(`Vraag ${questionNumber}, keuze ${optionIndex + 1}: next is verplicht.`)
          return
        }

        if (!stepIds.has(next)) {
          errors.push(`Vraag ${questionNumber}, keuze ${optionIndex + 1}: next verwijst naar een onbekende stap.`)
        }
      })
    }

    if (question.onlyNextButton) {
      const next = String(question.next || '').trim()

      if (next && !stepIds.has(next)) {
        errors.push(`Vraag ${questionNumber}: next verwijst naar een onbekende stap.`)
      }
    }
  })

  scenario.reflections.forEach((reflection, index) => {
    const reflectionLabel = `Reflectie ${getStepLabelLetter(index)}`
    const next = String(reflection.next || '').trim()

    if (!reflection.title.trim()) errors.push(`${reflectionLabel}: titel is verplicht.`)
    if (!reflection.question.trim()) errors.push(`${reflectionLabel}: vraag is verplicht.`)
    if (!next) {
      errors.push(`${reflectionLabel}: next is verplicht.`)
      return
    }

    if (!endIds.has(next)) errors.push(`${reflectionLabel}: next moet naar een bestaand einde verwijzen.`)
  })

  scenario.ends.forEach((end, index) => {
    const endLabel = `Einde ${getStepLabelLetter(index)}`

    if (!end.title.trim()) errors.push(`${endLabel}: titel is verplicht.`)
  })

  return errors
}

function buildScenarioPayload() {
  const steps = mapStepsForSave(scenario.questionSteps)

  scenario.reflections.forEach((reflection, index) => {
    steps.push(mapReflectionStepForSave(reflection, steps.length + index + 1, {
      endIds: scenario.ends.map((end) => end.id),
    }))
  })

  scenario.ends.forEach((end, index) => {
    steps.push(mapEndStepForSave(end, steps.length + index + 1))
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

function addQuestionStep() {
  const nextIndex = scenario.questionSteps.length + 1
  const step = createScenarioQuestionStep(nextIndex - 1, { title: `Stap ${nextIndex}` })
  scenario.questionSteps.push(step)
  selectedStepKey.value = step.id
}

function addReflectionStep() {
  const nextIndex = scenario.reflections.length
  const reflectionId = getNextReflectionId(nextIndex)
  const step = createReflectionStep(nextIndex, {
    id: reflectionId,
    title: `Reflectie ${getStepLabelLetter(nextIndex)}`,
    next: scenario.ends[0]?.id || getNextEndId(0),
  })

  scenario.reflections.push(step)
  selectedStepKey.value = step.id
}

function addEndStep() {
  const nextIndex = scenario.ends.length
  const endId = getNextEndId(nextIndex)
  const step = createEndStep(nextIndex, {
    id: endId,
    title: `Einde ${getStepLabelLetter(nextIndex)}`,
  })

  scenario.ends.push(step)
  selectedStepKey.value = step.id

  if (scenario.ends.length === 1) {
    scenario.reflections.forEach((reflection) => {
      if (!String(reflection.next || '').trim()) {
        reflection.next = step.id
      }
    })
  }
}

function toggleAddMenu() {
  isAddMenuOpen.value = !isAddMenuOpen.value
}

function handleAddMenuAction(type) {
  if (type === 'reflection') {
    addReflectionStep()
    isAddMenuOpen.value = false
    return
  }

  if (type === 'end') {
    addEndStep()
    isAddMenuOpen.value = false
    return
  }

  addQuestionStep()
  isAddMenuOpen.value = false
}

function removeQuestionStep(stepId) {
  if (scenario.questionSteps.length <= 1) return

  const stepIndex = scenario.questionSteps.findIndex((step) => step.id === stepId)
  if (stepIndex <= 0) return

  const wasActive = selectedStepKey.value === stepId
  const fallbackStep = scenario.questionSteps[stepIndex - 1] || scenario.questionSteps[0]

  scenario.questionSteps.splice(stepIndex, 1)
  clearInvalidNextTargets()

  if (wasActive) {
    selectedStepKey.value = fallbackStep.id
  }
}

function addQuestionOption() {
  if (!currentStep.value) return

  currentStep.value.options.push({ label: '', next: '' })
}

function removeQuestionOption(index) {
  if (!currentStep.value || !Array.isArray(currentStep.value.options)) return
  if (currentStep.value.options.length <= 2) return

  currentStep.value.options.splice(index, 1)
}

function addChatMessage() {
  if (!currentStep.value) return
  if (!Array.isArray(currentStep.value.chatMessages)) currentStep.value.chatMessages = []
  currentStep.value.chatMessages.push({ sender: 'you', text: '', time: '' })
}

function ensureNarrativeContentCard() {
  if (!currentStep.value) return

  if (!currentStep.value.contentCard || typeof currentStep.value.contentCard !== 'object') {
    currentStep.value.contentCard = { text: '', italicText: '' }
  }
}

function handleAddContentItem() {
  if (currentStep.value?.layout === 'chat') {
    addChatMessage()
    return
  }

  if (currentStep.value?.layout === 'narrative') {
    ensureNarrativeContentCard()
  }
}

function removeChatMessage(index) {
  if (!currentStep.value || !Array.isArray(currentStep.value.chatMessages)) return
  currentStep.value.chatMessages.splice(index, 1)
}

function addRememberItem() {
  if (!currentStep.value || currentStep.value.type !== 'end') return

  if (!Array.isArray(currentStep.value.remember)) {
    currentStep.value.remember = []
  }

  currentStep.value.remember.push('')
}

function removeRememberItem(index) {
  if (!currentStep.value || currentStep.value.type !== 'end') return
  if (!Array.isArray(currentStep.value.remember)) return
  if (currentStep.value.remember.length <= 1) return

  currentStep.value.remember.splice(index, 1)
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
    const steps = mapStepsForLoad(Array.isArray(engineJson.steps) ? engineJson.steps : [])
    const questionSteps = steps.filter((step) => step?.type === 'question')
    const reflectionSteps = steps.filter((step) => step?.type === 'reflection')
    const endSteps = steps.filter((step) => step?.type === 'end')

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
    scenario.reflections = reflectionSteps.length > 0 ? reflectionSteps : createDefaultScenarioState().reflections
    scenario.ends = endSteps.length > 0 ? endSteps : createDefaultScenarioState().ends
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

    await notificationsStore.addNotification({
      type: 'scenario_updated',
      message: `Scenario bijgewerkt: ${payload.title}`,
    })

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

.flow-add-menu {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.flow-add-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 210px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  z-index: 20;
}

.flow-add-option {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  background: transparent;
  color: var(--color-neutral-900);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.flow-add-option:hover {
  background: var(--color-neutral-100);
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
  grid-template-columns: 120px minmax(0, 1fr) auto 140px auto;
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-add-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-secondary-600);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.remember-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.remember-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.chat-message-row {
  display: grid;
  grid-template-columns: 110px 90px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.content-sender-select,
.content-time-input {
  width: 100%;
}

.question-custom-input-toggle-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.single-button-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 14px;
}

.question-option-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.question-option-delete img {
  width: 16px;
  height: 16px;
  display: block;
}

.question-option-delete:hover {
  background: var(--color-danger);
}

.question-option-delete:hover img {
  filter: brightness(0) invert(1);
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
