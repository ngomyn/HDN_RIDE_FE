<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import districtAPI from "@/services/districtAPI";
import { apiClient } from "@/utils/apiClient";
import type { District, TripType } from "@/types/api";

interface CreatePayload {
  route: string;
  driverId: number;
  fromAddress: string;
  toAddress: string;
  date: string;
  time: string;
  totalSeats: number;
  type: TripType;
}

interface Props {
  modelValue: boolean;
  loading: boolean;
  routeOptions: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: CreatePayload];
}>();

const form = reactive({
  route: "",
  driverId: "",
  district: "",
  ward: "",
  toAddress: "",
  date: "",
  time: "",
  totalSeats: 1,
  type: "SHARED" as TripType,
});

const districtOptions = ref<District[]>([]);
const wardOptions = ref<string[]>([]);
const districtLoading = ref(false);
const wardsLoading = ref(false);
const allDistricts = ref<District[]>([]);
const driverLoading = ref(false);
const driverOptions = ref<Array<{ label: string; value: string }>>([]);

const loadDriverOptions = async () => {
  driverLoading.value = true;
  try {
    const response = await apiClient.getUsers({ role: "DRIVER", page: 1, limit: 200 });
    const items = response.data?.items ?? [];
    driverOptions.value = items.map((driver) => ({
      label: `${driver.name} (${driver.phone})`,
      value: String(driver.id),
    }));
  } catch (_error) {
    driverOptions.value = [];
  } finally {
    driverLoading.value = false;
  }
};

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const routeKey = (route: string): string => {
  const value = normalizeText(route).replace(/\s+/g, "");
  if (value === "dn-hue" || value === "danang->hue") return "dn-hue";
  if (value === "hue-dn" || value === "hue->danang") return "hue-dn";
  return value;
};

const getRouteLabel = (route: string): string => {
  const key = routeKey(route);
  if (key === "dn-hue") return "Đà Nẵng → Huế";
  if (key === "hue-dn") return "Huế → Đà Nẵng";
  return route.replace(/\s*->\s*/g, " → ");
};

const getSourceCityByRoute = (route: string): "danang" | "hue" => {
  return routeKey(route) === "hue-dn" ? "hue" : "danang";
};

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

const getDistrictsByProvinceFallback = (city: "danang" | "hue"): District[] => {
  const provinceKeyword = city === "hue" ? "hue" : "da nang";
  return allDistricts.value.filter((district) =>
    normalizeText(district.province_name).includes(provinceKeyword),
  );
};

const ensureAllDistrictsLoaded = async () => {
  if (allDistricts.value.length > 0) return;

  const result = await districtAPI.getAllDistricts();
  allDistricts.value = result.data ?? [];
};

const mapDistrictNamesToDistrictObjects = (districtNames: string[]): District[] => {
  const districtMap = new Map(
    allDistricts.value.map((district) => [normalizeText(district.name), district]),
  );

  return districtNames
    .map((name) => districtMap.get(normalizeText(name)))
    .filter((district): district is District => Boolean(district));
};

const loadDistrictsForRoute = async (route: string) => {
  districtLoading.value = true;
  form.district = "";
  form.ward = "";
  wardOptions.value = [];

  try {
    const sourceCity = getSourceCityByRoute(route);
    await ensureAllDistrictsLoaded();

    const byCityResult =
      sourceCity === "hue"
        ? await districtAPI.getHueDistricts()
        : await districtAPI.getDaNangDistricts();

    const districtNames = byCityResult.data ?? [];
    const mappedDistricts = mapDistrictNamesToDistrictObjects(districtNames);

    districtOptions.value =
      mappedDistricts.length > 0
        ? mappedDistricts
        : getDistrictsByProvinceFallback(sourceCity);
  } catch (_error) {
    districtOptions.value = [];
  } finally {
    districtLoading.value = false;
  }
};

const loadWardsByDistrictCode = async (districtCode: number) => {
  wardsLoading.value = true;
  form.ward = "";

  try {
    const result = await districtAPI.getDistrictWards(districtCode);
    wardOptions.value = result.data ?? [];
  } catch (_error) {
    wardOptions.value = [];
  } finally {
    wardsLoading.value = false;
  }
};

