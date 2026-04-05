import type {
  AccountStatus,
  AdminDriver,
  AdminDriverListQuery,
  ApiResponse,
  AssignBookingDto,
  PaginatedResponse,
  AuthResponse,
  BookingStatus,
  CreateDriverDto,
  CreateDriverResult,
  CustomerAdminItem,
  CustomerAdminListQuery,
  CustomerAdminSummary,
  DriverSummary,
  Role,
  Route,
  User,
  Trip,
  Booking,
  DriverStatusUpdateResult,
  Vehicle,
  CreateTripDto,
  CreateBookingDto,
  AdminBookingListQuery,
  AdminBookingSummary,
  UpdateDriverDto,
  UpdateBookingPaymentStatusDto,
  UpdateDriverStatusDto,
  UpdateProfileDto,
  District,
  StudentVerification,
  VerifyStudentCardDto,
  PriceConfig,
  CreatePriceConfigDto,
  UpdatePriceConfigDto,
  AdminRevenueItem,
  AdminRevenueListResponse,
  TripSearchQuery,
  OperationalSettings,
  UpdateOperationalSettingsDto,
  AdminNotificationHistoryItem,
} from '@/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

type UnauthorizedHandler = () => void | Promise<void>

let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('hdn-auth-token') : null
let unauthorizedHandler: UnauthorizedHandler | null = null
let unauthorizedPromise: Promise<void> | null = null

export const setAuthToken = (token: string) => {
  authToken = token
  if (typeof window !== 'undefined') {
    localStorage.setItem('hdn-auth-token', token)
  }
}

export const clearAuthToken = () => {
  authToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hdn-auth-token')
  }
}

export const registerUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler
}

const notifyUnauthorized = async () => {
  if (!unauthorizedHandler) {
    return
  }

  if (!unauthorizedPromise) {
    unauthorizedPromise = Promise.resolve(unauthorizedHandler()).finally(() => {
      unauthorizedPromise = null
    })
  }

  await unauthorizedPromise
}

const getHeaders = (includeAuth = true) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (includeAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  return headers
}

const handleResponse = async <T>(response: Response, handleUnauthorized = true): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    if (response.status === 401 && handleUnauthorized) {
      await notifyUnauthorized()
    }
    throw new Error(errorData.error?.message || `HTTP ${response.status}`)
  }
  return response.json()
}

