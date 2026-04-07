import { defineStore } from 'pinia'

export type NotificationType = 'new_booking' | 'student_card_uploaded'

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  payload: Record<string, any>
  read: boolean
  createdAt: string
}

const STORAGE_KEY = 'hdn-admin-notifications'
const MAX_NOTIFICATIONS = 100

const loadStoredNotifications = (): AppNotification[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is AppNotification => {
      return Boolean(
        item &&
        typeof item.id === 'string' &&
        typeof item.type === 'string' &&
        typeof item.message === 'string' &&
        typeof item.read === 'boolean' &&
        typeof item.createdAt === 'string'
      )
    })
  } catch {
    return []
  }
}

const persistNotifications = (notifications: AppNotification[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)))
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: loadStoredNotifications() as AppNotification[],
    pendingBookingIntentId: null as string | null,
  }),
  getters: {
    unreadCount(): number {
      return this.notifications.filter((n) => !n.read).length
    },
    recentNotifications(): AppNotification[] {
      return [...this.notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 20)
    },
  },
  actions: {
    addNotification(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'> & { id?: string; createdAt?: string; read?: boolean }) {
      const normalized: AppNotification = {
        ...notification,
        id: notification.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        read: notification.read ?? false,
        createdAt: notification.createdAt ?? new Date().toISOString(),
      }

      const existingIndex = this.notifications.findIndex((item) => item.id === normalized.id)
      if (existingIndex >= 0) {
        const existing = this.notifications[existingIndex]
        this.notifications.splice(existingIndex, 1, {
          ...normalized,
          read: existing.read || normalized.read,
        })
      } else {
        this.notifications.unshift(normalized)
      }

      this.notifications = [...this.notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, MAX_NOTIFICATIONS)
      persistNotifications(this.notifications)
    },
    syncHistory(notifications: AppNotification[]) {
      const existingReadMap = new Map(this.notifications.map((notification) => [notification.id, notification.read]))

      notifications.forEach((notification) => {
        this.addNotification({
          ...notification,
          read: existingReadMap.get(notification.id) ?? notification.read,
        })
      })
    },
    markAllRead() {
      this.notifications.forEach((n) => (n.read = true))
      persistNotifications(this.notifications)
    },
    markRead(id: string) {
      const n = this.notifications.find((n) => n.id === id)
      if (n) n.read = true
      persistNotifications(this.notifications)
    },
    setPendingBookingIntent(bookingId: string) {
      this.pendingBookingIntentId = bookingId
    },
    consumePendingBookingIntent(): string | null {
      const bookingId = this.pendingBookingIntentId
      this.pendingBookingIntentId = null
      return bookingId
    },
    clearAll() {
      this.notifications = []
      this.pendingBookingIntentId = null
      persistNotifications(this.notifications)
    },
  },
})
