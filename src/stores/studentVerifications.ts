import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '@/utils/apiClient'
import type { StudentVerification } from '@/types/api'

export const useStudentVerificationStore = defineStore('studentVerifications', () => {
  const records = ref<StudentVerification[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const filterStatus = ref<string>('PENDING')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pendingCount = ref(0)

  async function fetchVerifications(page = 1) {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.getStudentVerifications({
        page,
        limit: pageSize.value,
        status: filterStatus.value || undefined,
      })
      records.value = res.data.items
      total.value = res.data.total
      currentPage.value = page
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Lỗi tải danh sách'
    } finally {
      loading.value = false
    }
  }

  async function fetchPendingCount() {
    try {
      const res = await apiClient.getStudentVerificationCount()
      pendingCount.value = res.data.pending
    } catch {
      // silently fail
    }
  }

  async function approveStudent(userId: number) {
    await apiClient.verifyStudentCard(userId, { action: 'APPROVE' })
    await fetchVerifications(currentPage.value)
    await fetchPendingCount()
  }

  async function rejectStudent(userId: number) {
    await apiClient.verifyStudentCard(userId, { action: 'REJECT' })
    await fetchVerifications(currentPage.value)
    await fetchPendingCount()
  }

  return {
    records,
    total,
    currentPage,
    pageSize,
    filterStatus,
    loading,
    error,
    pendingCount,
    fetchVerifications,
    fetchPendingCount,
    approveStudent,
    rejectStudent,
  }
})
