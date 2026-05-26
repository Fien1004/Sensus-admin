import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const scenario = reactive({
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
  questionSteps: [
    {
      id: 'step-1',
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
    },
  ],
  reflection: {
    title: '',
    body: '',
    question: '',
  },
  ending: {
    title: '',
    body: '',
  },
})

export function useScenarioEditorState() {
  const route = useRoute()
  const router = useRouter()

  const showScenarioEditorSteps = computed(() => {
    return route.path === '/scenarios/new' || /^\/scenarios\/[^/]+\/edit$/.test(route.path)
  })

  const selectedStepKey = computed({
    get() {
      const step = typeof route.query.step === 'string' ? route.query.step : ''

      if (['intro', 'reflection', 'ending', ...scenario.questionSteps.map((item) => item.id)].includes(step)) {
        return step || 'intro'
      }

      return 'intro'
    },
    set(step) {
      router.push({ path: route.path, query: { ...route.query, step } })
    },
  })

  const currentStep = computed(() => scenario.questionSteps.find((step) => step.id === selectedStepKey.value) || null)
  const currentStepIndex = computed(() => scenario.questionSteps.findIndex((step) => step.id === selectedStepKey.value))

  const editorSteps = computed(() => scenario.questionSteps.map((step, index) => ({
    id: step.id,
    label: step.title || `Vraag ${index + 1}`,
  })))

  function addStep() {
    const nextIndex = scenario.questionSteps.length + 1
    const newStep = {
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
    }

    scenario.questionSteps.push(newStep)
    selectedStepKey.value = newStep.id
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

  return {
    scenario,
    showScenarioEditorSteps,
    selectedStepKey,
    currentStep,
    currentStepIndex,
    editorSteps,
    addStep,
    removeQuestionStep,
  }
}
