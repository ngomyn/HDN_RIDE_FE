import { defineStore } from 'pinia'
import { apiClient } from '@/utils/apiClient'
import type {
  AccountStatus,
  CustomerAdminItem,
  CustomerAdminSummary,
  CustomerAdminListQuery,
  PaginatedResponse,
  StudentStatus,
  VerifyStudentCardDto,
} from '@/types/api'

type Pagination = { page: number; limit: number; total: number; totalPages: number }
const createPagination = (): Pagination => ({ page: 1, limit: 10, total: 0, totalPages: 1 })
const applyPagination = (target: Pagination, data: PaginatedResponse<unknown>) => {
  target.page = data.page
  target.limit = data.limit
  target.total = data.total
  target.totalPages = data.totalPages
}

export const useCustomerStore = defineStore('customers', {
  state: () => ({
    records: [] as CustomerAdminItem[],
    selectedCustomer: null as CustomerAdminItem | null,
    filters: {
      name: '' as string,
      phone: '' as string,
      accountStatus: '' as '' | AccountStatus,
      studentStatus: '' as '' | StudentStatus,
    },
    pagination: createPagination(),
    summary: null as CustomerAdminSummary | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchCustomers(page = 1, limit = 10) {
      try {
        this.loading = true
        this.error = null

        const params: CustomerAdminListQuery = { page, limit }
        if (this.filters.name) params.name = this.filters.name
        if (this.filters.phone) params.phone = this.filters.phone
        if (this.filters.accountStatus) params.accountStatus = this.filters.accountStatus
        if (this.filters.studentStatus) params.studentStatus = this.filters.studentStatus

        const response = await apiClient.getAdminCustomers(params)
        if (response.data) {
          this.records = response.data.items ?? []
          applyPagination(this.pagination, response.data)
        }
      } catch (err: any) {
        this.error = err.message || 'Tải danh sách khách hàng thất bại'
      } finally {
        this.loading = false
      }
    },

    async fetchSummary() {
      try {
        const response = await apiClient.getCustomerSummary()
        if (response.data) {
          this.summary = response.data
        }
      } catch {
        // non-critical
      }
    },

    async updateStatus(userId: number, accountStatus: AccountStatus) {
      try {
        this.loading = true
        this.error = null
        await apiClient.updateCustomerStatus(userId, accountStatus)
        const target = this.records.find((c) => c.id === userId)
        if (target) target.accountStatus = accountStatus
        if (this.selectedCustomer?.id === userId) {
          this.selectedCustomer = { ...this.selectedCustomer, accountStatus }
        }
        await this.fetchSummary()
      } catch (err: any) {
        this.error = err.message || 'Cập nhật trạng thái thất bại'
      } finally {
        this.loading = false
      }
    },

    async verifyStudent(userId: number, payload: VerifyStudentCardDto) {
      try {
        this.loading = true
        this.error = null
        const response = await apiClient.verifyStudentCard(userId, payload)
        if (response.data) {
          const target = this.records.find((c) => c.id === userId)
          if (target) {
            target.studentStatus = response.data.studentStatus as StudentStatus
            target.isStudent = response.data.isStudent
          }
          if (this.selectedCustomer?.id === userId) {
            this.selectedCustomer = {
              ...this.selectedCustomer,
              studentStatus: response.data.studentStatus as StudentStatus,
              isStudent: response.data.isStudent,
            }
          }
        }
        await this.fetchSummary()
      } catch (err: any) {
        this.error = err.message || 'Xác minh sinh viên thất bại'
      } finally {
        this.loading = false
      }
    },

    resetFilters() {
      this.filters.name = ''
      this.filters.phone = ''
      this.filters.accountStatus = ''
      this.filters.studentStatus = ''
    },

    selectCustomer(customer: CustomerAdminItem | null) {
      this.selectedCustomer = customer
    },
  },
})
