<template>
  <section class="preview-shell narrative-shell card">
    <p class="preview-heading">{{ step.title || 'Titel' }}</p>
    <p class="preview-text">{{ step.description || 'Beschrijving' }}</p>

    <div class="content-card">
      <p class="content-text">{{ step.contentCard?.text || 'Tekst' }}</p>
      <p v-if="step.contentCard?.italicText" class="content-italic">{{ step.contentCard.italicText }}</p>
    </div>

    <p class="preview-body">{{ step.question || 'Vraagtekst' }}</p>

    <div class="preview-options">
      <button v-for="(option, optionIndex) in step.options || []" :key="optionIndex" type="button" class="preview-option">
        <span>{{ option.label || `Keuze ${optionIndex + 1}` }}</span>
      </button>
      <button v-if="step.allowCustomInput" type="button" class="preview-option preview-option-custom">
        <span>Eigen input</span>
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  step: { type: Object, default: () => ({}) },
})
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