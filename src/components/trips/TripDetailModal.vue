<script setup lang="ts">
import type { Trip, TripStatus } from "@/types/api";
import type { TripExecutionStatus } from "@/types/models";
import { formatDateDisplay } from "@/utils/format";

interface Props {
  modelValue: boolean;
  loading: boolean;
  trip: Trip | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
}>();

const closeModal = () => {
  emit("update:modelValue", false);
  emit("close");
};

const normalizeTripStatus = (status: TripStatus | string): TripExecutionStatus => {
  const value = String(status || "").toUpperCase();

  if (value === "PENDING" || value === "SCHEDULED") return "PENDING";
  if (value === "RUNNING" || value === "ONGOING") return "RUNNING";
  if (value === "COMPLETED") return "COMPLETED";
  if (value === "CANCELED" || value === "CANCELLED") return "CANCELED";

  return "PENDING";
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

const getStatusBadgeClass = (status: TripExecutionStatus): string => {
  switch (status) {
    case "PENDING":
      return "bg-orange-100 text-orange-600";
    case "RUNNING":
      return "bg-green-100 text-green-600";
    case "COMPLETED":
      return "bg-blue-100 text-blue-600";
    case "CANCELED":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getDepartTime = (departAt?: string): string => {
  if (!departAt) return "--:--";

  const date = new Date(departAt);
  if (Number.isNaN(date.getTime())) return "--:--";

  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
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
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-[520px]">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-[#4A2A12]">Chi tiết chuyến xe</h2>
            <button
              class="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Đóng"
              @click="closeModal"
            >
              <span class="text-gray-600 text-lg leading-none">&times;</span>
            </button>
          </div>

          <div v-if="props.loading" class="text-sm text-gray-600">
            Đang tải chi tiết...
          </div>
          <div v-else-if="props.trip" class="grid grid-cols-2 gap-3 text-sm">
            <div class="col-span-2 bg-gray-50 rounded p-3">
              <p class="text-gray-500">Tuyến</p>
              <p class="font-semibold text-[#4A2A12]">
                {{ props.trip.route?.name ?? `Tuyến ${props.trip.routeId}` }}
              </p>
            </div>

            <div class="bg-gray-50 rounded p-3">
              <p class="text-gray-500">Ngày</p>
              <p class="font-semibold text-[#4A2A12]">
                {{ props.trip.departAt ? formatDateDisplay(props.trip.departAt) : "--" }}
              </p>
            </div>

            <div class="bg-gray-50 rounded p-3">
              <p class="text-gray-500">Giờ</p>
              <p class="font-semibold text-[#4A2A12]">
                {{ getDepartTime(props.trip.departAt) }}
              </p>
            </div>

            <div class="bg-gray-50 rounded p-3">
              <p class="text-gray-500">Tổng ghế</p>
              <p class="font-semibold text-[#4A2A12]">{{ props.trip.totalSeats ?? "--" }}</p>
            </div>

            <div class="bg-gray-50 rounded p-3">
              <p class="text-gray-500">Ghế trống</p>
              <p class="font-semibold text-[#4A2A12]">{{ props.trip.availableSeats ?? "--" }}</p>
            </div>

            <div class="col-span-2 bg-gray-50 rounded p-3">
              <p class="text-gray-500">Trạng thái</p>
              <span
                :class="[
                  'inline-block px-2 py-1 rounded text-xs font-medium',
                  getStatusBadgeClass(normalizeTripStatus(props.trip.status)),
                ]"
              >
                {{ getStatusText(normalizeTripStatus(props.trip.status)) }}
              </span>
            </div>
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
