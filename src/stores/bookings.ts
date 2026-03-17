import { defineStore } from 'pinia'
import { bookingRecordsSeed } from '@/data/mockData'
import { apiClient } from '@/utils/apiClient'
import type { BookingStatusRecord } from '@/types/models'

export const useBookingStore = defineStore('bookings', {
  state: () => ({
    records: bookingRecordsSeed as BookingStatusRecord[],
    selectedBooking: null as BookingStatusRecord | null,
    filters: {
      route: '',
      startDate: '',
      endDate: '',
      status: '' as string,
    },
    searchText: '',
    loading: false,
    error: null as string | null,
  }),
  getters: {
    filtered(): BookingStatusRecord[] {
      return this.records.filter(booking => {
        let matches = true

        if (this.filters.route && booking.route !== this.filters.route) matches = false
        if (this.filters.status && booking.status !== this.filters.status) matches = false

        if (this.filters.startDate) {
          const start = new Date(this.filters.startDate)
          const bookingDate = new Date(booking.date)
          if (bookingDate < start) matches = false
        }

        if (this.filters.endDate) {
          const end = new Date(this.filters.endDate)
          const bookingDate = new Date(booking.date)
          end.setHours(23, 59, 59, 999)
          if (bookingDate > end) matches = false
        }

        if (this.searchText) {
          const searchLower = this.searchText.toLowerCase()
          matches = matches && (
            booking.customerName.toLowerCase().includes(searchLower) ||
            booking.phone.includes(this.searchText)
          )
        }

        return matches
      })
    },
  },
  actions: {
    async fetchBookings() {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.getMyBookings()
        if (response.data) {
          this.records = response.data as any
        }
      } catch (err: any) {
        this.error = err.message || 'Tải danh sách đặt chỗ thất bại'
      } finally {
        this.loading = false
      }
    },
    async confirmBooking(id: number) {
      try {
        this.loading = true
        this.error = null
        await apiClient.confirmBooking(id)
        const booking = this.records.find(b => b.id === id)
        if (booking) {
          booking.status = 'CONFIRMED'
        }
        this.selectedBooking = null
      } catch (err: any) {
        this.error = err.message || 'Xác nhận đặt chỗ thất bại'
      } finally {
        this.loading = false
      }
    },
    async cancelBooking(id: number) {
      try {
        this.loading = true
        this.error = null
        await apiClient.cancelBooking(id)
        const booking = this.records.find(b => b.id === id)
        if (booking) {
          booking.status = 'CANCELED'
        }
        this.selectedBooking = null
      } catch (err: any) {
        this.error = err.message || 'Hủy đặt chỗ thất bại'
      } finally {
        this.loading = false
      }
    },
  },
})
