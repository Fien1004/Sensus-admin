<template>
  <section class="preview-shell chat-shell card">
    <p class="preview-heading">{{ step.title || 'Titel' }}</p>
    <p class="preview-text">{{ step.description || 'Beschrijving' }}</p>

    <div class="chat-card">
      <div v-for="(message, messageIndex) in chatMessages" :key="messageIndex" class="chat-row">
        <p v-if="message.time" class="chat-time">{{ formatTime(message.time) }}</p>

        <div v-if="isStatusMessage(message)" class="chat-status-message">
          {{ message.text || 'Gelezen' }}
        </div>

        <div
          v-else
          :class="['chat-bubble', message.sender === 'user' ? 'chat-bubble--user' : 'chat-bubble--other']"
        >
          {{ message.text || placeholderText(message.sender) }}
        </div>
      </div>
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
import { computed } from 'vue'

const props = defineProps({
  step: { type: Object, default: () => ({}) },
})

const chatMessages = computed(() => {
  const messages = Array.isArray(props.step?.chatMessages) ? props.step.chatMessages : []

  return messages.length > 0
    ? messages
    : [
        { sender: 'user', text: '', time: '' },
        { sender: 'other', text: '', time: '' },
      ]
})

function formatTime(value) {
  if (!value) return ''

  return value
}

function isStatusMessage(message) {
  const text = String(message?.text || '')
  return message?.sender === 'status' || /gelezen|read|seen/i.test(text)
}

function placeholderText(sender) {
  return sender === 'user' ? 'Jouw bericht' : 'Bericht'
}
</script>

<style scoped>
.chat-shell {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
}

.chat-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.chat-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.chat-time {
  margin: 0;
  text-align: center;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.chat-bubble {
  max-width: 78%;
  padding: 14px 18px;
  border-radius: var(--radius-xl);
  font-size: var(--text-md);
  line-height: 1.4;
  word-break: break-word;
}

.chat-bubble--user {
  align-self: flex-end;
  background: var(--color-secondary-600);
  color: var(--color-surface);
  border-top-right-radius: var(--radius-sm);
}

.chat-bubble--other {
  align-self: flex-start;
  background: var(--color-neutral-200);
  color: var(--color-neutral-900);
  border-top-left-radius: var(--radius-sm);
}

.chat-status-message {
  align-self: center;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.preview-body {
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-md);
  line-height: 1.5;
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

.preview-heading,
.preview-text {
  margin: 0;
  color: var(--color-text);
}
</style>