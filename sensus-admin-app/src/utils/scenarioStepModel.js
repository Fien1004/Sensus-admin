const STEP_TYPES = {
  QUESTION: 'question',
  CONTINUE: 'continue',
  REFLECTION: 'reflection',
  END: 'end',
}

function indexToLetters(index = 0) {
  let value = Number(index)

  if (!Number.isFinite(value) || value < 0) {
    value = 0
  }

  value += 1
  let letters = ''

  while (value > 0) {
    value -= 1
    letters = String.fromCharCode(97 + (value % 26)) + letters
    value = Math.floor(value / 26)
  }

  return letters || 'a'
}

function createStepId(type, index = 0, overrideId = '') {
  const normalizedId = typeof overrideId === 'string' ? overrideId.trim() : ''

  if (type === STEP_TYPES.REFLECTION) {
    if (normalizedId && normalizedId !== 'reflection' && !normalizedId.startsWith('reflection-')) {
      return normalizedId
    }

    return `reflection-${indexToLetters(index)}`
  }

  if (type === STEP_TYPES.END) {
    if (normalizedId && normalizedId !== 'end' && normalizedId !== 'ending' && !normalizedId.startsWith('end-')) {
      return normalizedId
    }

    return `end-${indexToLetters(index)}`
  }

  return normalizedId || `step-${index + 1}`
}

function normalizeRememberItems(rawRemember) {
  if (!Array.isArray(rawRemember)) return []

  return rawRemember.map((item) => {
    if (typeof item === 'string') return item
    if (item && typeof item.text === 'string') return item.text
    if (item && typeof item.label === 'string') return item.label
    return ''
  })
}

function normalizeLoadedNextTarget(next, reflectionIds, endIds) {
  const value = typeof next === 'string' ? next.trim() : ''

  return value
}

export function getStepIdsFromSteps(steps = []) {
  if (!Array.isArray(steps)) return []

  return steps
    .map((step) => (typeof step?.id === 'string' ? step.id.trim() : ''))
    .filter(Boolean)
}

function createChoice(overrides = {}) {
  return {
    label: '',
    next: '',
    ...overrides,
  }
}

function createChatMessage(overrides = {}) {
  return {
    sender: 'user',
    text: '',
    time: '',
    ...overrides,
    sender: overrides.sender === 'other' ? 'other' : 'user',
  }
}

function createContentCard(overrides = {}) {
  return {
    text: '',
    italicText: '',
    ...overrides,
  }
}

function createBaseStep(type, index = 0, overrides = {}) {
  return {
    id: createStepId(type, index, overrides.id),
    type,
    title: '',
    description: '',
    layout: 'chat',
    ...overrides,
    id: createStepId(type, index, overrides.id),
  }
}

function normalizeStepType(rawStep = {}) {
  const rawType = typeof rawStep.type === 'string' ? rawStep.type.trim().toLowerCase() : ''
  const rawId = typeof rawStep.id === 'string' ? rawStep.id.trim().toLowerCase() : ''

  if (!rawType) {
    if (rawId.startsWith('reflection-') || rawId === 'reflection' || rawId === 'reflectie') return STEP_TYPES.REFLECTION
    if (rawId.startsWith('end-') || rawId === 'end' || rawId === 'ending' || rawId === 'afsluiting') return STEP_TYPES.END
  }

  if (rawType === 'ending') return STEP_TYPES.END
  if (rawType.startsWith('reflection-')) return STEP_TYPES.REFLECTION
  if (rawType.startsWith('end-')) return STEP_TYPES.END
  if (rawType === 'continue' || rawType === STEP_TYPES.CONTINUE) return STEP_TYPES.CONTINUE
  if (rawType === 'reflection' || rawType === STEP_TYPES.REFLECTION || rawType === 'reflectie') return STEP_TYPES.REFLECTION
  if (rawType === STEP_TYPES.END) return STEP_TYPES.END
  if (rawType === STEP_TYPES.QUESTION) return STEP_TYPES.QUESTION

  if (rawStep && (rawStep.buttonText || rawStep.next)) return STEP_TYPES.CONTINUE
  if (rawStep && (rawStep.rememberBlock || rawStep.extraText)) return STEP_TYPES.END
  if (rawStep && rawStep.placeholder) return STEP_TYPES.REFLECTION

  return STEP_TYPES.QUESTION
}

