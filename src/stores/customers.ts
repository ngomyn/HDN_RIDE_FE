import { defineStore } from 'pinia'
import { apiClient } from '@/utils/apiClient'
import type {
  AccountStatus,
  CustomerAdminItem,
  CustomerAdminSummary,
  CustomerAdminListQuery,
  PaginatedResponse,
  StudentVerification,
  StudentStatus,
  VerifyStudentCardDto,
} from '@/types/api'

type Pagination = { page: number; limit: number; total: number; totalPages: number }
type CustomerFilters = {
  name: string
  phone: string
  accountStatus: '' | AccountStatus
  studentStatus: '' | StudentStatus
  totalBookingsFrom: string
  totalBookingsTo: string
  loyaltyPointsFrom: string
  loyaltyPointsTo: string
  successfulReferralsFrom: string
  successfulReferralsTo: string
  joinedFrom: string
  joinedTo: string
}
type VerificationIntent = {
  userId: string
  verificationId?: number | null
}

const createPagination = (): Pagination => ({ page: 1, limit: 10, total: 0, totalPages: 1 })
const createCustomerFilters = (): CustomerFilters => ({
  name: '',
  phone: '',
  accountStatus: '',
  studentStatus: '',
  totalBookingsFrom: '',
  totalBookingsTo: '',
  loyaltyPointsFrom: '',
  loyaltyPointsTo: '',
  successfulReferralsFrom: '',
  successfulReferralsTo: '',
  joinedFrom: '',
  joinedTo: '',
})
const applyPagination = (target: Pagination, data: PaginatedResponse<unknown>) => {
  target.page = data.page
  target.limit = data.limit
  target.total = data.total
  target.totalPages = data.totalPages
}

const buildCustomerQuery = (filters: CustomerFilters, page: number, limit: number): CustomerAdminListQuery => {
  const params: CustomerAdminListQuery = { page, limit }

  if (filters.name) params.name = filters.name
  if (filters.phone) params.phone = filters.phone
  if (filters.accountStatus) params.accountStatus = filters.accountStatus
  if (filters.studentStatus) params.studentStatus = filters.studentStatus
  if (filters.totalBookingsFrom) params.totalBookingsFrom = filters.totalBookingsFrom
  if (filters.totalBookingsTo) params.totalBookingsTo = filters.totalBookingsTo
  if (filters.loyaltyPointsFrom) params.loyaltyPointsFrom = filters.loyaltyPointsFrom
  if (filters.loyaltyPointsTo) params.loyaltyPointsTo = filters.loyaltyPointsTo
  if (filters.successfulReferralsFrom) params.successfulReferralsFrom = filters.successfulReferralsFrom
  if (filters.successfulReferralsTo) params.successfulReferralsTo = filters.successfulReferralsTo
  if (filters.joinedFrom) params.joinedFrom = filters.joinedFrom
  if (filters.joinedTo) params.joinedTo = filters.joinedTo

  return params
}

const mergeCustomerWithVerification = (
  customer: CustomerAdminItem,
  verificationMap: Record<string, StudentVerification>,
): CustomerAdminItem => {
  const verification = verificationMap[customer.id]

  return {
    ...customer,
    studentStatus: verification?.status ?? customer.studentStatus ?? (customer.isStudent ? 'APPROVED' : 'NONE'),
  }
}

