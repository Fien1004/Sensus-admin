<template>
  <div class="admin-layout">
    <AdminSidebar />

    <div class="admin-content">
      <AdminTopbar />

      <main class="admin-page">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import AdminSidebar from '@/components/sidebar/AdminSidebar.vue'
import AdminTopbar from '@/components/topbar/AdminTopbar.vue'
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