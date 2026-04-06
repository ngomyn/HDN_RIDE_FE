import { defineStore } from 'pinia'
import { apiClient } from '@/utils/apiClient'
import type {
  AccountStatus,
  AdminStaffItem,
  AdminStaffListQuery,
  AdminStaffSummary,
  CreateAdminStaffDto,
  PaginatedResponse,
  UpdateAdminStaffDto,
} from '@/types/api'

type StaffPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type StaffFilters = Required<Pick<AdminStaffListQuery, 'name' | 'phone' | 'joinedFrom' | 'joinedTo'>> & {
  accountStatus: '' | AccountStatus
}

const createFilters = (): StaffFilters => ({
  accountStatus: '',
  name: '',
  phone: '',
  joinedFrom: '',
  joinedTo: '',
})

const createPagination = (): StaffPagination => ({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const applyPagination = (target: StaffPagination, data: PaginatedResponse<unknown>) => {
  target.page = data.page
  target.limit = data.limit
  target.total = data.total
  target.totalPages = data.totalPages
}

const patchStaffInList = (list: AdminStaffItem[], updatedStaff: AdminStaffItem) => {
  const index = list.findIndex((staff) => staff.id === updatedStaff.id)
  if (index >= 0) {
    list.splice(index, 1, updatedStaff)
  }
}

export const useStaffStore = defineStore('staff', {
  state: () => ({
    records: [] as AdminStaffItem[],
    selectedStaff: null as AdminStaffItem | null,
    filters: createFilters(),
    pagination: createPagination(),
    summary: null as AdminStaffSummary | null,
    loading: false,
    error: null as string | null,
  }),
  getters: {
    activeCount(): number {
      return this.summary?.active ?? this.records.filter((staff) => staff.accountStatus === 'ACTIVE').length
    },
    inactiveCount(): number {
      return this.summary?.inactive ?? this.records.filter((staff) => staff.accountStatus === 'INACTIVE').length
    },
  },
  actions: {
    async fetchStaff(page = 1, limit = 10) {
      try {
        this.loading = true
        this.error = null

        const response = await apiClient.getAdminStaff({
          accountStatus: this.filters.accountStatus || undefined,
          name: this.filters.name || undefined,
          phone: this.filters.phone || undefined,
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
        this.error = err.message || 'Tải danh sách nhân viên thất bại'
      } finally {
        this.loading = false
      }
    },

    async fetchStaffSummary() {
      try {
        const response = await apiClient.getAdminStaffSummary()
        if (response.data) {
          this.summary = response.data
        }
      } catch {
        // summary failure is non-critical
      }
    },

    async createStaff(payload: CreateAdminStaffDto) {
      try {
        this.loading = true
        this.error = null

        await apiClient.createAdminStaff(payload)
        await this.fetchStaff(this.pagination.page, this.pagination.limit)
      } catch (err: any) {
        this.error = err.message || 'Tạo nhân viên thất bại'
      } finally {
        this.loading = false
      }
    },

    async updateStaff(userId: string, payload: UpdateAdminStaffDto) {
      try {
        this.loading = true
        this.error = null

        const response = await apiClient.updateAdminStaff(userId, payload)
        if (response.data) {
          patchStaffInList(this.records, response.data)

          if (this.selectedStaff?.id === userId) {
            this.selectedStaff = response.data
          }
        }
      } catch (err: any) {
        this.error = err.message || 'Cập nhật nhân viên thất bại'
      } finally {
        this.loading = false
      }
    },

    async updateStaffStatus(userId: string, accountStatus: AccountStatus) {
      try {
        this.loading = true
        this.error = null

        await apiClient.updateAdminStaffStatus(userId, { accountStatus })

        const target = this.records.find((staff) => staff.id === userId)
        if (target) {
          target.accountStatus = accountStatus
        }

        if (this.selectedStaff?.id === userId) {
          this.selectedStaff = {
            ...this.selectedStaff,
            accountStatus,
          }
        }
      } catch (err: any) {
        this.error = err.message || 'Cập nhật trạng thái nhân viên thất bại'
      } finally {
        this.loading = false
      }
    },

    setFilters(filters: Partial<StaffFilters>) {
      this.filters = {
        ...this.filters,
        ...filters,
      }
    },

    resetFilters() {
      this.filters = createFilters()
    },

    selectStaff(staff: AdminStaffItem | null) {
      this.selectedStaff = staff
    },
  },
})