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