function normalizeChoices(rawChoices) {
  const choices = Array.isArray(rawChoices)
    ? rawChoices.map((choice) => ({
        label: typeof choice?.label === 'string' ? choice.label : '',
        next: typeof choice?.next === 'string' ? choice.next : '',
      }))
    : []

  while (choices.length < 2) {
    choices.push(createChoice())
  }

  return choices
}

function normalizeChatMessages(rawMessages) {
  return Array.isArray(rawMessages)
    ? rawMessages.map((message) => ({
        sender: message?.sender === 'other' ? 'other' : 'user',
        text: typeof message?.text === 'string' ? message.text : '',
        time: typeof message?.time === 'string' ? message.time : '',
      }))
    : []
}

function normalizeContentCard(rawContentCard) {
  if (!rawContentCard || typeof rawContentCard !== 'object') {
    return createContentCard()
  }

  return {
    text: typeof rawContentCard.text === 'string' ? rawContentCard.text : '',
    italicText: typeof rawContentCard.italicText === 'string' ? rawContentCard.italicText : '',
  }
}

function normalizeReflectionStep(rawStep = {}) {
  return {
    title: typeof rawStep.title === 'string' ? rawStep.title : '',
    description: typeof rawStep.description === 'string' ? rawStep.description : '',
    question: typeof rawStep.question === 'string' ? rawStep.question : '',
    placeholder: typeof rawStep.placeholder === 'string' ? rawStep.placeholder : '',
    button: typeof rawStep.button === 'string' ? rawStep.button : typeof rawStep.buttonText === 'string' ? rawStep.buttonText : '',
    next: typeof rawStep.next === 'string' ? rawStep.next : '',
  }
}

function normalizeEndStep(rawStep = {}) {
  return {
    title: typeof rawStep.title === 'string' ? rawStep.title : '',
    description: typeof rawStep.description === 'string' ? rawStep.description : '',
    extraText: typeof rawStep.extraText === 'string' ? rawStep.extraText : '',
    rememberTitle: typeof rawStep.rememberTitle === 'string'
      ? rawStep.rememberTitle
      : typeof rawStep.rememberBlock === 'string'
        ? rawStep.rememberBlock
        : '',
    remember: normalizeRememberItems(rawStep.remember),
    button: typeof rawStep.button === 'string' ? rawStep.button : typeof rawStep.buttonText === 'string' ? rawStep.buttonText : '',
  }
}

function hasContentCardData(contentCard) {
  return Boolean(contentCard && (String(contentCard.text || '').trim() || String(contentCard.italicText || '').trim()))
}

function mapChatSenderForSave(sender) {
  if (sender === 'other') return 'other'
  return 'you'
}

function mapChatMessagesForSave(rawMessages) {
  if (!Array.isArray(rawMessages)) return []

  return rawMessages.flatMap((message) => {
    const text = typeof message?.text === 'string' ? message.text.trim() : ''
    const time = typeof message?.time === 'string' ? message.time.trim() : ''
    const statusText = typeof message?.status === 'string' ? message.status.trim() : ''
    const sender = typeof message?.sender === 'string' ? message.sender.trim().toLowerCase() : ''
    const isStatusMessage = sender === 'status' || /gelezen|read|seen/i.test(text) || /gelezen|read|seen/i.test(statusText)

    if (isStatusMessage) {
      return [{ status: 'Gelezen' }]
    }

    if (!text) {
      return []
    }

    return [{
      sender: mapChatSenderForSave(sender),
      text,
      time,
    }]
  })
}

function normalizeSavedNextTarget(next) {
  const value = typeof next === 'string' ? next.trim() : ''

  return value
}

function resolveSavedProgress(progress, fallbackIndex) {
  const numericProgress = Number(progress)

  return Number.isFinite(numericProgress) && numericProgress > 0 ? numericProgress : fallbackIndex + 1
}

