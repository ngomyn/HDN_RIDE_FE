import { defineStore } from 'pinia'
import { apiClient } from '@/utils/apiClient'
import type { Booking, BookingStatus, PaginatedResponse, AdminBookingSummary } from '@/types/api'

type BookingQuery = {
  status?: BookingStatus
  page?: number
  limit?: number
}

type PaginationState = {
  page: number
  limit: number
  total: number
  totalPages: number
}

const createPagination = (): PaginationState => ({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const applyPagination = (target: PaginationState, data: PaginatedResponse<unknown>) => {
  target.page = data.page
  target.limit = data.limit
  target.total = data.total
  target.totalPages = data.totalPages
}

const patchBookingInList = (list: Booking[], updatedBooking: Booking) => {
  const index = list.findIndex((item) => item.id === updatedBooking.id)
  if (index >= 0) {
    list.splice(index, 1, updatedBooking)
  }
}

export const useBookingStore = defineStore('bookings', {
  state: () => ({
    myBookings: [] as Booking[],
    bookingHistory: [] as Booking[],
    pendingBookings: [] as Booking[],
    adminBookings: [] as Booking[],
    selectedBooking: null as Booking | null,

    myPagination: createPagination(),
    historyPagination: createPagination(),
    pendingPagination: createPagination(),
    adminPagination: createPagination(),

    summary: {
      totalToday: 0,
      confirmedToday: 0,
      pendingToday: 0,
    } as AdminBookingSummary,

    adminFilters: {
      date: '',
      route: 'all' as 'all' | 'dn-hue' | 'hue-dn',
      customer: '',
      status: '' as '' | BookingStatus,
    },

    filters: {
      status: '' as '' | BookingStatus,
      bookingType: '' as '' | 'SHARED' | 'PRIVATE',
    },
    searchText: '',
    loading: false,
    error: null as string | null,
  }),
  getters: {
    filteredPending(): Booking[] {
      return this.pendingBookings.filter((booking) => {
        if (this.filters.status && booking.status !== this.filters.status) return false
        if (this.filters.bookingType && booking.bookingType !== this.filters.bookingType) return false

        if (!this.searchText) return true

        const keyword = this.searchText.toLowerCase().trim()
        if (!keyword) return true

        return (
          booking.passengerName.toLowerCase().includes(keyword) ||
          booking.passengerPhone.includes(keyword) ||
          booking.dropoffPhone.includes(keyword)
        )
      })
    },

    pendingCount(): number {
      return this.pendingBookings.length
    },

    assignedCount(): number {
      return this.bookingHistory.filter((booking) => booking.status === 'ASSIGNED').length
    },

    completedCount(): number {
      return this.bookingHistory.filter((booking) => booking.status === 'COMPLETED').length
    },

    cancelledCount(): number {
      return this.bookingHistory.filter((booking) => booking.status === 'CANCELLED').length
    },
  },
  actions: {
    async fetchMyBookings(params: BookingQuery = {}) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.getMyBookings(params)
        if (response.data) {
          this.myBookings = response.data.items ?? []
          applyPagination(this.myPagination, response.data)
        }
      } catch (err: any) {
        this.error = err.message || 'Tai danh sach dat cho that bai'
      } finally {
        this.loading = false
      }
    },

    async fetchBookingHistory(params: BookingQuery = {}) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.getBookingHistory(params)
        if (response.data) {
          this.bookingHistory = response.data.items ?? []
          applyPagination(this.historyPagination, response.data)
        }
      } catch (err: any) {
        this.error = err.message || 'Tai lich su dat cho that bai'
      } finally {
        this.loading = false
      }
    },

    async fetchPendingBookings(page = 1, limit = 10) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.getAdminPendingBookings({ page, limit })
        if (response.data) {
          this.pendingBookings = response.data.items ?? []
          applyPagination(this.pendingPagination, response.data)
        }
      } catch (err: any) {
        this.error = err.message || 'Tai danh sach cho gan chuyen that bai'
      } finally {
        this.loading = false
      }
    },

    async fetchAdminBookings(page = 1, limit = 10) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.getAdminBookings({
          page,
          limit,
          date: this.adminFilters.date || undefined,
          route: this.adminFilters.route,
          customer: this.adminFilters.customer || undefined,
          status: this.adminFilters.status || undefined,
        })
        if (response.data) {
          this.adminBookings = response.data.items ?? []
          applyPagination(this.adminPagination, response.data)
        }
      } catch (err: any) {
        this.error = err.message || 'Tai danh sach booking quan tri that bai'
      } finally {
        this.loading = false
      }
    },

    async fetchAdminBookingSummary(date?: string) {
      try {
        this.error = null
        const response = await apiClient.getAdminBookingSummary(date || undefined)
        if (response.data) {
          this.summary = response.data
        }
      } catch (err: any) {
        this.error = err.message || 'Tai thong ke booking that bai'
      }
    },

    async assignBooking(bookingId: number, tripId: number) {
      try {
        this.loading = true
        this.error = null

        const response = await apiClient.assignBookingToTrip(bookingId, { tripId })
        const updatedBooking = response.data

        patchBookingInList(this.pendingBookings, updatedBooking)
        patchBookingInList(this.bookingHistory, updatedBooking)
        patchBookingInList(this.myBookings, updatedBooking)

        if (updatedBooking.status !== 'PENDING') {
          this.pendingBookings = this.pendingBookings.filter((item) => item.id !== bookingId)
          this.pendingPagination.total = Math.max(0, this.pendingPagination.total - 1)
          this.pendingPagination.totalPages = Math.max(1, Math.ceil(this.pendingPagination.total / this.pendingPagination.limit))
        }

        if (this.selectedBooking?.id === bookingId) {
          this.selectedBooking = updatedBooking
        }
      } catch (err: any) {
        this.error = err.message || 'Gan booking vao chuyen that bai'
      } finally {
        this.loading = false
      }
    },

    async confirmBooking(id: number) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.confirmBooking(id)
        const updatedBooking = response.data

        patchBookingInList(this.pendingBookings, updatedBooking)
        patchBookingInList(this.bookingHistory, updatedBooking)
        patchBookingInList(this.myBookings, updatedBooking)

        if (this.selectedBooking?.id === id) {
          this.selectedBooking = updatedBooking
        }
      } catch (err: any) {
        this.error = err.message || 'Xac nhan dat cho that bai'
      } finally {
        this.loading = false
      }
    },
    async cancelBooking(id: number) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.cancelBooking(id)
        const updatedBooking = response.data

        patchBookingInList(this.pendingBookings, updatedBooking)
        patchBookingInList(this.bookingHistory, updatedBooking)
        patchBookingInList(this.myBookings, updatedBooking)

        if (updatedBooking.status === 'CANCELLED') {
          this.pendingBookings = this.pendingBookings.filter((item) => item.id !== id)
        }

        if (this.selectedBooking?.id === id) {
          this.selectedBooking = updatedBooking
        }
      } catch (err: any) {
        this.error = err.message || 'Huy dat cho that bai'
      } finally {
        this.loading = false
      }
    },

    async completeBooking(id: number) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.completeBooking(id)
        const updatedBooking = response.data

        patchBookingInList(this.pendingBookings, updatedBooking)
        patchBookingInList(this.bookingHistory, updatedBooking)
        patchBookingInList(this.myBookings, updatedBooking)

        if (this.selectedBooking?.id === id) {
          this.selectedBooking = updatedBooking
        }
      } catch (err: any) {
        this.error = err.message || 'Cap nhat hoan thanh that bai'
      } finally {
        this.loading = false
      }
    },

    selectBooking(booking: Booking | null) {
      this.selectedBooking = booking
    },

    clearFilters() {
      this.filters.status = ''
      this.filters.bookingType = ''
      this.searchText = ''
    },

    resetAdminFilters() {
      this.adminFilters.date = ''
      this.adminFilters.route = 'all'
      this.adminFilters.customer = ''
      this.adminFilters.status = ''
    },
  },
})
