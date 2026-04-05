import { watch } from 'vue'
import { useSocket } from './useSocket'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/utils/apiClient'
import type { Role } from '@/types/api'

const TOKEN_KEY = 'hdn-auth-token'
const PORTAL_ROLES: Role[] = ['ADMIN', 'MANAGER']
let initialized = false

export const useNotifications = () => {
  const { connect, disconnect, getSocket } = useSocket()
  const notificationStore = useNotificationStore()
  const authStore = useAuthStore()

  const loadHistory = async () => {
    try {
      const response = await apiClient.getAdminNotifications({ page: 1, limit: 50 })
      const items = response.data?.items ?? []

      notificationStore.syncHistory(items.map((item) => ({
        id: `server-${item.id}`,
        type: item.type,
        message: item.message,
        payload: (item.payload ?? {}) as Record<string, any>,
        read: false,
        createdAt: item.createDate,
      })))
    } catch {
      // History loading is best-effort and should not block realtime notifications.
    }
  }

  const setupListeners = () => {
    const socket = getSocket()
    if (!socket) return

    socket.off('new_booking')
    socket.off('student_card_uploaded')

    socket.on('new_booking', (payload: { notificationId?: number; bookingId: string; passengerName: string; bookingType: string; createDate: string }) => {
      notificationStore.addNotification({
        id: payload.notificationId ? `server-${payload.notificationId}` : undefined,
        type: 'new_booking',
        message: `Đặt chỗ mới từ ${payload.passengerName} (${payload.bookingType})`,
        payload,
        createdAt: payload.createDate,
      })
    })

    socket.on('student_card_uploaded', (payload: { notificationId?: number; verificationId: number; userId: string; submittedAt: string }) => {
      notificationStore.addNotification({
        id: payload.notificationId ? `server-${payload.notificationId}` : undefined,
        type: 'student_card_uploaded',
        message: `Có yêu cầu xác minh sinh viên mới #${payload.verificationId}`,
        payload,
        createdAt: payload.submittedAt,
      })
    })
  }

  const syncConnection = async (authenticated: boolean, userRole: Role | null) => {
    if (authenticated && userRole && PORTAL_ROLES.includes(userRole)) {
      await loadHistory()

      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        connect(token)
        setTimeout(setupListeners, 300)
      }
      return
    }

    disconnect()
    notificationStore.clearAll()
  }

  const init = () => {
    if (initialized) return
    initialized = true

    void syncConnection(authStore.isAuthenticated, authStore.userRole)

    watch(
      () => [authStore.isAuthenticated, authStore.userRole] as const,
      ([authenticated, userRole]) => {
        void syncConnection(authenticated, userRole)
      },
    )
  }

  return { init }
}
