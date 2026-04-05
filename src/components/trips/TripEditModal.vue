<script setup lang="ts">
import { ChevronRight, X } from "lucide-vue-next";
import type { TripStatus, TripType } from "@/types/api";

interface Props {
  modelValue: boolean;
  loading: boolean;
  status: TripStatus;
  totalSeats: number;
  availableSeats: number;
  bookingCount: number;
  canEdit: boolean;
  tripCode?: string;
  routeName?: string;
  tripType?: TripType;
  driverName?: string;
  departDate?: string;
  departTime?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:status": [value: TripStatus];
  "update:totalSeats": [value: number];
  submit: [];
  viewBookings: [];
  close: [];
}>();

const closeModal = () => {
  emit("update:modelValue", false);
  emit("close");
};

const getStatusText = (status: TripStatus): string => {
  switch (status) {
    case "SCHEDULED":
      return "Chờ khởi hành";
    case "ONGOING":
      return "Đang chạy";
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
};

const getTripTypeText = (tripType?: TripType): string => {
  if (tripType === "PRIVATE") return "Bao xe";
  return "Ghép xe";
};

const handleStatusChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as TripStatus;
  emit("update:status", value);
};

const handleTotalSeatsInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value);
  emit("update:totalSeats", Number.isNaN(value) ? 0 : value);
};

const submitEdit = () => {
  if (!props.canEdit) return;
  emit("submit");
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.modelValue"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-bold text-[#4A2A12]">Thông tin chuyến xe</h2>
              <p class="mt-1 text-sm text-gray-500">Xem nhanh thông tin chuyến và chỉ chỉnh sửa khi chuyến đang chờ khởi hành.</p>
            </div>
            <button
              class="rounded p-1.5 transition-colors hover:bg-gray-200"
              title="Đóng"
              @click="closeModal"
            >
              <X :size="20" class="text-gray-600" />
            </button>
          </div>

          <form class="space-y-6" @submit.prevent="submitEdit">
            <div class="grid grid-cols-1 gap-4 rounded-2xl border border-[#EFE7DE] bg-[#FCFAF7] p-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Mã chuyến</p>
                <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ props.tripCode ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Tuyến</p>
                <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ props.routeName ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Loại chuyến</p>
                <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ getTripTypeText(props.tripType) }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Ngày khởi hành</p>
                <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ props.departDate ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Giờ khởi hành</p>
                <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ props.departTime ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Tài xế</p>
                <p class="mt-1 text-sm font-semibold text-[#4A2A12]">{{ props.driverName ?? '—' }}</p>
              </div>
            </div>

            <div
              class="rounded-2xl border px-4 py-3 text-sm"
              :class="props.canEdit ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'"
            >
              {{ props.canEdit
                ? 'Chuyến đang chờ khởi hành. Bạn có thể cập nhật trạng thái và tổng số ghế.'
                : 'Chỉ các chuyến ở trạng thái Chờ khởi hành mới được phép chỉnh sửa.' }}
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  :value="props.status"
                  :disabled="!props.canEdit"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  @change="handleStatusChange"
                >
                  <option value="SCHEDULED">{{ getStatusText("SCHEDULED") }}</option>
                  <option value="ONGOING">{{ getStatusText("ONGOING") }}</option>
                  <option value="COMPLETED">{{ getStatusText("COMPLETED") }}</option>
                  <option value="CANCELLED">{{ getStatusText("CANCELLED") }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tổng số ghế</label>
                <input
                  :value="props.totalSeats"
                  type="number"
                  min="1"
                  :disabled="!props.canEdit"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  @input="handleTotalSeatsInput"
                />
              </div>
            </div>

            <div class="rounded-2xl border border-[#EFE7DE] bg-[#FCFAF7] px-5 py-4">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Số lượng đặt chỗ</p>
                  <p class="mt-1 text-lg font-semibold text-[#4A2A12]">{{ props.bookingCount }} đặt chỗ</p>
                  <p class="mt-1 text-sm text-gray-500">Số ghế trống hiện tại: {{ props.availableSeats }}</p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-[#E8DED2] bg-white px-4 py-2.5 text-sm font-medium text-[#4A2A12] transition-colors hover:bg-[#FAF7F2]"
                  @click="emit('viewBookings')"
                >
                  Xem chi tiết
                  <ChevronRight :size="16" />
                </button>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="h-11 px-5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                @click="closeModal"
              >
                Đóng
              </button>
              <button
                type="submit"
                class="h-11 px-6 bg-[#F2B233] text-white rounded-lg hover:bg-[#E0A020] transition-colors font-medium disabled:opacity-60"
                :disabled="props.loading || !props.canEdit"
              >
                {{ props.loading ? "Đang lưu..." : "Cập nhật" }}
              </button>
            </div>
          </form>
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
