import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createNotification, deleteNotification, listNotifications, clearNotifications as clearStoredNotifications } from '@/services/notifications'

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])
  const isLoading = ref(false)
  const isLoaded = ref(false)

  const recentNotifications = computed(() => items.value.slice(0, 10))
  const notificationCount = computed(() => items.value.length)

  async function loadNotifications(force = false) {
    if (isLoading.value || (isLoaded.value && !force)) {
      return items.value
    }

    isLoading.value = true

    try {
      items.value = listNotifications({ limit: 10 })
      isLoaded.value = true
      return items.value
    } finally {
      isLoading.value = false
    }
  }

  async function refreshNotifications() {
    return loadNotifications(true)
  }

  async function addNotification(notification) {
    const createdNotification = createNotification(notification)

    items.value = [createdNotification, ...items.value.filter((item) => item.id !== createdNotification.id)].slice(0, 10)
    isLoaded.value = true

    return createdNotification
  }

  async function removeNotification(notificationId) {
    if (!notificationId) {
      return items.value
    }

    console.log('[notifications-store] removing notification', notificationId)
    deleteNotification(notificationId)
    items.value = [...items.value.filter((item) => item.id !== notificationId)]
    isLoaded.value = true

    return items.value
  }

  async function removeAllNotifications() {
    console.log('[notifications-store] removing all notifications')
    clearStoredNotifications()
    items.value = []
    isLoaded.value = true

    return items.value
  }

  return {
    items,
    isLoading,
    isLoaded,
    recentNotifications,
    notificationCount,
    loadNotifications,
    refreshNotifications,
    addNotification,
    removeNotification,
    removeAllNotifications,
  }
})