export const useCustomerStore = defineStore('customers', {
  state: () => ({
    records: [] as CustomerAdminItem[],
    selectedCustomer: null as CustomerAdminItem | null,
    selectedVerification: null as StudentVerification | null,
    verificationMap: {} as Record<string, StudentVerification>,
    pendingVerificationTarget: null as VerificationIntent | null,
    filters: createCustomerFilters(),
    pagination: createPagination(),
    summary: null as CustomerAdminSummary | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async hydrateVerifications() {
      try {
        const statuses: StudentStatus[] = ['PENDING', 'APPROVED', 'REJECTED']
        const responses = await Promise.all(
          statuses.map((status) => apiClient.getStudentVerifications({ page: 1, limit: 200, status })),
        )

        const latestByUser: Record<string, StudentVerification> = {}
        for (const response of responses) {
          for (const verification of response.data.items ?? []) {
            const current = latestByUser[verification.userId]
            if (!current || new Date(verification.submittedAt).getTime() > new Date(current.submittedAt).getTime()) {
              latestByUser[verification.userId] = verification
            }
          }
        }

        this.verificationMap = latestByUser
      } catch {
        this.verificationMap = {}
      }
    },

    async fetchCustomers(page = 1, limit = 10) {
      try {
        this.loading = true
        this.error = null

        const params = buildCustomerQuery(this.filters, page, limit)

        const [response] = await Promise.all([apiClient.getAdminCustomers(params), this.hydrateVerifications()])
        if (response.data) {
          this.records = (response.data.items ?? []).map((item) => mergeCustomerWithVerification(item, this.verificationMap))

          applyPagination(this.pagination, response.data)

          if (this.selectedCustomer) {
            const nextSelected = this.records.find((item) => item.id === this.selectedCustomer?.id)
            if (nextSelected) {
              this.selectCustomer(nextSelected)
            }
          }
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

    async updateStatus(userId: string, accountStatus: AccountStatus) {
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

    async verifyStudent(userId: string, payload: VerifyStudentCardDto) {
      try {
        this.loading = true
        this.error = null

        const verification = this.verificationMap[userId]
        if (!verification) {
          throw new Error('Khách hàng này chưa có hồ sơ xác minh để xét duyệt')
        }

        const response = await apiClient.verifyStudentCard(verification.id, payload)
        if (response.data) {
          const target = this.records.find((c) => c.id === userId)
          const nextStudentStatus = response.data.status
          const nextIsStudent = nextStudentStatus === 'APPROVED'

          this.verificationMap[userId] = response.data
          this.selectedVerification = response.data

          if (target) {
            target.studentStatus = nextStudentStatus
            target.isStudent = nextIsStudent
          }
          if (this.selectedCustomer?.id === userId) {
            this.selectedCustomer = {
              ...this.selectedCustomer,
              studentStatus: nextStudentStatus,
              isStudent: nextIsStudent,
            }
          }
        }
        await this.fetchSummary()
        this.clearVerificationIntent()
      } catch (err: any) {
        this.error = err.message || 'Xác minh sinh viên thất bại'
      } finally {
        this.loading = false
      }
    },

    async findCustomerById(userId: string) {
      const response = await apiClient.getAdminCustomers({ userId, page: 1, limit: 1 })
      const item = response.data?.items?.[0]
      return item ? mergeCustomerWithVerification(item, this.verificationMap) : null
    },

    queueVerificationIntent(userId: string, verificationId?: number | null) {
      this.pendingVerificationTarget = { userId, verificationId: verificationId ?? null }
    },

    clearVerificationIntent() {
      this.pendingVerificationTarget = null
    },

    async resolveQueuedVerificationCustomer() {
      if (!this.pendingVerificationTarget) return null

      try {
        this.loading = true
        this.error = null

        await this.hydrateVerifications()

        const existing = this.records.find((item) => item.id === this.pendingVerificationTarget?.userId)
        const customer = existing ?? await this.findCustomerById(this.pendingVerificationTarget.userId)

        if (!customer) {
          throw new Error('Không tìm thấy khách hàng cho thông báo xác minh sinh viên')
        }

        this.selectCustomer(customer)
        return customer
      } catch (err: any) {
        this.error = err.message || 'Không thể mở hồ sơ xác minh sinh viên'
        return null
      } finally {
        this.loading = false
      }
    },

    resetFilters() {
      this.filters = createCustomerFilters()
    },

    selectCustomer(customer: CustomerAdminItem | null) {
      this.selectedCustomer = customer
      this.selectedVerification = customer ? this.verificationMap[customer.id] ?? null : null
    },
  },
})
