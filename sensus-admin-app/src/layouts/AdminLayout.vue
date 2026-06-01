<template>
  <div class="admin-layout">
    <AdminSidebar />

    <div class="admin-content">
      <AdminTopbar />

      <main class="admin-page">
        <ErrorState v-if="isOffline" type="offline" />
        <RouterView v-else />
      </main>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

import ErrorState from '@/components/ErrorState.vue'
import AdminSidebar from '@/components/sidebar/AdminSidebar.vue'
import AdminTopbar from '@/components/topbar/AdminTopbar.vue'

const isOffline = ref(typeof navigator !== 'undefined' ? !navigator.onLine : false)

function syncConnectionStatus() {
  isOffline.value = !navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', syncConnectionStatus)
  window.addEventListener('offline', syncConnectionStatus)
  syncConnectionStatus()
})

onBeforeUnmount(() => {
  window.removeEventListener('online', syncConnectionStatus)
  window.removeEventListener('offline', syncConnectionStatus)
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f7f4f2;
}

.admin-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.admin-page {
  padding: 32px;
}
</style>
