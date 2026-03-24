<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { useBookingStore } from '@/stores/bookings'
import { apiClient } from '@/utils/apiClient'
import type { Booking } from '@/types/api'
import Button from '@/components/ui/Button.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import Modal from '@/components/ui/Modal.vue'
import { formatDateDisplay } from '@/utils/format'
import {
  Calendar,
  Search,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

const bookingStore = useBookingStore()
const currentPage = ref(1)
const pageSize = 10
const showDetailModal = ref(false)
const selectedTripId = ref('')
const tripsLoading = ref(false)
const tripOptions = ref<Array<{ label: string; value: string }>>([])

const totalRecords = computed(() => bookingStore.adminPagination.total)
const totalPages = computed(() => Math.max(1, bookingStore.adminPagination.totalPages))

const canAssignCurrentBooking = computed(() => bookingStore.selectedBooking?.status === 'PENDING')

const pageNumbers = computed(() => {
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPages.value, start + 4)
  start = Math.max(1, end - 4)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const resultFrom = computed(() => {
  if (totalRecords.value === 0) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const resultTo = computed(() => {
  if (totalRecords.value === 0) return 0
  return Math.min((currentPage.value - 1) * pageSize + bookingStore.adminBookings.length, totalRecords.value)
})

const getRouteLabel = (booking: Booking): string => {
  if (!booking.trip?.fromPlace || !booking.trip?.toPlace) return '--'
  return `${booking.trip.fromPlace} → ${booking.trip.toPlace}`
}

const getRouteKey = (booking: Booking): 'dn-hue' | 'hue-dn' | 'unknown' => {
  if (booking.trip?.fromPlace === 'Đà Nẵng' && booking.trip?.toPlace === 'Huế') return 'dn-hue'
  if (booking.trip?.fromPlace === 'Huế' && booking.trip?.toPlace === 'Đà Nẵng') return 'hue-dn'
  return 'unknown'
}

const getRouteBadgeClass = (booking: Booking): string => {
  const routeKey = getRouteKey(booking)
  if (routeKey === 'dn-hue') return 'bg-[#F2B233]/10 text-[#F2B233]'
  if (routeKey === 'hue-dn') return 'bg-[#4A2A12]/10 text-[#4A2A12]'
  return 'bg-gray-100 text-gray-500'
}

const getStatusText = (status: Booking['status']): string => {
  if (status === 'CONFIRMED') return 'Đã xác nhận'
  if (status === 'PENDING') return 'Chờ xác nhận'
  if (status === 'CANCELLED') return 'Đã hủy'
  if (status === 'ASSIGNED') return 'Đã gán chuyến'
  if (status === 'ONGOING') return 'Đang chạy'
  if (status === 'COMPLETED') return 'Hoàn thành'
  return status
}

const getStatusBadgeClass = (status: Booking['status']): string => {
  if (status === 'CONFIRMED') return 'bg-green-100 text-green-600'
  if (status === 'PENDING') return 'bg-orange-100 text-orange-600'
  if (status === 'CANCELLED') return 'bg-red-100 text-red-600'
  if (status === 'ASSIGNED') return 'bg-blue-100 text-blue-600'
  if (status === 'ONGOING') return 'bg-indigo-100 text-indigo-600'
  if (status === 'COMPLETED') return 'bg-sky-100 text-sky-700'
  return 'bg-gray-100 text-gray-600'
}

const formatBookingDate = (booking: Booking): string => {
  const date = booking.trip?.departAt || booking.createdAt
  return formatDateDisplay(date)
}

const formatBookingTime = (booking: Booking): string => {
  const source = booking.trip?.departAt || booking.createdAt
  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return '--:--'
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

const loadAdminBookings = async (page = currentPage.value) => {
  await bookingStore.fetchAdminBookings(page, pageSize)
  currentPage.value = bookingStore.adminPagination.page
}

const loadSummary = async () => {
  await bookingStore.fetchAdminBookingSummary(bookingStore.adminFilters.date || undefined)
}

const loadTripOptions = async () => {
  tripsLoading.value = true
  try {
    const response = await apiClient.searchTrips({
      startDate: new Date().toISOString(),
      page: 1,
      limit: 100,
    })

    const items = response.data?.items ?? []
    tripOptions.value = items.map((trip) => ({
      label: `#${trip.id} | ${trip.fromPlace} -> ${trip.toPlace} | ${formatDateDisplay(trip.departAt)} | Còn ${trip.availableSeats} ghế`,
      value: String(trip.id),
    }))
  } catch (_error) {
    tripOptions.value = []
  } finally {
    tripsLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadAdminBookings(1), loadSummary(), loadTripOptions()])
})

const formatDetailDateTime = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '-'
  return new Date(isoDate).toLocaleString('vi-VN')
}

const handleSearch = async () => {
  currentPage.value = 1
  await Promise.all([loadAdminBookings(1), loadSummary()])
}

const handleReset = async () => {
  bookingStore.resetAdminFilters()
  currentPage.value = 1
  await Promise.all([loadAdminBookings(1), loadSummary()])
}

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  await loadAdminBookings(page)
}

const handleRowClick = (booking: Booking) => {
  bookingStore.selectBooking(booking)
  selectedTripId.value = booking.tripId ? String(booking.tripId) : ''
  showDetailModal.value = true
}

const handleAssign = async () => {
  if (!bookingStore.selectedBooking) return
  if (!selectedTripId.value) {
    window.alert('Vui lòng chọn chuyến để gán booking.')
    return
  }

  await bookingStore.assignBooking(bookingStore.selectedBooking.id, Number(selectedTripId.value))

  if (!bookingStore.error) {
    showDetailModal.value = false
    await Promise.all([loadAdminBookings(currentPage.value), loadSummary()])
  }
}

const handleCancel = async (booking?: Booking) => {
  const target = booking ?? bookingStore.selectedBooking
  if (!target) return

  await bookingStore.cancelBooking(target.id)
  if (!bookingStore.error) {
    if (bookingStore.selectedBooking?.id === target.id) {
      showDetailModal.value = false
    }
    await Promise.all([loadAdminBookings(currentPage.value), loadSummary()])
  }
}
</script>

<template>
  <div class="">
    <Breadcrumb :items="['Trang chủ', 'Quản lý đặt chỗ']" />

    <h1 class="text-2xl font-bold text-[#4A2A12] py-5">Quản lý đặt chỗ</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      <div class="bg-white rounded-xl shadow-sm border-t-[3px] border-[#F2B233] p-5">
        <p class="text-sm text-gray-500 mb-1">Tổng đặt chỗ hôm nay</p>
        <p class="text-[28px] font-bold text-[#4A2A12]">{{ bookingStore.summary.totalToday }}</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border-t-[3px] border-[#22C55E] p-5">
        <p class="text-sm text-gray-500 mb-1">Đã xác nhận</p>
        <p class="text-[28px] font-bold text-[#4A2A12]">{{ bookingStore.summary.confirmedToday }}</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border-t-[3px] border-[#F59E0B] p-5">
        <p class="text-sm text-gray-500 mb-1">Chờ xác nhận</p>
        <p class="text-[28px] font-bold text-[#4A2A12]">{{ bookingStore.summary.pendingToday }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-5 mb-5">
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
          <input
            v-model="bookingStore.adminFilters.date"
            type="date"
            class="w-[200px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
          />
        </div>

        <select
          v-model="bookingStore.adminFilters.route"
          class="w-[220px] h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
        >
          <option value="all">Tất cả</option>
          <option value="dn-hue">Đà Nẵng → Huế</option>
          <option value="hue-dn">Huế → Đà Nẵng</option>
        </select>

        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
          <input
            v-model="bookingStore.adminFilters.customer"
            type="text"
            placeholder="Tìm theo tên khách hàng"
            class="w-[240px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
          />
        </div>

        <button
          class="h-11 px-6 bg-[#F2B233] text-white rounded-lg hover:bg-[#E0A020] transition-colors font-medium flex items-center gap-2"
          :disabled="bookingStore.loading"
          @click="handleSearch"
        >
          <Search :size="18" />
          Tìm kiếm
        </button>

        <button
          class="h-11 px-5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          :disabled="bookingStore.loading"
          @click="handleReset"
        >
          Đặt lại
        </button>
      </div>
    </div>

    <div v-if="bookingStore.error" class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">
      {{ bookingStore.error }}
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1120px]">
          <thead>
            <tr class="bg-[#4A2A12] text-white text-sm">
              <th class="text-left py-3 px-4 font-semibold w-[60px]">STT</th>
              <th class="text-left py-3 px-4 font-semibold w-[170px]">Tuyến</th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">Ngày</th>
              <th class="text-left py-3 px-4 font-semibold w-[80px]">Giờ</th>
              <th class="text-left py-3 px-4 font-semibold w-[170px]">Tên khách hàng</th>
              <th class="text-left py-3 px-4 font-semibold w-[140px]">Số điện thoại</th>
              <th class="text-left py-3 px-4 font-semibold w-[100px]">Số ghế đặt</th>
              <th class="text-left py-3 px-4 font-semibold w-[160px]">Điểm đón</th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">Trạng thái</th>
              <th class="text-left py-3 px-4 font-semibold w-[100px]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="bookingStore.loading">
              <td class="py-6 px-4 text-center text-gray-500" colspan="10">
                Đang tải dữ liệu...
              </td>
            </tr>
            <tr v-else-if="bookingStore.adminBookings.length === 0">
              <td class="py-6 px-4 text-center text-gray-500" colspan="10">
                Không có booking phù hợp bộ lọc.
              </td>
            </tr>
            <tr
              v-for="(booking, index) in bookingStore.adminBookings"
              v-else
              :key="booking.id"
              :class="index % 2 === 0 ? 'bg-white hover:bg-[#FFF9EB] transition-colors' : 'bg-[#FAFAFA] hover:bg-[#FFF9EB] transition-colors'"
            >
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td class="py-3 px-4">
                <span :class="['inline-block px-2 py-1 rounded text-xs font-medium', getRouteBadgeClass(booking)]">
                  {{ getRouteLabel(booking) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ formatBookingDate(booking) }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ formatBookingTime(booking) }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ booking.passengerName }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ booking.passengerPhone }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12] font-semibold text-center">{{ booking.numberOfPassengers }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ booking.pickupWard }}</td>
              <td class="py-3 px-4">
                <span :class="['inline-block px-2 py-1 rounded text-xs font-medium', getStatusBadgeClass(booking.status)]">
                  {{ getStatusText(booking.status) }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button class="p-1.5 hover:bg-gray-200 rounded transition-colors" title="Xem" @click="handleRowClick(booking)">
                    <Eye :size="16" class="text-blue-600" />
                  </button>
                  <button
                    v-if="booking.status === 'PENDING'"
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Xác nhận"
                    @click="handleRowClick(booking)"
                  >
                    <Check :size="16" class="text-green-600" />
                  </button>
                  <button
                    v-if="booking.status === 'PENDING'"
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Hủy"
                    @click="handleCancel(booking)"
                  >
                    <X :size="16" class="text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between px-4 py-4 border-t border-gray-200">
        <div class="text-sm text-gray-600">
          Hiển thị {{ resultFrom }}-{{ resultTo }} của {{ totalRecords }} kết quả
        </div>
        <div class="flex items-center gap-1">
          <button
            class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft :size="16" />
          </button>

          <button
            v-for="page in pageNumbers"
            :key="page"
            class="w-8 h-8 flex items-center justify-center border rounded transition-colors"
            :class="
              page === currentPage
                ? 'bg-[#F2B233] text-white border-[#F2B233]'
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            "
            @click="goToPage(page)"
          >
            {{ page }}
          </button>

          <button
            class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Detail Drawer Modal -->
  <Modal v-model="showDetailModal" :title="`Chi tiet booking #${bookingStore.selectedBooking?.id}`" size="lg">
    <div v-if="bookingStore.selectedBooking" class="space-y-6">
      <!-- Booking Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">Hanh khach</p>
          <p class="font-semibold text-gray-900">{{ bookingStore.selectedBooking.passengerName }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">SDT hanh khach</p>
          <p class="font-semibold text-gray-900">{{ bookingStore.selectedBooking.passengerPhone }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">Loai booking</p>
          <p class="font-semibold text-gray-900">{{ bookingStore.selectedBooking.bookingType }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">Trang thai</p>
          <StatusBadge :status="bookingStore.selectedBooking.status" />
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">So hanh khach</p>
          <p class="font-semibold text-gray-900">{{ bookingStore.selectedBooking.numberOfPassengers }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">Ngay tao</p>
          <p class="font-semibold text-gray-900">{{ formatDetailDateTime(bookingStore.selectedBooking.createdAt) }}</p>
        </div>
      </div>

      <!-- Pickup/Dropoff Info -->
      <div class="border-t pt-4">
        <h3 class="font-semibold text-gray-900 mb-3">Thong tin don/tra</h3>
        <div class="grid grid-cols-1 gap-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Quan/Huyen don:</span>
            <span class="font-medium text-gray-900">{{ bookingStore.selectedBooking.pickupDistrict }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Phuong/Xa don:</span>
            <span class="font-medium text-gray-900">{{ bookingStore.selectedBooking.pickupWard }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Dia chi don:</span>
            <span class="font-medium text-gray-900 text-right">{{ bookingStore.selectedBooking.pickupAddress }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">SDT nguoi don:</span>
            <span class="font-medium text-gray-900">{{ bookingStore.selectedBooking.dropoffPhone }}</span>
          </div>
          <div class="flex justify-between" v-if="bookingStore.selectedBooking.tripId">
            <span class="text-gray-600">Da gan vao chuyen:</span>
            <span class="font-medium text-gray-900">#{{ bookingStore.selectedBooking.tripId }}</span>
          </div>
        </div>
      </div>

      <!-- Assignment -->
      <div v-if="canAssignCurrentBooking" class="border-t pt-4 space-y-3">
        <h3 class="font-semibold text-gray-900">Gan vao chuyen</h3>
        <SelectInput
          v-model="selectedTripId"
          label="Chon chuyen"
          :options="tripOptions"
          :disabled="tripsLoading || bookingStore.loading"
          placeholder="Chon chuyen de gan"
        />
        <Button class="w-full" :loading="bookingStore.loading" :disabled="!selectedTripId" @click="handleAssign">
          Gan booking vao chuyen
        </Button>
      </div>

      <!-- Actions -->
      <div class="border-t pt-4 flex gap-3">
        <Button
          variant="danger"
          class="flex-1"
          :disabled="bookingStore.selectedBooking.status === 'CANCELLED' || bookingStore.selectedBooking.status === 'COMPLETED'"
          :loading="bookingStore.loading"
          @click="handleCancel"
        >
          Hủy
        </Button>
      </div>
    </div>
  </Modal>
</template>