export const apiClient = {
  // Auth endpoints
  async register(name: string, phone: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ name, phone, password }),
    })
    const data = await handleResponse<ApiResponse<AuthResponse>>(res, false)
    if (data.data?.token) {
      setAuthToken(data.data.token)
    }
    return data
  },

  async login(phone: string, password: string, role?: Role) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ phone, password, role }),
    })
    const data = await handleResponse<ApiResponse<AuthResponse>>(res, false)
    if (data.data?.token) {
      setAuthToken(data.data.token)
    }
    return data
  },

  // User endpoints
  async getMe() {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<User>>(res)
  },

  async updateProfile(payload: UpdateProfileDto) {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<User>>(res)
  },

  async getMyRating() {
    const res = await fetch(`${API_BASE_URL}/users/me/rating`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<{ rating: number }>>(res)
  },

  async getUsers(params?: { role?: Role; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value))
        }
      })
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/users${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<User>>>(res)
  },

  // Vehicle endpoints
  async getMyVehicles() {
    const res = await fetch(`${API_BASE_URL}/vehicles/my`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Vehicle[]>>(res)
  },

  async getAllVehicles() {
    const res = await fetch(`${API_BASE_URL}/vehicles`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Vehicle[]>>(res)
  },

  // Route endpoints
  async getRoutes() {
    const res = await fetch(`${API_BASE_URL}/routes`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Route[]>>(res)
  },

  // Trip endpoints
  async searchTrips(params: TripSearchQuery = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value))
      }
    })
    const res = await fetch(`${API_BASE_URL}/trips/search?${query}`, {
      headers: getHeaders(false),
    })
    return handleResponse<ApiResponse<PaginatedResponse<Trip>>>(res)
  },

  async getMyTrips() {
    const res = await fetch(`${API_BASE_URL}/trips/my`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Trip[]>>(res)
  },

  async getTripDetail(id: string) {
    const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
      headers: getHeaders(false),
    })
    return handleResponse<ApiResponse<Trip>>(res)
  },

  async getAvailableSeats(tripId: string) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/available-seats`, {
      headers: getHeaders(false),
    })
    return handleResponse<ApiResponse<{ availableSeats: number }>>(res)
  },

  async createTrip(payload: CreateTripDto) {
    const res = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<Trip>>(res)
  },

  async updateTrip(id: string, payload: { status?: string; totalSeats?: number }) {
    const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<Trip>>(res)
  },

  async deleteTrip(id: string) {
    const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<{ message: string }>>(res)
  },

  // Booking endpoints
  async createBooking(payload: CreateBookingDto) {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async getMyBookings(params?: { status?: BookingStatus; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, String(value))
      })
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/bookings/my${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<Booking>>>(res)
  },

  async getBookingHistory(params?: { status?: BookingStatus; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, String(value))
      })
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/bookings/history${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<Booking>>>(res)
  },

  async getBookingDetail(id: string) {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async cancelBooking(id: string, cancelReason?: string) {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(cancelReason ? { cancelReason } : {}),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async confirmBooking(id: string) {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async completeBooking(id: string) {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async getTripBookings(tripId: string) {
    const res = await fetch(`${API_BASE_URL}/bookings/trip/${tripId}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Booking[]>>(res)
  },

  async getAdminPendingBookings(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, String(value))
      })
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/bookings/admin/pending${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<Booking>>>(res)
  },

  async getAdminBookings(params?: AdminBookingListQuery) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value))
        }
      })
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/bookings/admin${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<Booking>>>(res)
  },

  async getAdminBookingSummary(date?: string) {
    const query = new URLSearchParams()
    if (date) {
      query.append('date', date)
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/bookings/admin/summary${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<AdminBookingSummary>>(res)
  },

  async adminConfirmBooking(bookingId: string) {
    const res = await fetch(`${API_BASE_URL}/bookings/admin/${bookingId}/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async adminCancelBooking(bookingId: string, cancelReason: string) {
    const res = await fetch(`${API_BASE_URL}/bookings/admin/${bookingId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ cancelReason }),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async assignBookingToTrip(bookingId: string, payload: AssignBookingDto) {
    const res = await fetch(`${API_BASE_URL}/bookings/admin/${bookingId}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async removeBookingFromTrip(bookingId: string) {
    const res = await fetch(`${API_BASE_URL}/bookings/admin/${bookingId}/unassign`, {
      method: 'POST',
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async updateBookingPaymentStatus(bookingId: string, payload: UpdateBookingPaymentStatusDto) {
    const res = await fetch(`${API_BASE_URL}/bookings/admin/${bookingId}/payment-status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  // Admin endpoints
  async createDriver(payload: CreateDriverDto) {
    const res = await fetch(`${API_BASE_URL}/admin/drivers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<CreateDriverResult>>(res)
  },

  async getAdminDrivers(params?: AdminDriverListQuery) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value))
        }
      })
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/admin/drivers${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<AdminDriver>>>(res)
  },

  async updateDriver(driverId: string, payload: UpdateDriverDto) {
    const res = await fetch(`${API_BASE_URL}/admin/drivers/${driverId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<AdminDriver>>(res)
  },

  async updateDriverStatus(driverId: string, payload: UpdateDriverStatusDto) {
    const res = await fetch(`${API_BASE_URL}/admin/drivers/${driverId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<DriverStatusUpdateResult>>(res)
  },

  async getDriverSummary() {
    const res = await fetch(`${API_BASE_URL}/admin/drivers/summary`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<DriverSummary>>(res)
  },

  async getAdminCustomers(params?: CustomerAdminListQuery) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value))
        }
      })
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/admin/customers${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<CustomerAdminItem>>>(res)
  },

  async getCustomerSummary() {
    const res = await fetch(`${API_BASE_URL}/admin/customers/summary`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<CustomerAdminSummary>>(res)
  },

  async updateCustomerStatus(userId: string, accountStatus: AccountStatus) {
    const res = await fetch(`${API_BASE_URL}/admin/customers/${userId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ accountStatus }),
    })
    return handleResponse<ApiResponse<{ id: string; name: string; phone: string; accountStatus: AccountStatus }>>(res)
  },

  // District endpoints
  async getAllDistricts() {
    const res = await fetch(`${API_BASE_URL}/districts`, {
      headers: getHeaders(false),
    })
    return handleResponse<ApiResponse<District[]>>(res)
  },

  async getDistrictsByCity(city: 'danang' | 'hue') {
    const res = await fetch(`${API_BASE_URL}/districts/city/${city}`, {
      headers: getHeaders(false),
    })
    return handleResponse<ApiResponse<string[]>>(res)
  },

  async getDistrictWards(districtCode: number) {
    const res = await fetch(`${API_BASE_URL}/districts/${districtCode}/wards`, {
      headers: getHeaders(false),
    })
    return handleResponse<ApiResponse<string[]>>(res)
  },

  // Dashboard endpoints
  async getDashboardMetrics() {
    const res = await fetch(`${API_BASE_URL}/dashboard/metrics`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<{ metrics: Array<{ id: string; title: string; value: number; tone: 'gold' | 'green' | 'amber' | 'blue'; format?: 'currency' }> }>>(res)
  },

  async getDashboardRevenue7Days() {
    const res = await fetch(`${API_BASE_URL}/dashboard/revenue/7days`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Array<{ dateLabel: string; amount: number }>>>(res)
  },

  async getDashboardWeeklyBookings() {
    const res = await fetch(`${API_BASE_URL}/dashboard/bookings/weekly`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Array<{ dayLabel: string; total: number }>>>(res)
  },

  async getDashboardRouteRatio() {
    const res = await fetch(`${API_BASE_URL}/dashboard/routes/ratio`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Array<{ route: string; total: number; color: string }>>>(res)
  },

  async getDashboardUpcomingTrips() {
    const res = await fetch(`${API_BASE_URL}/dashboard/trips/upcoming`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Array<{ id: number; route: string; time: string; driver: string; availableSeats: number }>>>(res)
  },

  // Student verification
  async getStudentVerifications(params: { page?: number; limit?: number; status?: string } = {}) {
    const query = new URLSearchParams()
    if (params.page) query.append('page', String(params.page))
    if (params.limit) query.append('limit', String(params.limit))
    if (params.status) query.append('status', params.status)
    const res = await fetch(`${API_BASE_URL}/admin/student-verifications?${query}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<StudentVerification>>>(res)
  },

  async getStudentVerificationCount() {
    const res = await fetch(`${API_BASE_URL}/admin/student-verifications/count`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<{ pending: number }>>(res)
  },

  async verifyStudentCard(verificationId: number, payload: VerifyStudentCardDto) {
    const res = await fetch(`${API_BASE_URL}/admin/student-verifications/${verificationId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<StudentVerification>>(res)
  },

  // Pricing endpoints (Admin/Manager)
  async getPricingConfigs(routeId?: number) {
    if (routeId === undefined) {
      return {
        success: true,
        data: [],
      } as ApiResponse<PriceConfig[]>
    }

    const query = new URLSearchParams()
    if (routeId !== undefined) query.append('routeId', String(routeId))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/admin/pricing${suffix}`, {
      headers: getHeaders(),
    })
    const response = await handleResponse<ApiResponse<{
      routeId: number
      routeName: string
      pricing: {
        SHARED: Array<Omit<PriceConfig, 'routeId' | 'pricingType'>>
        PRIVATE: Array<Omit<PriceConfig, 'routeId' | 'pricingType'>>
      }
      total: number
    }>>(res)

    const grouped = response.data?.pricing
    const flatConfigs: PriceConfig[] = [
      ...((grouped?.SHARED ?? []).map((config) => ({
        ...config,
        routeId: routeId,
        pricingType: 'SHARED' as const,
      }))),
      ...((grouped?.PRIVATE ?? []).map((config) => ({
        ...config,
        routeId: routeId,
        pricingType: 'PRIVATE' as const,
      }))),
    ]

    return {
      success: response.success,
      data: flatConfigs,
    }
  },

  async createPricingConfig(dto: CreatePriceConfigDto) {
    const res = await fetch(`${API_BASE_URL}/admin/pricing`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    })
    return handleResponse<ApiResponse<PriceConfig>>(res)
  },

  async updatePricingConfig(configId: number, dto: UpdatePriceConfigDto) {
    const res = await fetch(`${API_BASE_URL}/admin/pricing/${configId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    })
    return handleResponse<ApiResponse<PriceConfig>>(res)
  },

  async deletePricingConfig(configId: number) {
    const res = await fetch(`${API_BASE_URL}/admin/pricing/${configId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<{ message: string }>>(res)
  },

  async validatePricingRoute(routeId: number) {
    const res = await fetch(`${API_BASE_URL}/admin/pricing/validate/${routeId}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<{ routeId: number; isFullyConfigured: boolean }>>(res)
  },

  async getAdminRevenue(params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value))
        }
      })
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/admin/revenue${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<AdminRevenueListResponse>>(res)
  },

  async getTripRevenue(tripId: string) {
    const res = await fetch(`${API_BASE_URL}/admin/revenue/${tripId}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<AdminRevenueItem>>(res)
  },

  async exportAdminRevenueCsv(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value))
        }
      })
    }

    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/admin/revenue/export${suffix}`, {
      headers: getHeaders(),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${res.status}`)
    }

    return {
      blob: await res.blob(),
      filename: res.headers.get('Content-Disposition')?.match(/filename="?([^\"]+)"?/)?.[1] ?? 'hdn-revenue.csv',
    }
  },

  async getOperationalSettings() {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<OperationalSettings>>(res)
  },

  async updateOperationalSettings(payload: UpdateOperationalSettingsDto) {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<OperationalSettings>>(res)
  },

  async getAdminNotifications(params?: { page?: number; limit?: number; type?: 'new_booking' | 'student_card_uploaded' }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value))
        }
      })
    }
    const suffix = query.toString() ? `?${query.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/admin/notifications${suffix}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<AdminNotificationHistoryItem>>>(res)
  },
}
