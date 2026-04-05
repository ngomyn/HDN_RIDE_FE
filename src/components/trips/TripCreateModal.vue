<script setup lang="ts">
import { computed, reactive, watch, ref } from "vue";
import type {
  AdminDriver,
  PriceConfig,
  Route,
  TripType,
  VehicleType,
} from "@/types/api";

interface CreatePayload {
  routeId: number;
  driverId: string;
  date: string;
  time: string;
  totalSeats: number;
  availableSeats: number;
  type: TripType;
}

interface Props {
  modelValue: boolean;
  loading: boolean;
  routeOptions: Route[];
  driverOptions: AdminDriver[];
  pricingConfigs: PriceConfig[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: CreatePayload];
}>();
const open = ref(false)

const form = reactive({
  routeId: 0 as number,
  driverId: "",
  date: "",
  time: "",
  totalSeats: 0,
  availableSeats: 0,
  type: "SHARED" as TripType,
});

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const selectedDriver = computed(() => {
  return (
    props.driverOptions.find((driver) => driver.id === form.driverId) ?? null
  );
});

const resolveVehicleTypeFromSeats = (
  seatsTotal?: number | null,
): VehicleType | null => {
  if (seatsTotal === 4) return "SEAT_4";
  if (seatsTotal === 7) return "SEAT_7";
  if (seatsTotal === 9) return "SEAT_9";
  if (seatsTotal === 16) return "SEAT_16";
  return null;
};

const derivedSeatCount = computed(
  () => selectedDriver.value?.vehicle?.seatsTotal ?? 0,
);
const derivedVehicleType = computed(() => {
  return (
    selectedDriver.value?.vehicle?.vehicleType ??
    resolveVehicleTypeFromSeats(selectedDriver.value?.vehicle?.seatsTotal)
  );
});

const availableSeatsMax = computed(() => Math.max(form.totalSeats - 1, 0));

const farePreview = computed(() => {
  if (!form.routeId || !form.type || !form.totalSeats) {
    return {
      text: "Chọn tuyến, tài xế và loại chuyến để xem giá.",
      tone: "muted" as const,
    };
  }

  const config = props.pricingConfigs.find(
    (item) =>
      item.routeId === form.routeId &&
      item.pricingType === form.type &&
      item.vehicleType ===
        (form.type === "PRIVATE" ? derivedVehicleType.value : null),
  );

  if (!config) {
    return {
      text: "Chưa có cấu hình giá phù hợp cho chuyến này.",
      tone: "warning" as const,
    };
  }

  const unit = form.type === "PRIVATE" ? "giá/xe" : "giá/chỗ";

  return {
    text: `${formatCurrency(config.price)} / ${unit}`,
    tone: "ready" as const,
  };
});

const getTodayIsoDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNowTime = (): string => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const closeModal = () => {
  emit("update:modelValue", false);
};

const resetForm = () => {
  form.routeId = props.routeOptions[0]?.id ?? 0;
  form.driverId = "";
  form.date = getTodayIsoDate();
  form.time = getNowTime();
  form.totalSeats = 0;
  form.availableSeats = 0;
  form.type = "SHARED";
};

const selectHour = (h: number) => {
  form.time = `${String(h - 1).padStart(2, "0")}:00`
  open.value = false
}
watch(
  () => form.driverId,
  () => {
    form.totalSeats = derivedSeatCount.value;
    form.availableSeats = availableSeatsMax.value;
  },
);

watch(
  () => form.totalSeats,
  (totalSeats) => {
    if (!totalSeats || totalSeats < 1) {
      form.availableSeats = 0;
      return;
    }

    if (form.availableSeats > availableSeatsMax.value) {
      form.availableSeats = availableSeatsMax.value;
    }

    if (form.availableSeats < 0) {
      form.availableSeats = 0;
    }
  },
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;
    resetForm();
  },
);

const submitCreate = () => {
  if (!form.routeId || !form.driverId || !form.date || !form.time) {
    window.alert("Vui lòng điền đầy đủ thông tin tạo chuyến.");
    return;
  }

  if (!form.totalSeats || form.totalSeats < 1) {
    window.alert("Tài xế chưa có xe hoạt động để suy ra tổng số ghế.");
    return;
  }

  if (
    form.availableSeats < 0 ||
    form.availableSeats > availableSeatsMax.value
  ) {
    window.alert(
      "Số ghế trống phải nằm trong khoảng từ 0 đến tổng số ghế trừ 1.",
    );
    return;
  }

  emit("submit", {
    routeId: form.routeId,
    driverId: form.driverId,
    date: form.date,
    time: form.time,
    totalSeats: Number(form.totalSeats),
    availableSeats: Number(form.availableSeats),
    type: form.type,
  });
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
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-[460px]">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-[#4A2A12]">Thêm chuyến xe</h2>
            <button
              class="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Đóng"
              @click="closeModal"
            >
              <span class="text-gray-600 text-lg leading-none">&times;</span>
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="submitCreate">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Tuyến</label
              >
              <select
                v-model="form.routeId"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
              >
                <option :value="0" disabled>Chọn tuyến</option>
                <option
                  v-for="route in props.routeOptions"
                  :key="route.id"
                  :value="route.id"
                >
                  {{ route.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Loại chuyến</label
              >
              <select
                v-model="form.type"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
              >
                <option value="SHARED">Ghép xe</option>
                <option value="PRIVATE">Bao xe</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Ngày khởi hành</label
                >
                <input
                  v-model="form.date"
                  type="date"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                />
              </div>

              <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Giờ khởi hành
                </label>

                <!-- Trigger -->
                <div
                  @click="open = !open"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  {{ form.time || "Chọn giờ" }}
                  <span>▼</span>
                </div>

                <!-- Dropdown -->
                <div
                  v-if="open"
                  class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  <div
                    v-for="h in 24"
                    :key="h"
                    @click="selectHour(h)"
                    class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {{ String(h - 1).padStart(2, "0") }}:00
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Tài xế</label
              >
              <select
                v-model="form.driverId"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                :disabled="props.driverOptions.length === 0"
              >
                <option value="">
                  {{
                    props.driverOptions.length === 0
                      ? "Chưa có tài xế khả dụng"
                      : "Chọn tài xế"
                  }}
                </option>
                <option
                  v-for="driver in props.driverOptions"
                  :key="driver.id"
                  :value="driver.id"
                >
                  {{ driver.name }} ({{ driver.phone }})
                </option>
              </select>
              <p class="mt-2 text-xs text-gray-500">
                Tổng số ghế sẽ tự lấy theo xe hoạt động của tài xế đã chọn.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Tổng số ghế</label
                >
                <input
                  v-model.number="form.totalSeats"
                  type="number"
                  min="1"
                  disabled
                  class="w-full h-11 px-4 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Số ghế trống</label
                >
                <input
                  v-model.number="form.availableSeats"
                  type="number"
                  min="0"
                  :max="availableSeatsMax"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                />
                <p class="mt-2 text-xs text-gray-500">
                  Tối đa {{ availableSeatsMax }} ghế trống.
                </p>
              </div>
            </div>

            <div class="rounded-2xl border border-[#EFE7DE] bg-[#FCFAF7] p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-gray-400">
                Giá áp dụng
              </p>
              <p
                class="mt-2 text-sm font-semibold"
                :class="
                  farePreview.tone === 'ready'
                    ? 'text-[#4A2A12]'
                    : farePreview.tone === 'warning'
                      ? 'text-amber-600'
                      : 'text-gray-500'
                "
              >
                {{ farePreview.text }}
              </p>
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
                {{ props.loading ? "Đang tạo..." : "Tạo chuyến" }}
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