function mapOptionsForSave(step = {}) {
  const baseOptions = Array.isArray(step.options) && step.options.length > 0 ? step.options : Array.isArray(step.choices) ? step.choices : []
  const options = baseOptions
    .map((option) => ({
      label: typeof option?.label === 'string' ? option.label : '',
      next: normalizeSavedNextTarget(option?.next),
    }))
    .filter((option) => option.label || option.next)

  if (!step.allowCustomInput) {
    return options
  }

  const inputStepId = `${typeof step.id === 'string' && step.id.trim() ? step.id : ''}-input`
  const hasCustomInputChoice = options.some((option) => option.label === 'Eigen input' && option.next === inputStepId)

  if (!hasCustomInputChoice) {
    options.push({
      label: 'Eigen input',
      next: inputStepId,
    })
  }

  return options
}

function buildSavedContentCard(step = {}) {
  const contentCard = normalizeContentCard(step.contentCard)
  return hasContentCardData(contentCard) ? contentCard : null
}

function createSavedQuestionStep(step = {}) {
  const id = typeof step.id === 'string' && step.id.trim() ? step.id : ''
  const options = mapOptionsForSave(step)
  const chatMessages = mapChatMessagesForSave(step.chatMessages)
  const savedStep = {
    id,
    type: STEP_TYPES.QUESTION,
    title: typeof step.title === 'string' ? step.title : '',
    layout: step.layout === 'narrative' ? 'narrative' : 'chat',
    options,
    progress: resolveSavedProgress(step.progress, 0),
    question: typeof step.question === 'string' ? step.question : '',
    inputType: 'choice',
    description: typeof step.description === 'string' ? step.description : '',
    chatMessages,
  }

  const contentCard = buildSavedContentCard(step)
  if (contentCard) {
    savedStep.contentCard = contentCard
  }

  return savedStep
}

function createSavedContinueStep(step = {}) {
  return {
    id: typeof step.id === 'string' && step.id.trim() ? step.id : '',
    next: normalizeSavedNextTarget(step.next),
    type: STEP_TYPES.CONTINUE,
    title: typeof step.title === 'string' ? step.title : '',
    button: typeof step.buttonText === 'string' && step.buttonText.trim() ? step.buttonText : 'Volgende',
    layout: step.layout === 'narrative' ? 'narrative' : 'chat',
    progress: resolveSavedProgress(step.progress, 0),
    description: typeof step.description === 'string' ? step.description : '',
    chatMessages: mapChatMessagesForSave(step.chatMessages),
  }
}

function createSavedInputStep(step = {}) {
  const id = typeof step.id === 'string' && step.id.trim() ? step.id : ''
  const inputStepId = `${id}-input`
  const questionOptions = mapOptionsForSave({ ...step, allowCustomInput: false })
  const nextTarget = typeof step.customInputNext === 'string' && step.customInputNext.trim()
    ? step.customInputNext
    : questionOptions[0]?.next || ''

  return {
    id: inputStepId,
    next: normalizeSavedNextTarget(nextTarget),
    type: STEP_TYPES.QUESTION,
    title: typeof step.title === 'string' ? step.title : '',
    layout: step.layout === 'narrative' ? 'narrative' : 'chat',
    progress: resolveSavedProgress(step.progress, 0),
    question: typeof step.question === 'string' ? step.question : '',
    inputType: 'text',
    description: typeof step.description === 'string' ? step.description : '',
    placeholder: 'Schrijf hier je antwoord...',
    chatMessages: mapChatMessagesForSave(step.chatMessages),
  }
}

function createSavedReflectionStep(step = {}, progressIndex = 0) {
  return {
    id: createStepId(STEP_TYPES.REFLECTION, progressIndex, step.id),
    next: normalizeSavedNextTarget(step.next),
    type: STEP_TYPES.REFLECTION,
    title: typeof step.title === 'string' ? step.title : '',
    button: typeof step.button === 'string' && step.button.trim() ? step.button : 'Volgende',
    progress: resolveSavedProgress(step.progress, progressIndex),
    question: typeof step.question === 'string' ? step.question : '',
    inputType: 'textarea',
    description: typeof step.description === 'string' ? step.description : '',
    placeholder: 'Vul hier je antwoord in.',
  }
}