watch(
  () => form.route,
  async (route) => {
    if (!route) {
      districtOptions.value = [];
      wardOptions.value = [];
      form.district = "";
      form.ward = "";
      return;
    }

    await loadDistrictsForRoute(route);
  },
);

watch(
  () => form.district,
  async (districtCode) => {
    if (!districtCode) {
      wardOptions.value = [];
      form.ward = "";
      return;
    }

    await loadWardsByDistrictCode(Number(districtCode));
  },
);

const selectedDistrict = computed(() =>
  districtOptions.value.find((district) => String(district.code) === form.district),
);

const buildFromAddress = (): string => {
  if (!form.ward) return "";
  if (!selectedDistrict.value) return form.ward;
  return `${form.ward}, ${selectedDistrict.value.name}`;
};

const closeModal = () => {
  emit("update:modelValue", false);
};

const resetForm = () => {
  form.route = props.routeOptions[0] ?? "";
  form.driverId = "";
  form.district = "";
  form.ward = "";
  form.toAddress = "";
  form.date = getTodayIsoDate();
  form.time = getNowTime();
  form.totalSeats = 1;
  form.type = "SHARED";
  districtOptions.value = [];
  wardOptions.value = [];
};

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return;

    resetForm();
    await loadDriverOptions();
  },
);

const submitCreate = () => {
  if (!form.route || !form.driverId || !form.district || !form.ward || !form.toAddress || !form.date || !form.time) {
    window.alert("Vui lòng điền đầy đủ thông tin tạo chuyến.");
    return;
  }

  if (!form.totalSeats || form.totalSeats < 1) {
    window.alert("Tổng số ghế phải lớn hơn 0.");
    return;
  }

  emit("submit", {
    route: form.route,
    driverId: Number(form.driverId),
    fromAddress: buildFromAddress(),
    toAddress: form.toAddress.trim(),
    date: form.date,
    time: form.time,
    totalSeats: Number(form.totalSeats),
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
            <h2 class="text-xl font-bold text-[#4A2A12]">Tạo chuyến</h2>
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Tài xế</label>
              <select
                v-model="form.driverId"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                :disabled="driverLoading || driverOptions.length === 0"
              >
                <option value="">
                  {{ driverLoading ? "Đang tải tài xế..." : "Chọn tài xế" }}
                </option>
                <option
                  v-for="driver in driverOptions"
                  :key="driver.value"
                  :value="driver.value"
                >
                  {{ driver.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tuyến</label>
              <select
                v-model="form.route"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
              >
                <option v-for="route in props.routeOptions" :key="route" :value="route">
                  {{ getRouteLabel(route) }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện đón</label>
              <select
                v-model="form.district"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                :disabled="districtLoading || districtOptions.length === 0"
              >
                <option value="">
                  {{ districtLoading ? "Đang tải quận/huyện..." : "Chọn quận/huyện" }}
                </option>
                <option
                  v-for="district in districtOptions"
                  :key="district.code"
                  :value="String(district.code)"
                >
                  {{ district.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phường/xã đón</label>
              <select
                v-model="form.ward"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                :disabled="!form.district || wardsLoading || wardOptions.length === 0"
              >
                <option value="">
                  {{ wardsLoading ? "Đang tải phường/xã..." : "Chọn phường/xã" }}
                </option>
                <option v-for="ward in wardOptions" :key="ward" :value="ward">
                  {{ ward }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ trả khách</label>
              <input
                v-model="form.toAddress"
                type="text"
                placeholder="Nhập địa chỉ trả khách"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ngày đi</label>
                <input
                  v-model="form.date"
                  type="date"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Giờ đi</label>
                <input
                  v-model="form.time"
                  type="time"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Loại chuyến</label>
                <select
                  v-model="form.type"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                >
                  <option value="SHARED">Ghép chuyến</option>
                  <option value="PRIVATE">Riêng</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tổng số ghế</label>
                <input
                  v-model.number="form.totalSeats"
                  type="number"
                  min="1"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                />
              </div>
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
