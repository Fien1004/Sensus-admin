<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="open" class="drawer-backdrop" @click.self="emitClose">
        <aside class="drawer-panel" :style="panelStyle" role="dialog" aria-modal="true" :aria-label="title">
          <header class="drawer-header">
            <div class="drawer-title-block">
              <h2 class="drawer-title">{{ title }}</h2>
              <p v-if="subtitle" class="drawer-subtitle">{{ subtitle }}</p>
            </div>

            <div class="drawer-header-actions">
              <slot name="actions"></slot>
              <button type="button" class="drawer-close-button" :aria-label="closeLabel" @click="emitClose">×</button>
            </div>
          </header>

          <div class="drawer-content">
            <slot></slot>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: 'min(100vw, 560px)',
  },
  closeLabel: {
    type: String,
    default: 'Sluiten',
  },
})

const emit = defineEmits(['close'])

const panelStyle = computed(() => ({
  width: props.width,
}))

function emitClose() {
  emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return

    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
  { immediate: true }
)
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  justify-content: flex-end;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(2px);
}

.drawer-panel {
  height: 100%;
  max-width: 100vw;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  box-shadow: -16px 0 40px rgba(15, 23, 42, 0.16);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 18px;
  border-bottom: 1px solid var(--color-border);
}

.drawer-title-block {
  min-width: 0;
}

.drawer-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 700;
  color: var(--color-neutral-900);
}

.drawer-subtitle {
  margin: 6px 0 0;
  color: var(--color-neutral-700);
  font-size: 14px;
}

.drawer-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.drawer-close-button {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-neutral-800);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.drawer-close-button:hover {
  background: var(--color-neutral-100);
}

.drawer-content {
  padding: 22px;
  overflow: auto;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.18s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-enter-active .drawer-panel,
.drawer-fade-leave-active .drawer-panel {
  transition: transform 0.22s ease;
}

.drawer-fade-enter-from .drawer-panel,
.drawer-fade-leave-to .drawer-panel {
  transform: translateX(24px);
}

@media (max-width: 768px) {
  .drawer-panel {
    width: min(100vw, 100%);
  }

  .drawer-header,
  .drawer-content {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>