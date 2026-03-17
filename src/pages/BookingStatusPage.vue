<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBookingStore } from '@/stores/bookings'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import TextInput from '@/components/ui/TextInput.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import Table from '@/components/ui/Table.vue'
import Pagination from '@/components/ui/Pagination.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import Modal from '@/components/ui/Modal.vue'
import { routeOptions } from '@/data/mockData'
import { formatDateDisplay } from '@/utils/format'

const bookingStore = useBookingStore()
const currentPage = ref(1)
const pageSize = 10
const showDetailModal = ref(false)

onMounted(() => {
  bookingStore.fetchBookings()
})

const bookingColumns = [
  { key: 'id', label: 'STT', width: '60px' },
  { key: 'route', label: 'Tuyen' },
  { key: 'date', label: 'Ngay', render: formatDateDisplay },
  { key: 'time', label: 'Gio' },
  { key: 'customerName', label: 'Ten khach' },
  { key: 'phone', label: 'Điện Thoại' },
  { key: 'seatCount', label: 'So ghe' },
  { key: 'pickupWard', label: 'Phuong don' },
  { key: 'status', label: 'Trang thai' },
]

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return bookingStore.filtered.slice(start, start + pageSize)
})

const handleClearFilters = () => {
  bookingStore.filters.route = ''
  bookingStore.filters.status = ''
  bookingStore.filters.startDate = ''
  bookingStore.filters.endDate = ''
  bookingStore.searchText = ''
  currentPage.value = 1
}

const handleRowClick = (booking: any) => {
  bookingStore.selectedBooking = booking
  showDetailModal.value = true
}

const handleConfirm = async () => {
  if (bookingStore.selectedBooking) {
    await bookingStore.confirmBooking(bookingStore.selectedBooking.id)
    showDetailModal.value = false
  }
}

const handleCancel = async () => {
  if (bookingStore.selectedBooking) {
    await bookingStore.cancelBooking(bookingStore.selectedBooking.id)
    showDetailModal.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold text-gray-900">Kiểm Tra Trạng Thái Chuyến Xe</h1>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card class="text-center">
        <p class="text-sm text-gray-600">Tong dat cho</p>
        <p class="text-2xl font-bold text-brand-gold">{{ bookingStore.filtered.length }}</p>
      </Card>
      <Card class="text-center">
        <p class="text-sm text-gray-600">Cho xac nhan</p>
        <p class="text-2xl font-bold text-orange-600">{{ bookingStore.filtered.filter(b => b.status === 'WAITING').length }}</p>
      </Card>
      <Card class="text-center">
        <p class="text-sm text-gray-600">Da xac nhan</p>
        <p class="text-2xl font-bold text-green-600">{{ bookingStore.filtered.filter(b => b.status === 'CONFIRMED').length }}</p>
      </Card>
      <Card class="text-center">
        <p class="text-sm text-gray-600">Đã Hủy</p>
        <p class="text-2xl font-bold text-red-600">{{ bookingStore.filtered.filter(b => b.status === 'CANCELED').length }}</p>
      </Card>
    </div>

    <!-- Filters Card -->
    <Card>
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Bo loc va tim kiem</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TextInput
          v-model="bookingStore.searchText"
          placeholder="Tìm Theo Tên Hoặc Điện Thoại..."
          @keyup.enter="handleSearch"
        />
        <SelectInput
          v-model="bookingStore.filters.route"
          label="Tuyen"
          :options="routeOptions"
          placeholder="Tat ca"
        />
        <SelectInput
          v-model="bookingStore.filters.status"
          label="Trang thai"
          :options="['PENDING', 'CONFIRMED', 'CANCELED', 'WAITING']"
          placeholder="Tat ca"
        />
        <div class="flex gap-2 items-end">
          <Button variant="secondary" @click="handleClearFilters" class="flex-1"> Reset </Button>
          <Button @click="handleSearch" class="flex-1"> Tim kiem </Button>
        </div>
      </div>
    </Card>

    <!-- Table Card -->
    <Card>
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Danh sach dat cho</h2>

      <Table
        :columns="bookingColumns"
        :data="paginatedBookings"
        @row-click="handleRowClick"
      >
        <template #cell-status="{ value }">
          <StatusBadge :status="value" />
        </template>
      </Table>

      <!-- Pagination -->
      <div class="mt-6 flex justify-center">
        <Pagination
          :current="currentPage"
          :total="bookingStore.filtered.length"
          :page-size="pageSize"
          @update:current="currentPage = $event"
        />
      </div>
    </Card>
  </div>

  <!-- Detail Drawer Modal -->
  <Modal v-model="showDetailModal" :title="`Chi tiet dat cho #${bookingStore.selectedBooking?.id}`" size="lg">
    <div v-if="bookingStore.selectedBooking" class="space-y-6">
      <!-- Booking Info -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">Tuyen</p>
          <p class="font-semibold text-gray-900">{{ bookingStore.selectedBooking.route }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">Ngay - Gio</p>
          <p class="font-semibold text-gray-900">{{ bookingStore.selectedBooking.date }} {{ bookingStore.selectedBooking.time }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">So ghe</p>
          <p class="font-semibold text-gray-900">{{ bookingStore.selectedBooking.seatCount }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600">Trang thai</p>
          <StatusBadge :status="bookingStore.selectedBooking.status" />
        </div>
      </div>

      <!-- Customer Info -->
      <div class="border-t pt-4">
        <h3 class="font-semibold text-gray-900 mb-3">Thong tin khach hang</h3>
        <div class="grid grid-cols-1 gap-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Ten:</span>
            <span class="font-medium text-gray-900">{{ bookingStore.selectedBooking.customerName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Điện Thoại:</span>
            <span class="font-medium text-gray-900">{{ bookingStore.selectedBooking.phone }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Email:</span>
            <span class="font-medium text-gray-900">{{ bookingStore.selectedBooking.email }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Phuong don:</span>
            <span class="font-medium text-gray-900">{{ bookingStore.selectedBooking.pickupWard }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="bookingStore.selectedBooking.note" class="border-t pt-4">
        <h3 class="font-semibold text-gray-900 mb-2">Ghi chu</h3>
        <p class="text-gray-700 text-sm bg-blue-50 p-3 rounded-lg">{{ bookingStore.selectedBooking.note }}</p>
      </div>

      <!-- Actions -->
      <div class="border-t pt-4 flex gap-3">
        <Button
          variant="danger"
          class="flex-1"
          :disabled="bookingStore.selectedBooking.status === 'CANCELED'"
          :loading="bookingStore.loading"
          @click="handleCancel"
        >
          Hủy
        </Button>
        <Button
          class="flex-1"
          :disabled="bookingStore.selectedBooking.status === 'CONFIRMED'"
          :loading="bookingStore.loading"
          @click="handleConfirm"
        >
          Xac nhan
        </Button>
      </div>
    </div>
  </Modal>
</template>
