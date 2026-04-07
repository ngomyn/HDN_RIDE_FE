<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '@/utils/apiClient'
import Breadcrumb from '@/components/Breadcrumb.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Modal from '@/components/ui/Modal.vue'
import { formatDateDisplay } from '@/utils/format'
import { Download, TrendingUp, Calendar, Receipt, CircleDollarSign, Route, AlertTriangle, Eye } from 'lucide-vue-next'
import type { AdminRevenueItem, AdminRevenueSummary } from '@/types/api'

const currentPage = ref(1)
const pageSize = 10
const dateFrom = ref('')
const dateTo = ref('')
const records = ref<AdminRevenueItem[]>([])
const loading = ref(false)
const error = ref('')
const exporting = ref(false)
const showDetailModal = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const selectedRevenue = ref<AdminRevenueItem | null>(null)
const summary = ref<AdminRevenueSummary>({
  companyRevenue: 0,
  grossRevenue: 0,
  totalDriverEarnings: 0,
  tripCount: 0,
  averageCompanyRevenuePerTrip: 0,
})

const totalRevenue = computed(() => summary.value.companyRevenue)
const paidRevenue = computed(() => summary.value.grossRevenue)
const routeCount = computed(() => new Set(records.value.map((item) => item.route?.name ?? `Tuyến ${item.routeId}`)).size)
const averageTicket = computed(() => summary.value.averageCompanyRevenuePerTrip)

const totalRecords = computed(() => summary.value.tripCount)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const downloadBlob = (filename: string, blob: Blob) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const loadRevenueRecords = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await apiClient.getAdminRevenue({
      page: currentPage.value,
      limit: pageSize,
      startDate: dateFrom.value || undefined,
      endDate: dateTo.value || undefined,
    })

    records.value = response.data?.items ?? []
    summary.value = response.data?.summary ?? summary.value
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Không thể tải dữ liệu doanh thu'
    records.value = []
    summary.value = {
      companyRevenue: 0,
      grossRevenue: 0,
      totalDriverEarnings: 0,
      tripCount: 0,
      averageCompanyRevenuePerTrip: 0,
    }
  } finally {
    loading.value = false
  }
}

const applyFilters = async (page = 1) => {
  currentPage.value = page
  await loadRevenueRecords()
}

const handleExport = async () => {
  if (exporting.value) return

  exporting.value = true

  try {
    const { blob, filename } = await apiClient.exportAdminRevenueCsv({
      startDate: dateFrom.value || undefined,
      endDate: dateTo.value || undefined,
    })
    downloadBlob(filename, blob)
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Không thể xuất dữ liệu doanh thu')
  } finally {
    exporting.value = false
  }
}

const openRevenueDetail = async (item: AdminRevenueItem) => {
  selectedRevenue.value = item
  showDetailModal.value = true
  detailLoading.value = true
  detailError.value = ''

  try {
    const response = await apiClient.getTripRevenue(item.tripId)
    selectedRevenue.value = response.data ?? item
  } catch (err: unknown) {
    detailError.value = err instanceof Error ? err.message : 'Không thể tải chi tiết doanh thu chuyến'
  } finally {
    detailLoading.value = false
  }
}

const closeRevenueDetail = () => {
  showDetailModal.value = false
  detailLoading.value = false
  detailError.value = ''
}

onMounted(() => applyFilters(1))
</script>

