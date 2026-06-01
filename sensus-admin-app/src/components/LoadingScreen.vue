<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import lottie from 'lottie-web'

import loadingAnimation from '@/assets/loader/Loading.json'

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const loaderElement = ref(null)
let animation = null

onMounted(() => {
  if (!loaderElement.value) return

  animation = lottie.loadAnimation({
    container: loaderElement.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: loadingAnimation,
  })
})

onBeforeUnmount(() => {
  animation?.destroy()
})
</script>

<template>
  <div v-show="show" class="loading-screen" aria-live="polite" aria-busy="true">
    <div class="loading-screen__content">
      <div ref="loaderElement" class="loading-screen__animation" />
      <p class="loading-screen__text">Even laden...</p>
    </div>
  </div>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: rgba(248, 249, 250, 0.94);
}

.loading-screen__content {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
}

.loading-screen__animation {
  width: 132px;
  height: 132px;
}

.loading-screen__text {
  margin: 0;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
  font-weight: 600;
}
</style>
