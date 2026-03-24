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

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as AppNotification[],
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
    addNotification(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
      this.notifications.unshift({
        ...notification,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        read: false,
        createdAt: new Date().toISOString(),
      })
    },
    markAllRead() {
      this.notifications.forEach((n) => (n.read = true))
    },
    markRead(id: string) {
      const n = this.notifications.find((n) => n.id === id)
      if (n) n.read = true
    },
    clearAll() {
      this.notifications = []
    },
  },
})
