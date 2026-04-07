<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useStaffStore } from '@/stores/staff'
import type { AccountStatus, AdminStaffItem, CreateAdminStaffDto, UpdateAdminStaffDto } from '@/types/api'
import Breadcrumb from '@/components/Breadcrumb.vue'
import TextInput from '@/components/ui/TextInput.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import StaffCreateModal from '@/components/staff/StaffCreateModal.vue'
import StaffEditModal from '@/components/staff/StaffEditModal.vue'
import StaffStatusConfirmModal from '@/components/staff/StaffStatusConfirmModal.vue'
import {
  Search,
  Edit,
  UserCheck,
  UserX,
  Phone,
  Plus,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Filter,
  RefreshCw,
  CalendarDays,
  Mail,
} from 'lucide-vue-next'

const staffStore = useStaffStore()
const currentPage = ref(1)
const pageSize = 10

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showStatusConfirm = ref(false)

const statusFilterOptions = [
  { label: 'Tất cả', value: '' },
  { label: 'Đang hoạt động', value: 'ACTIVE' },
  { label: 'Tạm khóa', value: 'INACTIVE' },
]

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getInitials = (name: string) => {
  const words = name.trim().split(' ').filter(Boolean)
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase()
  }
  return (words[0]?.charAt(0) ?? 'U').toUpperCase()
}

const loadStaff = async (page = currentPage.value) => {
  await staffStore.fetchStaff(page, pageSize)
  currentPage.value = staffStore.pagination.page
}

onMounted(async () => {
  await Promise.all([loadStaff(1), staffStore.fetchStaffSummary()])
})

const handleCreateSubmit = async (payload: CreateAdminStaffDto) => {
  await staffStore.createStaff(payload)
  if (!staffStore.error) {
    showCreateModal.value = false
    await Promise.all([loadStaff(currentPage.value), staffStore.fetchStaffSummary()])
  }
}

const openEditModal = (staff: AdminStaffItem) => {
  staffStore.selectStaff(staff)
  showEditModal.value = true
}

const handleEditSubmit = async (payload: { userId: string; data: UpdateAdminStaffDto }) => {
  await staffStore.updateStaff(payload.userId, payload.data)
  if (!staffStore.error) {
    showEditModal.value = false
    await loadStaff(currentPage.value)
  }
}

const openStatusConfirm = (staff: AdminStaffItem) => {
  staffStore.selectStaff(staff)
  showStatusConfirm.value = true
}

const handleStatusSubmit = async (payload: { userId: string; accountStatus: AccountStatus }) => {
  await staffStore.updateStaffStatus(payload.userId, payload.accountStatus)
  if (!staffStore.error) {
    showStatusConfirm.value = false
    await Promise.all([loadStaff(currentPage.value), staffStore.fetchStaffSummary()])
  }
}

const handleSearch = async () => {
  currentPage.value = 1
  await loadStaff(1)
}

const handleReset = async () => {
  staffStore.resetFilters()
  currentPage.value = 1
  await loadStaff(1)
}

const goToPage = async (page: number) => {
  if (page < 1 || page > staffStore.pagination.totalPages) return
  currentPage.value = page
  await loadStaff(page)
}

const pageNumbers = () => {
  const total = staffStore.pagination.totalPages
  const cur = currentPage.value
  const pages: Array<number | string> = []

  if (total <= 7) {
    for (let index = 1; index <= total; index += 1) {
      pages.push(index)
    }
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let index = Math.max(2, cur - 1); index <= Math.min(total - 1, cur + 1); index += 1) {
      pages.push(index)
    }
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
}