function createSavedEndStep(step = {}, progressIndex = 0) {
  return {
    id: createStepId(STEP_TYPES.END, progressIndex, step.id),
    type: STEP_TYPES.END,
    title: typeof step.title === 'string' ? step.title : '',
    description: typeof step.description === 'string' ? step.description : '',
    extraText: typeof step.extraText === 'string' ? step.extraText : '',
    rememberTitle: typeof step.rememberTitle === 'string' ? step.rememberTitle : '',
    remember: normalizeRememberItems(step.remember).filter((item) => String(item || '').trim()),
    button: typeof step.button === 'string' && step.button.trim() ? step.button : 'Afronden',
    progress: resolveSavedProgress(step.progress, progressIndex),
  }
}

function isCustomInputStep(rawStep, parentStepId) {
  if (!rawStep || typeof rawStep !== 'object') return false

  const stepId = typeof rawStep.id === 'string' ? rawStep.id : ''
  return stepId === `${parentStepId}-input` && typeof rawStep.inputType === 'string' && rawStep.inputType === 'text'
}

function stripAutoCustomInputChoice(choices, inputStepId) {
  return choices.filter((choice) => !(choice?.label === 'Eigen input' && choice?.next === inputStepId))
}

function isLoadedInputStep(rawStep = {}) {
  const stepId = typeof rawStep.id === 'string' ? rawStep.id : ''
  return stepId.endsWith('-input') || rawStep.inputType === 'text'
}

function hasCustomInputOption(step = {}) {
  const options = Array.isArray(step.options) ? step.options : []
  return options.some((option) => option?.label === 'Eigen input')
}

export function createDefaultStep(type = STEP_TYPES.QUESTION, index = 0, overrides = {}) {
  const baseStep = createBaseStep(type, index, overrides)

  if (type === STEP_TYPES.CONTINUE) {
    return {
      ...baseStep,
      buttonText: '',
      button: '',
      next: '',
      chatMessages: [],
      ...overrides,
    }
  }

  if (type === STEP_TYPES.REFLECTION) {
    return {
      ...baseStep,
      title: 'Reflectie',
      description: '',
      question: '',
      placeholder: 'Vul hier je antwoord in.',
      button: 'Volgende',
      next: '',
      ...overrides,
    }
  }

  if (type === STEP_TYPES.END) {
    return {
      ...baseStep,
      title: 'Je hebt het scenario afgerond!',
      description: '',
      extraText: '',
      rememberTitle: 'Onthoud dit',
      remember: [''],
      button: 'Afronden',
      ...overrides,
    }
  }

  const choices = normalizeChoices(overrides.choices || overrides.options)

  return {
    ...baseStep,
    question: '',
    choices,
    options: choices,
    allowCustomInput: false,
    onlyNextButton: false,
    buttonText: '',
    next: '',
    customInput: '',
    customInputPlaceholder: '',
    progress: '',
    inputType: '',
    placeholder: '',
    contentCard: createContentCard(overrides.contentCard),
    chatMessages: normalizeChatMessages(overrides.chatMessages),
    ...overrides,
    choices,
    options: choices,
    onlyNextButton: Boolean(overrides.onlyNextButton),
    buttonText: typeof overrides.buttonText === 'string' ? overrides.buttonText : '',
    next: typeof overrides.next === 'string' ? overrides.next : '',
    customInputPlaceholder: typeof overrides.customInputPlaceholder === 'string' ? overrides.customInputPlaceholder : '',
    progress: typeof overrides.progress === 'string' ? overrides.progress : '',
    inputType: typeof overrides.inputType === 'string' ? overrides.inputType : '',
    placeholder: typeof overrides.placeholder === 'string' ? overrides.placeholder : '',
    contentCard: normalizeContentCard(overrides.contentCard),
    chatMessages: normalizeChatMessages(overrides.chatMessages),
  }
}

