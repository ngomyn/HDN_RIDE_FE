<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Booking, BookingStatus, PaymentStatus, PaymentType } from '@/types/api'
import SelectInput from '@/components/ui/SelectInput.vue'
import {
  Car,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  User,
  Users,
  X,
} from 'lucide-vue-next'

interface Props {
  modelValue: boolean
  booking: Booking | null
  loading: boolean
  selectedTripId: string
  tripOptions: Array<{ label: string; value: string }>
  tripsLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:selectedTripId': [value: string]
  'update-payment-status': [value: PaymentStatus]
  assign: []
  cancel: []
}>()

const paymentStatusOptions = [
  { label: 'Chưa thanh toán', value: 'UNPAID' },
  { label: 'Đã thanh toán', value: 'PAID' },
  { label: 'Đã hoàn tiền', value: 'REFUNDED' },
]

const editablePaymentStatus = ref<PaymentStatus>('UNPAID')

const canAssignCurrentBooking = computed(() => props.booking?.status === 'PENDING')
const canCancelBooking = computed(() => {
  return props.booking?.status === 'PENDING' || props.booking?.status === 'ASSIGNED'
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const getRouteKey = (booking: Booking): 'dn-hue' | 'hue-dn' | 'unknown' => {
  if (booking.route?.code === 1) return 'dn-hue'
  if (booking.route?.code === 2) return 'hue-dn'
  return 'unknown'
}

const getRouteBadgeClass = (booking: Booking): string => {
  const routeKey = getRouteKey(booking)
  if (routeKey === 'dn-hue') return 'bg-[#F2B233]/10 text-[#F2B233]'
  if (routeKey === 'hue-dn') return 'bg-[#4A2A12]/10 text-[#4A2A12]'
  return 'bg-gray-100 text-gray-500'
}

const getStatusText = (status: BookingStatus): string => {
  if (status === 'CONFIRMED') return 'Đã xác nhận'
  if (status === 'PENDING') return 'Chờ gắn xe'
  if (status === 'CANCELLED') return 'Đã hủy'
  if (status === 'ASSIGNED') return 'Đã gán chuyến'
  if (status === 'ONGOING') return 'Đang chạy'
  if (status === 'COMPLETED') return 'Hoàn thành'
  return status
}

const getStatusBadgeClass = (status: BookingStatus): string => {
  if (status === 'CONFIRMED') return 'bg-green-100 text-green-600'
  if (status === 'PENDING') return 'bg-orange-100 text-orange-600'
  if (status === 'CANCELLED') return 'bg-red-100 text-red-600'
  if (status === 'ASSIGNED') return 'bg-blue-100 text-blue-600'
  if (status === 'ONGOING') return 'bg-indigo-100 text-indigo-600'
  if (status === 'COMPLETED') return 'bg-slate-100 text-slate-600'
  return 'bg-gray-100 text-gray-600'
}

const getBookingTypeText = (bookingType?: Booking['bookingType']): string => {
  if (bookingType === 'SHARED') return 'Ghép xe'
  if (bookingType === 'PRIVATE') return 'Xe riêng'
  return '--'
}

const getPaymentMethodText = (type?: PaymentType | null): string => {
  if (type === 'CASH') return 'Tiền mặt'
  if (type === 'BANK_TRANSFER') return 'Chuyển khoản'
  return '--'
}

const getPaymentStatusText = (status?: PaymentStatus | null): string => {
  if (status === 'PAID') return 'Đã thanh toán'
  if (status === 'UNPAID') return 'Chưa thanh toán'
  if (status === 'REFUNDED') return 'Đã hoàn tiền'
  return '--'
}

const formatCurrency = (amount?: number | null): string => {
  if (typeof amount !== 'number') return '--'
  return `${amount.toLocaleString('vi-VN')}đ`
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('vi-VN')
}

const formatDate = (value?: string | null): string => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('vi-VN')
}

const formatTime = (value?: string | null): string => {
  if (!value) return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

const departSource = computed(() => {
  return props.booking?.trip?.departAt || props.booking?.estimatedDepartAt || props.booking?.createDate || null
})

watch(
  () => props.booking?.paymentStatus,
  (status) => {
    editablePaymentStatus.value = status ?? 'UNPAID'
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.modelValue"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        @click.self="closeModal"
      >
        <div class="w-full max-w-[760px] max-h-[90vh] overflow-y-auto rounded-[28px] bg-white shadow-[0_28px_80px_rgba(29,18,9,0.28)]">
          <div class="sticky top-0 z-10 flex items-center justify-between border-b border-[#EFE7DE] bg-white px-6 py-5">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A6700]">Booking Detail</p>
              <h2 class="mt-2 text-[26px] font-bold text-[#4A2A12]">
                {{ props.booking?.bookingCode || 'Chi tiết đặt chỗ' }}
              </h2>
            </div>
            <button
              type="button"
              class="rounded-2xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#4A2A12]"
              @click="closeModal"
            >
              <X :size="20" />
            </button>
          </div>

          <div v-if="props.booking" class="px-6 py-5">
            <div class="mb-6 flex flex-col gap-3 border-b border-[#EFE7DE] pb-5 md:flex-row md:items-center md:justify-between">
              <div class="flex flex-wrap items-center gap-3">
                <span :class="['inline-flex rounded-full px-3 py-1.5 text-sm font-semibold', getRouteBadgeClass(props.booking)]">
                  {{ props.booking.route?.name || 'Chưa có tuyến' }}
                </span>
                <span :class="['inline-flex rounded-full px-3 py-1.5 text-sm font-semibold', getStatusBadgeClass(props.booking.status)]">
                  {{ getStatusText(props.booking.status) }}
                </span>
              </div>
              <div class="text-sm text-gray-500">
                <span class="font-medium text-[#4A2A12]">Ngày tạo:</span>
                {{ formatDateTime(props.booking.createDate) }}
              </div>
            </div>

            <div class="space-y-6">
              <section>
                <h3 class="mb-3 flex items-center gap-2 text-base font-semibold text-[#4A2A12]">
                  <Clock :size="18" class="text-[#F2B233]" />
                  Thông tin chuyến đi
                </h3>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div class="rounded-2xl bg-[#F8F5F0] p-4">
                    <p class="text-xs text-gray-500">Ngày đi</p>
                    <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ formatDate(departSource) }}</p>
                  </div>
                  <div class="rounded-2xl bg-[#F8F5F0] p-4">
                    <p class="text-xs text-gray-500">Giờ đi</p>
                    <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ formatTime(departSource) }}</p>
                  </div>
                  <div class="rounded-2xl bg-[#F8F5F0] p-4">
                    <p class="text-xs text-gray-500">Loại chuyến</p>
                    <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ getBookingTypeText(props.booking.bookingType) }}</p>
                  </div>
                  <div class="rounded-2xl bg-[#F8F5F0] p-4">
                    <p class="text-xs text-gray-500">Số ghế</p>
                    <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ props.booking.numberOfPassengers }} người</p>
                  </div>
                </div>
              </section>

              <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="rounded-[24px] border border-[#EFE7DE] p-5">
                  <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#4A2A12]">
                    <User :size="18" class="text-[#F2B233]" />
                    Người đặt
                  </h3>
                  <div class="space-y-3 text-sm">
                    <div>
                      <p class="text-xs text-gray-500">Họ tên</p>
                      <p class="mt-1 font-semibold text-[#4A2A12]">{{ props.booking.user?.name || '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Số điện thoại</p>
                      <p class="mt-1 font-semibold text-[#4A2A12]">{{ props.booking.user?.phone || '--' }}</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-[24px] border border-[#EFE7DE] p-5">
                  <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#4A2A12]">
                    <Users :size="18" class="text-[#F2B233]" />
                    Thông tin hành khách
                  </h3>
                  <div class="space-y-3 text-sm">
                    <div>
                      <p class="text-xs text-gray-500">Tên hành khách</p>
                      <p class="mt-1 font-semibold text-[#4A2A12]">{{ props.booking.passengerName }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Số điện thoại</p>
                      <p class="mt-1 font-semibold text-[#4A2A12]">{{ props.booking.passengerPhone }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Số hành khách</p>
                      <p class="mt-1 font-semibold text-[#4A2A12]">{{ props.booking.numberOfPassengers }} người</p>
                    </div>
                  </div>
                </div>
              </section>

              <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="rounded-[24px] bg-[#F4FBF6] p-5">
                  <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#4A2A12]">
                    <MapPin :size="18" class="text-green-600" />
                    Điểm đón
                  </h3>
                  <div class="space-y-3 text-sm text-[#4A2A12]">
                    <div>
                      <p class="text-xs text-gray-500">Quận/Huyện</p>
                      <p class="mt-1 font-semibold">{{ props.booking.pickupDistrict || '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Phường/Xã</p>
                      <p class="mt-1 font-semibold">{{ props.booking.pickupWard || '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Địa chỉ đón</p>
                      <p class="mt-1 font-semibold">{{ props.booking.pickupAddress || '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">SĐT liên hệ</p>
                      <p class="mt-1 font-semibold">{{ props.booking.dropoffPhone || '--' }}</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-[24px] bg-[#FFF6F4] p-5">
                  <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#4A2A12]">
                    <MapPin :size="18" class="text-red-500" />
                    Điểm trả
                  </h3>
                  <div class="space-y-3 text-sm text-[#4A2A12]">
                    <div>
                      <p class="text-xs text-gray-500">Quận/Huyện</p>
                      <p class="mt-1 font-semibold">{{ props.booking.dropoffDistrict || '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Phường/Xã</p>
                      <p class="mt-1 font-semibold">{{ props.booking.dropoffWard || '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Địa chỉ trả</p>
                      <p class="mt-1 font-semibold">{{ props.booking.dropoffAddress || '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Mã chuyến</p>
                      <p class="mt-1 font-semibold">{{ props.booking.trip?.tripCode || '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Khởi hành dự kiến</p>
                      <p class="mt-1 font-semibold">{{ formatDateTime(props.booking.trip?.departAt || props.booking.estimatedDepartAt) }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="rounded-[24px] border border-[#EFE7DE] p-5">
                  <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#4A2A12]">
                    <CreditCard :size="18" class="text-[#F2B233]" />
                    Thông tin thanh toán
                  </h3>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl bg-[#F8F5F0] p-4">
                      <p class="text-xs text-gray-500">Phương thức</p>
                      <p class="mt-1 text-sm font-semibold text-[#4A2A12]">
                        {{ getPaymentMethodText(props.booking.paymentMethod?.type) }}
                      </p>
                    </div>
                    <div class="rounded-2xl bg-[#F8F5F0] p-4">
                      <p class="text-xs text-gray-500">Số tiền</p>
                      <p class="mt-1 text-sm font-semibold text-[#F2B233]">{{ formatCurrency(props.booking.amount) }}</p>
                    </div>
                    <div class="rounded-2xl bg-[#F8F5F0] p-4">
                      <p class="text-xs text-gray-500">Trạng thái</p>
                      <p class="mt-1 text-sm font-semibold text-[#F2B233]">{{ getPaymentStatusText(props.booking.paymentStatus) }}</p>
                    </div>
                  </div>
                  <div class="mt-4 flex flex-col gap-3 border-t border-[#EFE7DE] pt-4 sm:flex-row sm:items-end">
                    <SelectInput
                      v-model="editablePaymentStatus"
                      label="Cập nhật trạng thái thanh toán"
                      :options="paymentStatusOptions"
                      class="sm:flex-1"
                    />
                    <button
                      type="button"
                      class="h-11 rounded-2xl bg-[#F2B233] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#E0A020] disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="props.loading || editablePaymentStatus === props.booking.paymentStatus"
                      @click="emit('update-payment-status', editablePaymentStatus)"
                    >
                      {{ props.loading ? 'Đang cập nhật...' : 'Lưu' }}
                    </button>
                  </div>
                </div>

                <div class="rounded-[24px] border border-[#EFE7DE] p-5">
                  <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#4A2A12]">
                    <Phone :size="18" class="text-[#F2B233]" />
                    Điều phối & cập nhật
                  </h3>
                  <div class="space-y-3 text-sm text-[#4A2A12]">
                    <div>
                      <p class="text-xs text-gray-500">Admin gán chuyến</p>
                      <p class="mt-1 font-semibold">{{ props.booking.assignedByAdminPhone || '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Cập nhật lần cuối</p>
                      <p class="mt-1 font-semibold">{{ formatDateTime(props.booking.updateDate) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Lý do hủy</p>
                      <p class="mt-1 font-semibold">{{ props.booking.cancelReason || '--' }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section v-if="props.booking.tripId || props.booking.trip?.driver?.name" class="rounded-[24px] bg-[#EFF6FF] p-5">
                <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#4A2A12]">
                  <Car :size="18" class="text-[#2563EB]" />
                  Thông tin chuyến xe đã gán
                </h3>
                <div class="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div>
                    <p class="text-xs text-gray-500">Mã chuyến</p>
                    <p class="mt-1 font-semibold text-[#4A2A12]">{{ props.booking.trip?.tripCode || '--' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Tài xế</p>
                    <p class="mt-1 font-semibold text-[#4A2A12]">{{ props.booking.trip?.driver?.name || '--' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Tuyến</p>
                    <p class="mt-1 font-semibold text-[#4A2A12]">{{ props.booking.trip?.route?.name || props.booking.route?.name || '--' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Giờ khởi hành</p>
                    <p class="mt-1 font-semibold text-[#4A2A12]">{{ formatDateTime(props.booking.trip?.departAt) }}</p>
                  </div>
                </div>
              </section>

              <section v-if="canAssignCurrentBooking" class="rounded-[24px] bg-[#FFF8EC] p-5">
                <h3 class="mb-2 flex items-center gap-2 text-base font-semibold text-[#4A2A12]">
                  <Car :size="18" class="text-[#F2B233]" />
                  Gắn chuyến xe
                </h3>
                <p class="mb-4 text-sm text-gray-500">Chọn chuyến phù hợp cho booking này trước khi xác nhận điều phối.</p>
                <select
                  :value="props.selectedTripId"
                  :disabled="props.tripsLoading || props.loading"
                  class="h-12 w-full rounded-2xl border border-[#D8CEC1] px-4 text-sm text-[#4A2A12] outline-none transition-colors focus:border-[#F2B233] disabled:cursor-not-allowed disabled:bg-gray-100"
                  @change="emit('update:selectedTripId', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">-- Chọn chuyến xe --</option>
                  <option v-for="option in props.tripOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <button
                  type="button"
                  class="mt-4 h-12 w-full rounded-2xl bg-[#F2B233] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#E0A020] disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="!props.selectedTripId || props.loading"
                  @click="emit('assign')"
                >
                  {{ props.loading ? 'Đang gán booking...' : 'Xác nhận gắn chuyến' }}
                </button>
              </section>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 border-t border-[#EFE7DE] px-6 py-5">
            <button
              type="button"
              class="h-11 rounded-2xl border border-gray-300 px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              @click="closeModal"
            >
              Đóng
            </button>
            <button
              v-if="canCancelBooking"
              type="button"
              class="h-11 rounded-2xl bg-red-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="props.loading"
              @click="emit('cancel')"
            >
              {{ props.loading ? 'Đang xử lý...' : 'Hủy booking' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>