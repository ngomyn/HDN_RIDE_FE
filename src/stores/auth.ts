import { defineStore } from 'pinia'
import { apiClient, setAuthToken, clearAuthToken } from '@/utils/apiClient'
import type { AdminProfile } from '@/types/models'

const AUTH_STORAGE_KEY = 'hdn-admin-auth'

const defaultProfile: AdminProfile = {
  fullName: 'Admin Nguyen',
  role: 'Quan tri vien',
  email: 'admin@hdnride.vn',
  phone: '0905 123 456',
}

const readAuthState = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }
  return localStorage.getItem(AUTH_STORAGE_KEY) === '1'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: readAuthState(),
    profile: defaultProfile,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async login(phone: string, password: string) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.login(phone, password)
        this.isAuthenticated = true
        this.profile = {
          fullName: response.data.user.name,
          role: 'Quan tri vien',
          email: phone,
          phone: response.data.user.phone,
        }
        localStorage.setItem(AUTH_STORAGE_KEY, '1')
        setAuthToken(response.data.token)
      } catch (err: any) {
        this.error = err.message || 'Dang nhap that bai'
        this.isAuthenticated = false
      } finally {
        this.loading = false
      }
    },
    async logout() {
      this.isAuthenticated = false
      this.profile = defaultProfile
      localStorage.removeItem(AUTH_STORAGE_KEY)
      clearAuthToken()
    },
    async updateProfile(payload: Partial<AdminProfile>) {
      try {
        this.loading = true
        this.error = null
        await apiClient.updateProfile({ name: payload.fullName, avatar: undefined })
        this.profile = { ...this.profile, ...payload }
      } catch (err: any) {
        this.error = err.message || 'Cap nhat hop so that bai'
      } finally {
        this.loading = false
      }
    },
    async fetchProfile() {
      try {
        this.loading = true
        const response = await apiClient.getMe()
        this.profile = {
          fullName: response.data.name,
          role: this.profile.role,
          email: response.data.phone,
          phone: response.data.phone,
        }
      } catch (err: any) {
        this.error = err.message || 'Tai hop so that bai'
      } finally {
        this.loading = false
      }
    },
  },
})
