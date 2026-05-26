<template>
  <main class="scenario-create-view">
    <header class="page-header">
      <div>
        <h1 class="page-title">Nieuw scenario</h1>
      </div>

      <div class="actions">
        <button type="button" class="action-button save-button" @click="handleSave">+ Opslaan</button>
        <button type="button" class="action-button publish-button" @click="handleSave">Publiceren</button>
        <button type="button" class="action-button cancel-button" @click="handleCancel">Annuleer</button>
      </div>
    </header>

    <section class="flow-nav-row" aria-label="Scenario flow navigatie">
      <nav class="flow-nav-scroll" aria-label="Stappen" role="tablist">
        <template v-for="(step, index) in flowSteps" :key="step.id">
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
        </template>
      </nav>

      <button type="button" class="flow-add-button" @click="handleAddStep">+ Vraag toevoegen</button>
    </section>

    <section class="editor-shell">
      <section class="editor-panel card">
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

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Vraag titel</span>
              <input v-model="currentStep.title" type="text" class="field-input" placeholder="Titel" />
            </label>

            <label class="field">
              <span class="field-label">Korte beschrijving</span>
              <input v-model="currentStep.description" type="text" class="field-input" placeholder="Beschrijving" />
            </label>
          </div>

          <label class="field field-wide">
            <span class="field-label">Vraag</span>
            <textarea v-model="currentStep.question" class="field-textarea" placeholder="Stel je vraag"></textarea>
          </label>

          <div class="options-grid">
            <label v-for="(option, optionIndex) in currentStep.options" :key="optionIndex" class="field">
              <span class="field-label">Optie {{ optionIndex + 1 }}</span>
              <input v-model="option.label" type="text" class="field-input" placeholder="Antwoordoptie" />
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
            <p class="preview-heading">{{ currentStep.title || 'Vraag' }}</p>
            <p class="preview-text">{{ currentStep.description || 'Beschrijving' }}</p>
            <p class="preview-body">{{ currentStep.question || 'Vraagtekst' }}</p>
            <div class="preview-options">
              <div v-for="(option, optionIndex) in currentStep.options" :key="optionIndex" class="preview-option">
                <span>{{ option.label || `Optie ${optionIndex + 1}` }}</span>
                <span class="preview-option-next">{{ option.next }}</span>
              </div>
            </div>
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
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useScenarioEditorState } from '@/composables/useScenarioEditorState'

const router = useRouter()

const { scenario, selectedStepKey, currentStep, currentStepIndex, editorSteps, addStep, handleSave } = useScenarioEditorState()

const flowSteps = computed(() => [
  { id: 'intro', label: 'Intro' },
  ...editorSteps.value.map((step) => ({ id: step.id, label: step.label })),
  { id: 'reflection', label: 'Reflectie' },
  { id: 'ending', label: 'Afsluiting' },
])

function selectStep(stepId) {
  selectedStepKey.value = stepId
}

function handleAddStep() {
  addStep()
}

function handleCancel() {
  router.push('/scenarios')
}
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #111827;
  font-size: 16px;
}

.preview-option-next {
  color: #6b7280;
  font-size: 13px;
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
</style>
