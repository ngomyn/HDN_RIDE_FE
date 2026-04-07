<script setup lang="ts">
import { Trash2, X } from "lucide-vue-next";
import type { Booking } from "@/types/api";

interface Props {
  modelValue: boolean;
  loading: boolean;
  tripCode?: string;
  bookings: Booking[];
  removingBookingId?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  removeBooking: [booking: Booking];
}>();

const closeModal = () => {
  emit("update:modelValue", false);
};

const canRemoveBooking = (booking: Booking): boolean => {
  return booking.status === "PENDING" || booking.status === "ASSIGNED";
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.modelValue"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="closeModal"
      >
        <div class="w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-[#4A2A12]">Danh sách đặt chỗ</h2>
              <p class="mt-1 text-sm text-gray-500">{{ props.tripCode ? `Chuyến ${props.tripCode}` : 'Danh sách đặt chỗ của chuyến.' }}</p>
            </div>
            <button
              class="rounded p-1.5 transition-colors hover:bg-gray-200"
              title="Đóng"
              @click="closeModal"
            >
              <X :size="20" class="text-gray-600" />
            </button>
          </div>

          <div class="overflow-hidden rounded-lg border border-gray-200">
            <div v-if="props.loading" class="p-8 text-center text-sm text-gray-500">Đang tải danh sách đặt chỗ...</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-[#4A2A12] text-sm text-white">
                    <th class="w-[60px] px-4 py-3 text-left font-semibold">STT</th>
                    <th class="px-4 py-3 text-left font-semibold">Mã đặt xe</th>
                    <th class="px-4 py-3 text-left font-semibold">Tên người đi</th>
                    <th class="px-4 py-3 text-left font-semibold">Số điện thoại người đi</th>
                    <th class="w-[100px] px-4 py-3 text-left font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="props.bookings.length === 0">
                    <td colspan="5" class="py-8 text-center text-sm text-gray-500">
                      Chưa có đặt chỗ nào cho chuyến xe này
                    </td>
                  </tr>
                  <tr
                    v-for="(booking, index) in props.bookings"
                    v-else
                    :key="booking.id"
                    :class="index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'"
                  >
                    <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ index + 1 }}</td>
                    <td class="py-3 px-4 text-sm font-medium text-[#4A2A12]">{{ booking.bookingCode }}</td>
                    <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ booking.passengerName }}</td>
                    <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ booking.passengerPhone }}</td>
                    <td class="py-3 px-4">
                      <button
                        v-if="canRemoveBooking(booking)"
                        type="button"
                        class="p-1.5 rounded transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="props.removingBookingId === booking.id"
                        title="Xoá booking khỏi chuyến"
                        @click="emit('removeBooking', booking)"
                      >
                        <Trash2 :size="16" class="text-red-600" />
                      </button>
                      <span v-else class="text-xs text-gray-300">--</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="props.bookings.length > 0" class="mt-4 flex items-center justify-between">
            <p class="text-sm text-gray-500">
              Tổng số: <span class="font-semibold text-[#4A2A12]">{{ props.bookings.length }} đặt chỗ</span>
            </p>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="button"
              class="h-11 rounded-lg bg-[#F2B233] px-6 text-sm font-medium text-white transition-colors hover:bg-[#E0A020]"
              @click="closeModal"
            >
              Quay lại
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