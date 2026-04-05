<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useStudentVerificationStore } from '@/stores/studentVerifications'
import type { StudentVerification } from '@/types/api'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import Table from '@/components/ui/Table.vue'
import Pagination from '@/components/ui/Pagination.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import Modal from '@/components/ui/Modal.vue'

const store = useStudentVerificationStore()
const pageSize = 10
const showImageModal = ref(false)
const selectedUser = ref<StudentVerification | null>(null)
const actionLoading = ref(false)
const actionError = ref<string | null>(null)
const rejectReason = ref('')

const statusOptions = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ duyệt (PENDING)', value: 'PENDING' },
  { label: 'Đã duyệt (APPROVED)', value: 'APPROVED' },
  { label: 'Đã từ chối (REJECTED)', value: 'REJECTED' },
]

const columns = [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'user.name', label: 'Họ tên' },
  { key: 'user.phone', label: 'SĐT' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'submittedAt', label: 'Ngày nộp' },
]

onMounted(() => {
  store.filterStatus = 'PENDING'
  store.fetchVerifications(1)
  store.fetchPendingCount()
})

watch(() => store.filterStatus, () => {
  store.fetchVerifications(1)
})

const handlePageChange = (page: number) => {
  store.fetchVerifications(page)
}

const openImageModal = (user: StudentVerification) => {
  selectedUser.value = user
  actionError.value = null
  rejectReason.value = ''
  showImageModal.value = true
}

const handleApprove = async () => {
  if (!selectedUser.value) return
  actionLoading.value = true
  actionError.value = null
  try {
    await store.approveStudent(selectedUser.value.id)
    showImageModal.value = false
  } catch (e: unknown) {
    actionError.value = e instanceof Error ? e.message : 'Có lỗi xảy ra'
  } finally {
    actionLoading.value = false
  }
}

const handleReject = async () => {
  if (!selectedUser.value) return
  actionLoading.value = true
  actionError.value = null
  try {
    await store.rejectStudent(selectedUser.value.id, rejectReason.value || undefined)
    showImageModal.value = false
  } catch (e: unknown) {
    actionError.value = e instanceof Error ? e.message : 'Có lỗi xảy ra'
  } finally {
    actionLoading.value = false
  }
}

const formatDate = (iso: string) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Xác Minh Sinh Viên</h1>
        <p class="text-sm text-gray-500 mt-1">
          Kiểm tra thẻ sinh viên và xác nhận giảm giá 10%
        </p>
      </div>
      <div
        v-if="store.pendingCount > 0"
        class="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
        <span class="text-sm font-medium text-red-700">
          {{ store.pendingCount }} yêu cầu chờ duyệt
        </span>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-4">
      <Card class="p-4 text-center">
        <p class="text-3xl font-bold text-yellow-500">{{ store.pendingCount }}</p>
        <p class="text-sm text-gray-500 mt-1">Chờ Duyệt</p>
      </Card>
    </div>

    <!-- Filter + Table -->
    <Card>
      <div class="p-4 border-b border-gray-100 flex items-center gap-4">
        <div class="w-64">
          <SelectInput
            v-model="store.filterStatus"
            label="Lọc theo trạng thái"
            :options="statusOptions"
          />
        </div>
      </div>

      <div v-if="store.loading" class="py-16 text-center text-gray-400">
        Đang tải...
      </div>
      <div v-else-if="store.error" class="py-16 text-center text-red-500">
        {{ store.error }}
      </div>
      <template v-else>
        <Table
          :columns="columns"
          :data="store.records"
          @row-click="openImageModal"
        >
          <template #cell-status="{ value }">
            <StatusBadge :status="value" />
          </template>
          <template #cell-submittedAt="{ value }">
            {{ formatDate(value) }}
          </template>
        </Table>

        <div v-if="store.records.length === 0" class="py-12 text-center text-gray-400">
          Không có dữ liệu
        </div>

        <div class="p-4 border-t border-gray-100">
          <Pagination
            :current="store.currentPage"
            :total="store.total"
            :page-size="pageSize"
            @update:current="handlePageChange"
          />
        </div>
      </template>
    </Card>

    <!-- Image Modal -->
    <Modal v-model="showImageModal" title="Thẻ Sinh Viên" size="lg">
      <div v-if="selectedUser" class="space-y-4">
        <!-- User info -->
        <div class="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-brand-gold text-brand-brown font-bold flex items-center justify-center text-xl">
            {{ selectedUser.user?.name?.charAt(0) ?? '?' }}
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ selectedUser.user?.name }}</p>
            <p class="text-sm text-gray-500">{{ selectedUser.user?.phone }}</p>
            <StatusBadge :status="selectedUser.status" class="mt-1" />
          </div>
        </div>

        <!-- Student card image -->
        <div class="border rounded-lg overflow-hidden">
          <img
            v-if="selectedUser.image"
            :src="selectedUser.image"
            alt="Thẻ sinh viên"
            class="w-full object-contain max-h-96"
          />
          <div v-else class="py-12 text-center text-gray-400">
            Không có ảnh thẻ sinh viên
          </div>
        </div>

        <!-- Reject reason -->
        <div v-if="selectedUser.rejectReason" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-sm font-medium text-red-700">Lý do từ chối:</p>
          <p class="text-sm text-red-600 mt-1">{{ selectedUser.rejectReason }}</p>
        </div>

        <!-- Error -->
        <p v-if="actionError" class="text-sm text-red-600">{{ actionError }}</p>

        <!-- Actions -->
        <div
          v-if="selectedUser.status === 'PENDING'"
          class="space-y-3"
        >
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Lý do từ chối (tùy chọn)</label>
            <input
              v-model="rejectReason"
              type="text"
              placeholder="Nhập lý do nếu từ chối..."
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
          <div class="flex gap-3 justify-end">
            <Button
              variant="secondary"
              :disabled="actionLoading"
              @click="handleReject"
            >
              Từ Chối
            </Button>
            <Button
              variant="primary"
              :disabled="actionLoading"
              :loading="actionLoading"
              @click="handleApprove"
            >
              Xác Nhận Sinh Viên
            </Button>
          </div>
        </div>
        <p
          v-else
          class="text-sm text-gray-500 text-right"
        >
          Yêu cầu này đã được xử lý.
        </p>
      </div>
    </Modal>
  </div>
</template>
