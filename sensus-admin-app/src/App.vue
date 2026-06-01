<script setup>
import { onBeforeUnmount, ref } from 'vue'

import LoadingScreen from '@/components/LoadingScreen.vue'
import router from '@/router'

const isLoading = ref(false)
let loadingTimer = null

const clearLoadingTimer = () => {
  if (!loadingTimer) return

  window.clearTimeout(loadingTimer)
  loadingTimer = null
}

const finishLoading = () => {
  clearLoadingTimer()

  loadingTimer = window.setTimeout(() => {
    isLoading.value = false
    loadingTimer = null
  }, 300)
}

const removeBeforeEach = router.beforeEach(() => {
  clearLoadingTimer()
  isLoading.value = true
})

const removeAfterEach = router.afterEach(() => {
  finishLoading()
})

router.onError(() => {
  finishLoading()
})

onBeforeUnmount(() => {
  clearLoadingTimer()
  removeBeforeEach?.()
  removeAfterEach?.()
})
</script>

<template>
  <RouterView />
  <LoadingScreen :show="isLoading" />
</template>

<style scoped></style>
