const STORAGE_KEY = 'sensus-admin.notifications'

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'seed-1',
    type: 'scenario_created',
    message: 'Nieuw scenario aangemaakt: Online gesprek loopt vast',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'seed-2',
    type: 'scenario_updated',
    message: 'Scenario bijgewerkt: Situatie op een feestje',
    created_at: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
  },
]

let memoryNotifications = [...DEFAULT_NOTIFICATIONS]

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createNotificationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `notification_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function readStoredNotifications() {
  if (!hasStorage()) {
    return memoryNotifications
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS))
      return DEFAULT_NOTIFICATIONS
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return DEFAULT_NOTIFICATIONS
    }

    return parsed
  } catch {
    return DEFAULT_NOTIFICATIONS
  }
}

function writeStoredNotifications(notifications) {
  if (!hasStorage()) {
    memoryNotifications = notifications
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}

function normalizeNotification(notification) {
  return {
    id: notification.id || createNotificationId(),
    type: notification.type || 'info',
    message: String(notification.message || '').trim(),
    created_at: notification.created_at || new Date().toISOString(),
  }
}

export function listNotifications({ limit = 10 } = {}) {
  return readStoredNotifications()
    .slice()
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, limit)
}

export function createNotification(notification) {
  const normalizedNotification = normalizeNotification(notification)
  const notifications = [normalizedNotification, ...readStoredNotifications().filter((item) => item.id !== normalizedNotification.id)]

  writeStoredNotifications(notifications)

  return normalizedNotification
}

export function deleteNotification(notificationId) {
  const notifications = readStoredNotifications().filter((item) => item.id !== notificationId)

  writeStoredNotifications(notifications)

  return notifications
}

export function clearNotifications() {
  writeStoredNotifications([])

  return []
}