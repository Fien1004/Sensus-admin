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
      title: '',
      description: '',
      question: '',
      options: [
        { label: '', next: 'reflectie' },
        { label: '', next: 'reflectie' },
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
      title: '',
      description: '',
      question: '',
      options: [
        { label: '', next: 'reflectie' },
        { label: '', next: 'reflectie' },
      ],
    }

    scenario.questionSteps.push(newStep)
    selectedStepKey.value = newStep.id
  }

  function handleSave() {
    console.log(JSON.stringify(scenario, null, 2))
  }

  return {
    scenario,
    showScenarioEditorSteps,
    selectedStepKey,
    currentStep,
    currentStepIndex,
    editorSteps,
    addStep,
    handleSave,
  }
}
