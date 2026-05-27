<template>
  <section class="preview-shell narrative-shell card">
    <p class="preview-heading">{{ step.title || 'Titel' }}</p>
    <p class="preview-text">{{ step.description || 'Beschrijving' }}</p>

    <div class="content-card">
      <p class="content-text">{{ step.contentCard?.text || 'Tekst' }}</p>
      <p v-if="step.contentCard?.italicText" class="content-italic">{{ step.contentCard.italicText }}</p>
    </div>

    <template v-if="step.onlyNextButton">
      <button type="button" class="preview-option preview-option-custom" @click="goTo(step.next)">
        <span>{{ step.buttonText || 'Volgende' }}</span>
      </button>
    </template>

    <template v-else>
      <p class="preview-body">{{ step.question || 'Vraagtekst' }}</p>

      <div class="preview-options">
        <button
          v-for="(option, optionIndex) in options"
          :key="optionIndex"
          type="button"
          class="preview-option"
          @click="goTo(option.next)"
        >
          <span>{{ option.label || `Keuze ${optionIndex + 1}` }}</span>
        </button>
        <button v-if="step.allowCustomInput" type="button" class="preview-option preview-option-custom" @click="goTo(customInputNext)">
          <span>Eigen input</span>
        </button>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  step: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['select'])

const options = computed(() => {
  if (Array.isArray(props.step?.options) && props.step.options.length > 0) {
    return props.step.options
  }

  if (Array.isArray(props.step?.choices)) {
    return props.step.choices
  }

  return []
})

const customInputNext = computed(() => {
  const inputOption = options.value.find((option) => option?.label === 'Eigen input')
  return inputOption?.next || ''
})

function goTo(next) {
  if (!next) return

  emit('select', next)
}
</script>

<style scoped>
.narrative-shell {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
}

.content-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.content-text {
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-lg);
  line-height: 1.5;
}

.content-italic {
  margin: 0;
  color: var(--color-text-soft);
  font-size: var(--text-md);
  font-style: italic;
  line-height: 1.5;
}

.preview-heading,
.preview-text,
.preview-body {
  margin: 0;
  color: var(--color-text);
  line-height: 1.5;
}

.preview-text {
  color: var(--color-text-soft);
}

.preview-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.preview-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-neutral-900);
  font-family: var(--font-family-base);
  font-size: var(--text-md);
}

.preview-option-custom {
  background: var(--color-neutral-100);
}
</style>