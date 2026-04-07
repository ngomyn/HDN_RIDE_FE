import { defineStore } from 'pinia'
import { apiClient, setAuthToken, clearAuthToken } from '@/utils/apiClient'
import type { Role } from '@/types/api'
import type { AdminProfile } from '@/types/models'

const AUTH_STORAGE_KEY = 'hdn-admin-auth'
const PORTAL_ROLES: Role[] = ['ADMIN', 'MANAGER']

const defaultProfile: AdminProfile = {
  fullName: '',
  role: '',
  roleCode: null,
  email: '',
  phone: '',
}

const getRoleLabel = (role: Role | null): string => {
  if (role === 'MANAGER') return 'Quản lý'
  if (role === 'ADMIN') return 'Quản trị viên'
  return ''
}

const buildProfile = (fullName: string, phone: string, role: Role | null): AdminProfile => ({
  fullName,
  role: getRoleLabel(role),
  roleCode: role,
  email: phone,
  phone,
})

const isPortalRole = (role: Role | null): role is Role => role !== null && PORTAL_ROLES.includes(role)

const parseStoredSession = (): { isAuthenticated: boolean; profile: AdminProfile; userRole: Role | null } => {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      profile: defaultProfile,
      userRole: null,
    }
  }

  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return {
      isAuthenticated: false,
      profile: defaultProfile,
      userRole: null,
    }
  }

  try {
    const parsed = JSON.parse(raw) as { profile?: AdminProfile; userRole?: Role | null }
    const userRole = parsed.userRole ?? parsed.profile?.roleCode ?? null
    if (isPortalRole(userRole) && parsed.profile) {
      return {
        isAuthenticated: true,
        profile: {
          ...parsed.profile,
          role: getRoleLabel(userRole),
          roleCode: userRole,
        },
        userRole,
      }
    }
  } catch {
    // Fall through to JWT bootstrap for legacy sessions.
  }

  const token = localStorage.getItem('hdn-auth-token')
  if (!token) {
    return {
      isAuthenticated: false,
      profile: defaultProfile,
      userRole: null,
    }
  }

  try {
    const [, payload] = token.split('.')
    if (!payload) {
      throw new Error('Invalid token payload')
    }

    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      name?: string
      phone?: string
      role?: Role
    }

    const userRole = decoded.role ?? null
    if (isPortalRole(userRole) && decoded.phone) {
      return {
        isAuthenticated: true,
        profile: buildProfile(decoded.name ?? decoded.phone, decoded.phone, userRole),
        userRole,
      }
    }
  } catch {
    // Ignore legacy decode errors and reset to logged-out state.
  }

  return {
    isAuthenticated: false,
    profile: defaultProfile,
    userRole: null,
  }
}

const initialSession = parseStoredSession()

const persistSession = (profile: AdminProfile, userRole: Role) => {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      profile,
      userRole,
    }),
  )
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: initialSession.isAuthenticated,
    profile: initialSession.profile,
    userRole: initialSession.userRole as Role | null,
    loading: false,
    error: null as string | null,
  }),
  getters: {
    isAdmin(state): boolean {
      return state.userRole === 'ADMIN'
    },
    isManager(state): boolean {
      return state.userRole === 'MANAGER'
    },
    canAccess: (state) => (allowedRoles?: Role[]) => {
      if (!state.userRole) {
        return false
      }

      return !allowedRoles || allowedRoles.includes(state.userRole)
    },
    homeRoute(): string {
      return '/dashboard'
    },
  },
  actions: {
    async login(phone: string, password: string) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.login(phone, password)
        const userRole = response.data.user.role

        if (!PORTAL_ROLES.includes(userRole)) {
          clearAuthToken()
          localStorage.removeItem(AUTH_STORAGE_KEY)
          this.isAuthenticated = false
          this.userRole = null
          this.profile = defaultProfile
          this.error = 'Tài khoản này không có quyền truy cập trang quản trị'
          return
        }

        const profile = buildProfile(response.data.user.name, response.data.user.phone, userRole)
        this.isAuthenticated = true
        this.userRole = userRole
        this.profile = profile
        persistSession(profile, userRole)
        setAuthToken(response.data.token)
      } catch (err: any) {
        this.error = err.message || 'Dang nhap that bai'
        this.isAuthenticated = false
        this.userRole = null
        this.profile = defaultProfile
      } finally {
        this.loading = false
      }
    },
    async logout() {
      this.isAuthenticated = false
      this.userRole = null
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
        if (this.userRole) {
          persistSession(this.profile, this.userRole)
        }
      } catch (err: any) {
        this.error = err.message || 'Cap nhat hop so that bai'
      } finally {
        this.loading = false
      }
    },
    async fetchProfile() {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.getMe()
        const userRole = response.data.role

        if (!PORTAL_ROLES.includes(userRole)) {
          await this.logout()
          this.error = 'Tài khoản này không có quyền truy cập trang quản trị'
          return
        }

        const profile = buildProfile(response.data.name, response.data.phone, userRole)
        this.isAuthenticated = true
        this.userRole = userRole
        this.profile = profile
        persistSession(profile, userRole)
      } catch (err: any) {
        this.error = err.message || 'Tai hop so that bai'
        await this.logout()
      } finally {
        this.loading = false
      }
    },
  },
})
