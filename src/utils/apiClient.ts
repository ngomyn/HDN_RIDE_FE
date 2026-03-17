import type {
  ApiResponse,
  PaginatedResponse,
  AuthResponse,
  User,
  Trip,
  Booking,
  Vehicle,
  CreateTripDto,
  CreateBookingDto,
  UpdateProfileDto,
  District,
} from '@/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('hdn-auth-token') : null

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

const getHeaders = (includeAuth = true) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (includeAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  return headers
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
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
    const data = await handleResponse<ApiResponse<AuthResponse>>(res)
    if (data.data?.token) {
      setAuthToken(data.data.token)
    }
    return data
  },

  async login(phone: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ phone, password }),
    })
    const data = await handleResponse<ApiResponse<AuthResponse>>(res)
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

  // Trip endpoints
  async searchTrips(params: { fromPlace?: string; toPlace?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, String(value))
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

  async getTripDetail(id: number) {
    const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
      headers: getHeaders(false),
    })
    return handleResponse<ApiResponse<Trip>>(res)
  },

  async getAvailableSeats(tripId: number) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/available-seats`, {
      headers: getHeaders(false),
    })
    return handleResponse<ApiResponse<{ availableSeats: number[]; lockedSeats: number[] }>>(res)
  },

  async createTrip(payload: CreateTripDto) {
    const res = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<Trip>>(res)
  },

  async updateTrip(id: number, payload: { status?: string; totalSeats?: number }) {
    const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleResponse<ApiResponse<Trip>>(res)
  },

  async deleteTrip(id: number) {
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

  async getMyBookings(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, String(value))
      })
    }
    const res = await fetch(`${API_BASE_URL}/bookings/my?${query}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<PaginatedResponse<Booking>>>(res)
  },

  async getBookingHistory() {
    const res = await fetch(`${API_BASE_URL}/bookings/history`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Booking[]>>(res)
  },

  async getBookingDetail(id: number) {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async cancelBooking(id: number) {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async confirmBooking(id: number) {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async completeBooking(id: number) {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    })
    return handleResponse<ApiResponse<Booking>>(res)
  },

  async getTripBookings(tripId: number) {
    const res = await fetch(`${API_BASE_URL}/bookings/trip/${tripId}`, {
      headers: getHeaders(),
    })
    return handleResponse<ApiResponse<Booking[]>>(res)
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
}
