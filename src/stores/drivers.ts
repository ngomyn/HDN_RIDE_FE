import { defineStore } from 'pinia'
import { apiClient } from '@/utils/apiClient'
import type {
  AccountStatus,
  AdminDriver,
  AdminDriverListQuery,
  CreateDriverDto,
  DriverSummary,
  PaginatedResponse,
  UpdateDriverDto,
} from '@/types/api'

type DriverPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type DriverFilters = Required<Pick<AdminDriverListQuery, 'name' | 'phone' | 'plate' | 'completedTripsFrom' | 'completedTripsTo' | 'joinedFrom' | 'joinedTo'>> & {
  accountStatus: '' | AccountStatus
}

const createFilters = (): DriverFilters => ({
  accountStatus: '',
  name: '',
  phone: '',
  plate: '',
  completedTripsFrom: '',
  completedTripsTo: '',
  joinedFrom: '',
  joinedTo: '',
})

const createPagination = (): DriverPagination => ({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const applyPagination = (target: DriverPagination, data: PaginatedResponse<unknown>) => {
  target.page = data.page
  target.limit = data.limit
  target.total = data.total
  target.totalPages = data.totalPages
}

const patchDriverInList = (list: AdminDriver[], updatedDriver: AdminDriver) => {
  const index = list.findIndex((driver) => driver.id === updatedDriver.id)
  if (index >= 0) {
    list.splice(index, 1, updatedDriver)
  }
}

export const useDriverStore = defineStore('drivers', {
  state: () => ({
    records: [] as AdminDriver[],
    selectedDriver: null as AdminDriver | null,
    filters: createFilters(),
    pagination: createPagination(),
    summary: null as DriverSummary | null,
    loading: false,
    error: null as string | null,
  }),
  getters: {
    activeCount(): number {
      return this.summary?.active ?? this.records.filter((d) => d.accountStatus === 'ACTIVE').length
    },
  },
  actions: {
    async fetchDrivers(page = 1, limit = 10) {
      try {
        this.loading = true
        this.error = null

        const response = await apiClient.getAdminDrivers({
          accountStatus: this.filters.accountStatus || undefined,
          name: this.filters.name || undefined,
          phone: this.filters.phone || undefined,
          plate: this.filters.plate || undefined,
          completedTripsFrom: this.filters.completedTripsFrom || undefined,
          completedTripsTo: this.filters.completedTripsTo || undefined,
          joinedFrom: this.filters.joinedFrom || undefined,
          joinedTo: this.filters.joinedTo || undefined,
          page,
          limit,
        })

        if (response.data) {
          this.records = response.data.items ?? []
          applyPagination(this.pagination, response.data)
        }
      } catch (err: any) {
        this.error = err.message || 'Tai danh sach tai xe that bai'
      } finally {
        this.loading = false
      }
    },

    async fetchDriverSummary() {
      try {
        const response = await apiClient.getDriverSummary()
        if (response.data) {
          this.summary = response.data
        }
      } catch {
        // summary failure is non-critical
      }
    },

    async createDriver(payload: CreateDriverDto) {
      try {
        this.loading = true
        this.error = null

        await apiClient.createDriver(payload)
        await this.fetchDrivers(this.pagination.page, this.pagination.limit)
      } catch (err: any) {
        this.error = err.message || 'Tao tai xe that bai'
      } finally {
        this.loading = false
      }
    },

    async updateDriver(driverId: string, payload: UpdateDriverDto) {
      try {
        this.loading = true
        this.error = null

        const response = await apiClient.updateDriver(driverId, payload)
        if (response.data) {
          patchDriverInList(this.records, response.data)

          if (this.selectedDriver?.id === driverId) {
            this.selectedDriver = response.data
          }
        }
      } catch (err: any) {
        this.error = err.message || 'Cap nhat tai xe that bai'
      } finally {
        this.loading = false
      }
    },

    async updateDriverStatus(driverId: string, accountStatus: AccountStatus) {
      try {
        this.loading = true
        this.error = null

        await apiClient.updateDriverStatus(driverId, { accountStatus })

        const target = this.records.find((driver) => driver.id === driverId)
        if (target) {
          target.accountStatus = accountStatus
        }

        if (this.selectedDriver?.id === driverId) {
          this.selectedDriver = {
            ...this.selectedDriver,
            accountStatus,
          }
        }
      } catch (err: any) {
        this.error = err.message || 'Cap nhat trang thai tai xe that bai'
      } finally {
        this.loading = false
      }
    },

    setStatusFilter(status: '' | AccountStatus) {
      this.filters.accountStatus = status
    },

    setFilters(filters: Partial<DriverFilters>) {
      this.filters = {
        ...this.filters,
        ...filters,
      }
    },

    resetFilters() {
      this.filters = createFilters()
    },

    selectDriver(driver: AdminDriver | null) {
      this.selectedDriver = driver
    },
  },
})
