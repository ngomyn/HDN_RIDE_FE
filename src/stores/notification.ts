import { defineStore } from 'pinia'
import { notificationsSeed } from '@/data/mockData'
import type { NotificationItem } from '@/types/models'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: notificationsSeed as NotificationItem[],
    unreadCount: notificationsSeed.filter(n => !n.read).length,
  }),
  actions: {
    markAsRead(id: number) {
      const item = this.items.find(n => n.id === id)
      if (item && !item.read) {
        item.read = true
        this.unreadCount--
      }
    },
    markAllAsRead() {
      this.items.forEach(item => {
        if (!item.read) {
          item.read = true
        }
      })
      this.unreadCount = 0
    },
    addNotification(payload: Omit<NotificationItem, 'id' | 'createdAt'>) {
      const id = Math.max(...this.items.map(n => n.id), 0) + 1
      const item: NotificationItem = {
        ...payload,
        id,
        createdAt: new Date().toISOString(),
      }
      this.items.unshift(item)
      if (!item.read) {
        this.unreadCount++
      }
    },
  },
})