<template>
  <div class="space-y-6 p-6">
    <Breadcrumb :items="[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Quản lý doanh thu' }]" />

    <section class="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#143B2D_0%,#1C5A43_52%,#2B7A5B_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(20,59,45,0.22)]">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-3">
          <span class="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            Revenue overview
          </span>
          <div class="space-y-2">
            <h1 class="text-3xl font-bold">Quản lý doanh thu</h1>
            <p class="max-w-2xl text-sm leading-6 text-white/80">
              Theo dõi doanh thu công ty từ các chuyến đã ghi nhận `TripRevenue`, thay vì phải tự tổng hợp thủ công từ danh sách booking.
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm lg:max-w-[340px]">
          <p class="text-xs uppercase tracking-[0.18em] text-white/60">Lưu ý contract</p>
          <p class="mt-1 text-sm font-semibold">Đã dùng revenue API manager mới</p>
          <p class="mt-1 text-xs text-white/75">Xuất CSV hiện được tạo từ backend để đồng bộ dữ liệu và tên file theo bộ lọc.</p>
        </div>
      </div>
    </section>

    <!-- Summary card -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-3xl border border-[#DDE9E2] bg-white p-5 shadow-[0_12px_35px_rgba(20,59,45,0.08)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Tổng doanh thu</p>
            <p class="mt-2 text-3xl font-bold text-[#143B2D]">{{ formatCurrency(totalRevenue) }}</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingUp :size="20" />
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-[#DDE9E2] bg-white p-5 shadow-[0_12px_35px_rgba(20,59,45,0.08)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Chuyến đã ghi nhận</p>
            <p class="mt-2 text-3xl font-bold text-[#143B2D]">{{ totalRecords }}</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Receipt :size="20" />
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-[#DDE9E2] bg-white p-5 shadow-[0_12px_35px_rgba(20,59,45,0.08)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Đã thanh toán</p>
            <p class="mt-2 text-3xl font-bold text-[#143B2D]">{{ formatCurrency(paidRevenue) }}</p>
            <p class="mt-2 text-xs text-gray-500">Bao gồm toàn bộ gross revenue trước chia tài xế</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <CircleDollarSign :size="20" />
          </div>
        </div>
      </article>

      <article class="rounded-3xl border border-[#DDE9E2] bg-white p-5 shadow-[0_12px_35px_rgba(20,59,45,0.08)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Tuyến phát sinh</p>
            <p class="mt-2 text-3xl font-bold text-[#143B2D]">{{ routeCount }}</p>
            <p class="mt-2 text-xs text-gray-500">TB doanh thu công ty/chuyến {{ formatCurrency(averageTicket) }}</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Route :size="20" />
          </div>
        </div>
      </article>
    </div>

    <!-- Filters bar -->
    <div class="rounded-3xl border border-[#DDE9E2] bg-white p-5 shadow-[0_12px_35px_rgba(20,59,45,0.08)]">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <p class="text-xs text-gray-500 mb-1.5 font-medium">Từ ngày</p>
          <div class="relative">
            <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
            <input
              v-model="dateFrom"
              type="date"
              class="w-[180px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] text-sm"
            />
          </div>
        </div>

        <div>
          <p class="text-xs text-gray-500 mb-1.5 font-medium">Đến ngày</p>
          <div class="relative">
            <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
            <input
              v-model="dateTo"
              type="date"
              class="w-[180px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] text-sm"
            />
          </div>
        </div>

        <button
          class="h-11 px-5 bg-[#4A2A12] text-white rounded-lg text-sm font-medium hover:bg-[#3c2410] transition-colors"
          @click="applyFilters(1)"
        >
          Lọc
        </button>

        <button
          class="h-11 px-5 ml-auto bg-[#22C55E] text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
          :disabled="exporting"
          @click="handleExport"
        >
          <Download :size="16" />
          {{ exporting ? 'Đang xuất...' : 'Tải xuống CSV' }}
        </button>
      </div>

      <div class="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle :size="16" class="mt-0.5 flex-shrink-0" />
        <p>
          Trang này đã dùng revenue API manager và export CSV từ backend theo bộ lọc hiện tại. Nếu cần file Excel nhiều sheet hoặc báo cáo phức tạp hơn, có thể mở rộng tiếp từ endpoint export này.
        </p>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-3xl border border-[#DDE9E2] bg-white shadow-[0_12px_35px_rgba(20,59,45,0.08)]">
      <div class="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-[#143B2D]">Danh sách doanh thu theo chuyến</h2>
          <p class="mt-1 text-sm text-gray-500">Hiển thị bản ghi `TripRevenue` theo khoảng ngày tạo đã chọn.</p>
        </div>
        <div class="inline-flex items-center rounded-full bg-[#ECF7F1] px-3 py-1.5 text-sm font-medium text-[#1C5A43]">
          {{ totalRecords }} bản ghi
        </div>
      </div>

      <div v-if="loading" class="p-12 text-center text-gray-500">
        <div class="w-8 h-8 border-2 border-[#F2B233] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang tải...
      </div>

      <div v-else-if="error" class="p-10 text-center text-red-500">
        {{ error }}
      </div>

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-[#4A2A12] text-white">
                <th class="py-3 px-4 text-left text-sm font-semibold w-12">STT</th>
                <th class="py-3 px-4 text-left text-sm font-semibold">Mã chuyến</th>
                <th class="py-3 px-4 text-left text-sm font-semibold">Tài xế</th>
                <th class="py-3 px-4 text-left text-sm font-semibold">Tuyến</th>
                <th class="py-3 px-4 text-left text-sm font-semibold">Ngày</th>
                <th class="py-3 px-4 text-left text-sm font-semibold">Tổng gross</th>
                <th class="py-3 px-4 text-right text-sm font-semibold">Doanh thu công ty</th>
                <th class="py-3 px-4 text-right text-sm font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(booking, index) in records"
                :key="booking.id"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4 text-sm text-gray-500">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>
                <td class="py-3 px-4 text-sm font-mono text-[#4A2A12] font-medium">
                  {{ booking.trip?.tripCode ?? booking.tripId }}
                </td>
                <td class="py-3 px-4 text-sm text-gray-700">
                  <div>{{ booking.driver?.name ?? '—' }}</div>
                  <div class="text-xs text-gray-400">{{ booking.recordedBy }}</div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">
                  {{ booking.route?.name ?? `Tuyến ${booking.routeId}` }}
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">
                  {{ formatDateDisplay(booking.createDate) }}
                </td>
                <td class="py-3 px-4 text-sm font-semibold text-[#4A2A12]">
                  {{ formatCurrency(booking.totalRevenue) }}
                </td>
                <td class="py-3 px-4 text-sm font-semibold text-right text-[#22C55E]">
                  {{ formatCurrency(booking.companyEarnings) }}
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    class="inline-flex items-center gap-2 rounded-lg border border-[#D8C8B5] px-3 py-2 text-sm font-medium text-[#4A2A12] transition-colors hover:bg-[#FAF5EE]"
                    @click="openRevenueDetail(booking)"
                  >
                    <Eye :size="15" />
                    Chi tiết
                  </button>
                </td>
              </tr>

              <tr v-if="records.length === 0">
                <td colspan="8" class="py-12 text-center text-gray-400 text-sm">
                  Không có dữ liệu doanh thu
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalRecords > pageSize" class="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <p class="text-sm text-gray-500">Tổng {{ totalRecords }} bản ghi</p>
          <Pagination
            :current="currentPage"
            :total="totalRecords"
            :page-size="pageSize"
            @update:current="applyFilters"
          />
        </div>
      </template>
    </div>

    <Modal
      v-model="showDetailModal"
      :title="selectedRevenue ? `Chi tiết doanh thu ${selectedRevenue.trip?.tripCode ?? selectedRevenue.tripId}` : 'Chi tiết doanh thu'"
      size="lg"
    >
      <div v-if="detailLoading" class="py-10 text-center text-sm text-gray-500">
        Đang tải chi tiết doanh thu...
      </div>

      <div v-else-if="detailError" class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ detailError }}
      </div>

      <div v-else-if="selectedRevenue" class="space-y-5">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article class="rounded-2xl bg-[#F5FAF7] p-4">
            <p class="text-xs uppercase tracking-[0.16em] text-[#1C5A43]/60">Gross revenue</p>
            <p class="mt-2 text-2xl font-bold text-[#143B2D]">{{ formatCurrency(selectedRevenue.totalRevenue) }}</p>
          </article>
          <article class="rounded-2xl bg-[#FFF8EC] p-4">
            <p class="text-xs uppercase tracking-[0.16em] text-[#9A6400]/60">Tài xế nhận</p>
            <p class="mt-2 text-2xl font-bold text-[#4A2A12]">{{ formatCurrency(selectedRevenue.driverEarnings) }}</p>
          </article>
          <article class="rounded-2xl bg-[#EFF6FF] p-4">
            <p class="text-xs uppercase tracking-[0.16em] text-sky-700/60">Công ty giữ lại</p>
            <p class="mt-2 text-2xl font-bold text-sky-700">{{ formatCurrency(selectedRevenue.companyEarnings) }}</p>
          </article>
        </div>

        <div class="grid grid-cols-1 gap-4 rounded-3xl border border-[#EFE7DE] bg-[#FCFAF7] p-5 sm:grid-cols-2">
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Mã chuyến</p>
            <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ selectedRevenue.trip?.tripCode ?? selectedRevenue.tripId }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Tuyến</p>
            <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ selectedRevenue.route?.name ?? `Tuyến ${selectedRevenue.routeId}` }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Tài xế</p>
            <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ selectedRevenue.driver?.name ?? '—' }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ selectedRevenue.driver?.phone ?? selectedRevenue.driverId }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Commission rate</p>
            <p class="mt-1 text-sm font-semibold text-[#4A2A12]">
              {{ selectedRevenue.driverCommissionRate != null ? `${Math.round(selectedRevenue.driverCommissionRate * 100)}%` : '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Người ghi nhận</p>
            <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ selectedRevenue.recordedBy }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Ngày ghi nhận</p>
            <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ formatDateDisplay(selectedRevenue.createDate) }}</p>
          </div>
        </div>

        <div class="flex justify-end">
          <button class="rounded-lg bg-[#4A2A12] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3c2410]" @click="closeRevenueDetail">
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
export default {
  name: 'RevenueManagementPage',
}
</script>