const staffSummaryCards = [
  {
    id: 'total',
    title: 'Tổng nhân viên',
    value: () => staffStore.summary?.total ?? staffStore.pagination.total,
    caption: 'Tổng tài khoản nhân viên quản trị',
    icon: ShieldCheck,
    iconClass: 'bg-[#F2B233]/10 text-[#F2B233]',
  },
  {
    id: 'active',
    title: 'Đang hoạt động',
    value: () => staffStore.summary?.active ?? staffStore.activeCount,
    caption: 'Có thể đăng nhập và thao tác trong portal',
    icon: CheckCircle,
    iconClass: 'bg-green-100 text-green-600',
  },
  {
    id: 'inactive',
    title: 'Tạm khóa',
    value: () => staffStore.summary?.inactive ?? staffStore.inactiveCount,
    caption: 'Tài khoản đã bị vô hiệu hóa',
    icon: AlertCircle,
    iconClass: 'bg-red-100 text-red-600',
  },
]
</script>

<template>
  <div class="space-y-6">
    <Breadcrumb :items="['Trang chủ', 'Quản lý nhân viên']" />

    <section class="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#FFF8EC_0%,#F8E4B8_50%,#F2B233_100%)] px-6 py-7 shadow-[0_24px_60px_rgba(98,62,15,0.14)]">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-2xl space-y-3 text-[#4A2A12]">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[#8A5A12]">Manager workspace</p>
          <h1 class="text-3xl font-bold leading-tight md:text-4xl">Quản lý nhân viên quản trị tập trung</h1>
          <p class="max-w-xl text-sm leading-6 text-[#6B4C1E] md:text-base">
            Theo dõi tài khoản role ADMIN, cập nhật thông tin, đổi mật khẩu và khóa quyền truy cập ngay tại một màn hình thống nhất.
          </p>
        </div>

        <button
          class="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#4A2A12] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(74,42,18,0.2)] transition hover:bg-[#3A1F0C]"
          @click="showCreateModal = true"
        >
          <Plus :size="18" />
          Thêm nhân viên
        </button>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article
        v-for="card in staffSummaryCards"
        :key="card.id"
        class="rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">{{ card.title }}</p>
            <p class="mt-3 text-3xl font-bold text-[#4A2A12]">{{ card.value() }}</p>
            <p class="mt-2 text-sm leading-6 text-gray-500">{{ card.caption }}</p>
          </div>
          <div :class="['flex h-12 w-12 items-center justify-center rounded-2xl', card.iconClass]">
            <component :is="card.icon" :size="22" />
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-xl font-bold text-[#4A2A12]">Bộ lọc nhân viên</h2>
          <p class="mt-1 text-sm text-gray-500">Tìm nhanh theo tên, số điện thoại, ngày tham gia và trạng thái hoạt động.</p>
        </div>
        <div class="flex gap-3">
          <button
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            :disabled="staffStore.loading"
            @click="handleReset"
          >
            <RefreshCw :size="16" />
            Đặt lại
          </button>
          <button
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4A2A12] px-4 text-sm font-medium text-white transition hover:bg-[#3A1F0C] disabled:opacity-60"
            :disabled="staffStore.loading"
            @click="handleSearch"
          >
            <Search :size="16" />
            Tìm kiếm
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TextInput v-model="staffStore.filters.name" label="Họ và tên" placeholder="Nguyễn Văn A" />
        <TextInput v-model="staffStore.filters.phone" label="Số điện thoại" placeholder="0901122334" />
        <SelectInput v-model="staffStore.filters.accountStatus" label="Trạng thái" :options="statusFilterOptions" placeholder="Tất cả trạng thái" />
        <TextInput v-model="staffStore.filters.joinedFrom" type="date" label="Tham gia từ" />
        <TextInput v-model="staffStore.filters.joinedTo" type="date" label="Tham gia đến" />
      </div>
    </section>

    <section class="overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 class="text-lg font-bold text-[#4A2A12]">Danh sách nhân viên</h2>
          <p class="mt-1 text-sm text-gray-500">Chỉ bao gồm tài khoản có role ADMIN.</p>
        </div>
        <div class="inline-flex items-center gap-2 rounded-full bg-[#FFF8EC] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8A5A12]">
          <Filter :size="14" />
          {{ staffStore.pagination.total }} hồ sơ
        </div>
      </div>

      <div v-if="staffStore.loading" class="px-5 py-16 text-center text-sm text-gray-500">
        Đang tải danh sách nhân viên...
      </div>

      <div v-else-if="staffStore.error" class="px-5 py-6">
        <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ staffStore.error }}
        </div>
      </div>

      <div v-else-if="staffStore.records.length === 0" class="px-5 py-16 text-center text-sm text-gray-500">
        Chưa có nhân viên nào phù hợp với bộ lọc hiện tại.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="bg-[#FFF9EB] text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#8A5A12]">
            <tr>
              <th class="px-5 py-4">Nhân viên</th>
              <th class="px-5 py-4">Liên hệ</th>
              <th class="px-5 py-4">Ngày sinh</th>
              <th class="px-5 py-4">Ngày tạo</th>
              <th class="px-5 py-4">Trạng thái</th>
              <th class="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="staff in staffStore.records" :key="staff.id" class="transition hover:bg-[#FFFCF5]">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4A2A12] text-sm font-semibold text-white">
                    {{ getInitials(staff.name) }}
                  </div>
                  <div>
                    <p class="font-semibold text-[#4A2A12]">{{ staff.name }}</p>
                    <p class="text-xs text-gray-500">ID: {{ staff.id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-sm text-gray-600">
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Phone :size="14" class="text-[#8A5A12]" />
                    <span>{{ staff.phone }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Mail :size="14" class="text-[#8A5A12]" />
                    <span>{{ staff.gmail || 'Chưa cập nhật' }}</span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-sm text-gray-600">{{ formatDate(staff.dateOfBirth) }}</td>
              <td class="px-5 py-4 text-sm text-gray-600">
                <div class="inline-flex items-center gap-2">
                  <CalendarDays :size="14" class="text-[#8A5A12]" />
                  {{ formatDate(staff.createDate) }}
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                    staff.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                  ]"
                >
                  {{ staff.accountStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa' }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex justify-end gap-2">
                  <button
                    class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-[#F2B233] hover:text-[#8A5A12]"
                    title="Chỉnh sửa"
                    @click="openEditModal(staff)"
                  >
                    <Edit :size="16" />
                  </button>
                  <button
                    class="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition"
                    :class="staff.accountStatus === 'ACTIVE'
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-green-200 text-green-600 hover:bg-green-50'"
                    :title="staff.accountStatus === 'ACTIVE' ? 'Tạm khóa' : 'Kích hoạt'"
                    @click="openStatusConfirm(staff)"
                  >
                    <UserX v-if="staff.accountStatus === 'ACTIVE'" :size="16" />
                    <UserCheck v-else :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="staffStore.pagination.totalPages > 1" class="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <p class="text-sm text-gray-500">
          Trang {{ staffStore.pagination.page }}/{{ staffStore.pagination.totalPages }}
        </p>

        <div class="flex items-center gap-2">
          <button
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft :size="16" />
          </button>

          <template v-for="page in pageNumbers()" :key="String(page)">
            <span v-if="page === '...'" class="px-2 text-sm text-gray-400">...</span>
            <button
              v-else
              class="inline-flex h-10 min-w-[40px] items-center justify-center rounded-xl border px-3 text-sm font-medium transition"
              :class="page === currentPage ? 'border-[#4A2A12] bg-[#4A2A12] text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
              @click="goToPage(Number(page))"
            >
              {{ page }}
            </button>
          </template>

          <button
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
            :disabled="currentPage === staffStore.pagination.totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </section>

    <StaffCreateModal
      v-model="showCreateModal"
      :loading="staffStore.loading"
      :error="staffStore.error"
      @submit="handleCreateSubmit"
    />

    <StaffEditModal
      v-model="showEditModal"
      :staff="staffStore.selectedStaff"
      :loading="staffStore.loading"
      :error="staffStore.error"
      @submit="handleEditSubmit"
    />

    <StaffStatusConfirmModal
      v-model="showStatusConfirm"
      :staff="staffStore.selectedStaff"
      :loading="staffStore.loading"
      @submit="handleStatusSubmit"
    />
  </div>
</template>