export function normalizeStep(rawStep = {}, index = 0) {
  const type = normalizeStepType(rawStep)
  const baseStep = createBaseStep(type, index, rawStep)

  if (type === STEP_TYPES.CONTINUE) {
    const chatMessages = normalizeChatMessages(rawStep.chatMessages)

    return {
      ...baseStep,
      type: STEP_TYPES.QUESTION,
      onlyNextButton: true,
      question: typeof rawStep.question === 'string' ? rawStep.question : '',
      choices: normalizeChoices(rawStep.choices || rawStep.options),
      options: normalizeChoices(rawStep.choices || rawStep.options),
      allowCustomInput: Boolean(rawStep.allowCustomInput),
      buttonText: typeof rawStep.buttonText === 'string' ? rawStep.buttonText : typeof rawStep.button === 'string' ? rawStep.button : '',
      button: typeof rawStep.button === 'string' ? rawStep.button : typeof rawStep.buttonText === 'string' ? rawStep.buttonText : '',
      next: typeof rawStep.next === 'string' ? rawStep.next : '',
      customInput: typeof rawStep.customInput === 'string' ? rawStep.customInput : '',
      customInputPlaceholder: typeof rawStep.customInputPlaceholder === 'string' ? rawStep.customInputPlaceholder : '',
      progress: typeof rawStep.progress === 'string' ? rawStep.progress : '',
      contentCard: normalizeContentCard(rawStep.contentCard),
      chatMessages,
    }
  }

  if (type === STEP_TYPES.REFLECTION) {
    return {
      ...baseStep,
      ...normalizeReflectionStep(rawStep),
    }
  }

  if (type === STEP_TYPES.END) {
    return {
      ...baseStep,
      ...normalizeEndStep(rawStep),
    }
  }

  const choices = normalizeChoices(rawStep.choices || rawStep.options)
  const contentCard = normalizeContentCard(rawStep.contentCard)
  const chatMessages = normalizeChatMessages(rawStep.chatMessages)

  return {
    ...baseStep,
    question: typeof rawStep.question === 'string' ? rawStep.question : '',
    choices,
    options: choices,
    allowCustomInput: Boolean(rawStep.allowCustomInput),
    onlyNextButton: Boolean(rawStep.onlyNextButton),
    buttonText: typeof rawStep.buttonText === 'string' ? rawStep.buttonText : '',
    button: typeof rawStep.button === 'string' ? rawStep.button : '',
    next: typeof rawStep.next === 'string' ? rawStep.next : '',
    customInput: typeof rawStep.customInput === 'string' ? rawStep.customInput : '',
    customInputPlaceholder: typeof rawStep.customInputPlaceholder === 'string' ? rawStep.customInputPlaceholder : '',
    progress: typeof rawStep.progress === 'string' ? rawStep.progress : '',
    inputType: typeof rawStep.inputType === 'string' ? rawStep.inputType : '',
    placeholder: typeof rawStep.placeholder === 'string' ? rawStep.placeholder : '',
    contentCard,
    chatMessages,
  }
}

export function mapStepForSave(step = {}) {
  const type = normalizeStepType(step)
  if (type === STEP_TYPES.CONTINUE || step.onlyNextButton) {
    return createSavedContinueStep(step)
  }

  if (type === STEP_TYPES.REFLECTION) {
    return createSavedReflectionStep(step, 0)
  }

  if (type === STEP_TYPES.END) {
    return createSavedEndStep(step, 0)
  }

  return createSavedQuestionStep(step)
}

