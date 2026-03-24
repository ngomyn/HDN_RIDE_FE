import { watch } from 'vue'
import { useSocket } from './useSocket'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'

const TOKEN_KEY = 'hdn-auth-token'
let initialized = false

export const useNotifications = () => {
  const { connect, disconnect, getSocket } = useSocket()
  const notificationStore = useNotificationStore()
  const authStore = useAuthStore()

  const setupListeners = () => {
    const socket = getSocket()
    if (!socket) return

    socket.off('new_booking')
    socket.off('student_card_uploaded')

    socket.on('new_booking', (payload: { bookingId: number; passengerName: string; bookingType: string; createdAt: string }) => {
      notificationStore.addNotification({
        type: 'new_booking',
        message: `Đặt chỗ mới từ ${payload.passengerName} (${payload.bookingType})`,
        payload,
      })
    })

    socket.on('student_card_uploaded', (payload: { userId: number; userName: string; createdAt: string }) => {
      notificationStore.addNotification({
        type: 'student_card_uploaded',
        message: `${payload.userName} đã nộp thẻ sinh viên cần xác minh`,
        payload,
      })
    })
  }

  const init = () => {
    if (initialized) return
    initialized = true

    // Connect if token already in localStorage
    const existingToken = localStorage.getItem(TOKEN_KEY)
    if (existingToken) {
      connect(existingToken)
      setTimeout(setupListeners, 300)
    }

    // Watch for login/logout
    watch(
      () => authStore.isAuthenticated,
      (authenticated) => {
        if (authenticated) {
          const token = localStorage.getItem(TOKEN_KEY)
          if (token) {
            connect(token)
            setTimeout(setupListeners, 300)
          }
        } else {
          disconnect()
          initialized = false
        }
      }
    )
  }

  return { init }
}
