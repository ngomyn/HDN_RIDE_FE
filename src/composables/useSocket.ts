import { io, type Socket } from 'socket.io-client'
import { ref } from 'vue'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace('/api', '')

let socket: Socket | null = null
const isConnected = ref(false)

export const useSocket = () => {
  const connect = (token: string) => {
    if (socket?.connected) return

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      isConnected.value = true
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message)
    })
  }

  const disconnect = () => {
    socket?.disconnect()
    socket = null
    isConnected.value = false
  }

  const getSocket = () => socket

  return { connect, disconnect, getSocket, isConnected }
}