export function mapStepsForLoad(rawSteps = []) {
  if (!Array.isArray(rawSteps)) return []

  const steps = []
  let reflectionIndex = 0
  let endIndex = 0

  for (let index = 0; index < rawSteps.length; index += 1) {
    const rawStep = rawSteps[index]
    const nextRawStep = rawSteps[index + 1]

    if (isLoadedInputStep(rawStep)) {
      const previousStep = steps[steps.length - 1]

      if (previousStep && previousStep.type === STEP_TYPES.QUESTION) {
        const inputStep = normalizeStep(rawStep, steps.length)

        steps[steps.length - 1] = {
          ...previousStep,
          allowCustomInput: true,
          customInputPlaceholder: typeof inputStep.placeholder === 'string' && inputStep.placeholder.trim()
            ? inputStep.placeholder
            : 'Schrijf hier je antwoord...',
        }
      }

      continue
    }

    const normalizedStep = normalizeStep(rawStep, steps.length)

    if (normalizedStep.type === STEP_TYPES.REFLECTION) {
      steps.push({
        ...normalizedStep,
        id: createStepId(STEP_TYPES.REFLECTION, reflectionIndex, normalizedStep.id),
      })
      reflectionIndex += 1
      continue
    }

    if (normalizedStep.type === STEP_TYPES.END) {
      steps.push({
        ...normalizedStep,
        id: createStepId(STEP_TYPES.END, endIndex, normalizedStep.id),
      })
      endIndex += 1
      continue
    }

    if (normalizedStep.type === STEP_TYPES.QUESTION && normalizedStep.allowCustomInput && isCustomInputStep(nextRawStep, normalizedStep.id)) {
      const nextStep = normalizeStep(nextRawStep, steps.length + 1)
      const inputStepId = `${normalizedStep.id}-input`
      const filteredChoices = stripAutoCustomInputChoice(normalizedStep.options || [], inputStepId)

      steps.push({
        ...normalizedStep,
        choices: filteredChoices,
        options: filteredChoices,
        customInputPlaceholder: typeof nextStep.placeholder === 'string' ? nextStep.placeholder : '',
        progress: typeof nextStep.progress === 'string' ? nextStep.progress : normalizedStep.progress || '',
      })

      index += 1
      continue
    }

    steps.push({
      ...normalizedStep,
      allowCustomInput: normalizedStep.allowCustomInput || hasCustomInputOption(normalizedStep) || isCustomInputStep(nextRawStep, normalizedStep.id),
      customInputPlaceholder: normalizedStep.customInputPlaceholder || 'Schrijf hier je antwoord...',
    })
  }

  const reflectionIds = steps.filter((step) => step?.type === STEP_TYPES.REFLECTION).map((step) => step.id).filter(Boolean)
  const endIds = steps.filter((step) => step?.type === STEP_TYPES.END).map((step) => step.id).filter(Boolean)

  return steps.map((step) => {
    if (step?.type === STEP_TYPES.QUESTION) {
      const options = Array.isArray(step.options)
        ? step.options.map((option) => ({
            ...option,
            next: normalizeLoadedNextTarget(option?.next, reflectionIds, endIds),
          }))
        : []

      return {
        ...step,
        choices: options,
        options,
        next: normalizeLoadedNextTarget(step.next, reflectionIds, endIds),
      }
    }

    if (step?.type === STEP_TYPES.CONTINUE) {
      return {
        ...step,
        next: normalizeLoadedNextTarget(step.next, reflectionIds, endIds),
      }
    }

    if (step?.type === STEP_TYPES.REFLECTION) {
      return {
        ...step,
        next: normalizeLoadedNextTarget(step.next, reflectionIds, endIds),
      }
    }

    return step
  })
}

export function mapStepsForSave(steps = []) {
  if (!Array.isArray(steps)) return []

  const savedSteps = []

  steps.forEach((step) => {
    if (step.onlyNextButton) {
      savedSteps.push({
        ...mapStepForSave(step),
        progress: resolveSavedProgress(step.progress, savedSteps.length),
      })
      return
    }

    const savedStep = mapStepForSave(step)

    if (!step.allowCustomInput) {
      savedSteps.push({
        ...savedStep,
        progress: resolveSavedProgress(step.progress, savedSteps.length),
      })
      return
    }

    const inputStep = createSavedInputStep(step)

    savedSteps.push({
      ...savedStep,
      options: mapOptionsForSave(step),
      progress: resolveSavedProgress(step.progress, savedSteps.length),
    })
    savedSteps.push({
      ...inputStep,
      progress: resolveSavedProgress(inputStep.progress, savedSteps.length),
    })
  })

  return savedSteps.map((step, index) => ({
    ...step,
    progress: resolveSavedProgress(step.progress, index),
  }))
}

export function mapReflectionStepForSave(step = {}, progressIndex = 0) {
  return createSavedReflectionStep(step, progressIndex)
}

export function mapEndStepForSave(step = {}, progressIndex = 0) {
  return createSavedEndStep(step, progressIndex)
}

export function createQuestionStep(index = 0, overrides = {}) {
  return createDefaultStep(STEP_TYPES.QUESTION, index, overrides)
}

export function createReflectionStep(index = 0, overrides = {}) {
  return createDefaultStep(STEP_TYPES.REFLECTION, index, overrides)
}

export function createEndStep(index = 0, overrides = {}) {
  return createDefaultStep(STEP_TYPES.END, index, overrides)
}

export function normalizeQuestionOptions(rawChoices) {
  return normalizeChoices(rawChoices)
}
