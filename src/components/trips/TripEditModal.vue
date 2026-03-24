<script setup lang="ts">
import type { TripExecutionStatus } from "@/types/models";

interface Props {
  modelValue: boolean;
  loading: boolean;
  status: TripExecutionStatus;
  totalSeats: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:status": [value: TripExecutionStatus];
  "update:totalSeats": [value: number];
  submit: [];
  close: [];
}>();

const closeModal = () => {
  emit("update:modelValue", false);
  emit("close");
};

const getStatusText = (status: TripExecutionStatus): string => {
  switch (status) {
    case "PENDING":
      return "Chờ khởi hành";
    case "RUNNING":
      return "Đang chạy";
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELED":
      return "Đã hủy";
    default:
      return status;
  }
};

const handleStatusChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as TripExecutionStatus;
  emit("update:status", value);
};

const handleTotalSeatsInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value);
  emit("update:totalSeats", Number.isNaN(value) ? 0 : value);
};

const submitEdit = () => {
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
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-[420px]">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-[#4A2A12]">Chỉnh sửa chuyến xe</h2>
            <button
              class="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Đóng"
              @click="closeModal"
            >
              <span class="text-gray-600 text-lg leading-none">&times;</span>
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="submitEdit">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                :value="props.status"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                @change="handleStatusChange"
              >
                <option value="PENDING">{{ getStatusText("PENDING") }}</option>
                <option value="RUNNING">{{ getStatusText("RUNNING") }}</option>
                <option value="COMPLETED">{{ getStatusText("COMPLETED") }}</option>
                <option value="CANCELED">{{ getStatusText("CANCELED") }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tổng số ghế</label>
              <input
                :value="props.totalSeats"
                type="number"
                min="1"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                @input="handleTotalSeatsInput"
              />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="h-11 px-5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                @click="closeModal"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="h-11 px-6 bg-[#F2B233] text-white rounded-lg hover:bg-[#E0A020] transition-colors font-medium disabled:opacity-60"
                :disabled="props.loading"
              >
                {{ props.loading ? "Đang lưu..." : "Lưu" }}
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
