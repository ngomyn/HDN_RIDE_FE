<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import districtAPI from "@/services/districtAPI";
import type { District, Route } from "@/types/api";

interface TripSummary {
  id: string;
  route: string;
  time: string;
  price: number;
  driver: string;
  availableSeats: number;
}

interface DuplicatePayload {
  route: string;
  ward: string;
  date: string;
  time: string;
  price: number;
  driver: string;
  availableSeats: number;
}

interface Props {
  modelValue: boolean;
  trip: TripSummary | null;
  routeOptions: Route[];
  drivers: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: DuplicatePayload];
}>();

const form = reactive({
  route: "",
  district: "",
  ward: "",
  date: "",
  time: "",
  price: "",
  driver: "",
});

const districtOptions = ref<District[]>([]);
const wardOptions = ref<string[]>([]);
const districtLoading = ref(false);
const wardsLoading = ref(false);
const allDistricts = ref<District[]>([]);

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getSourceCityByRouteName = (routeName: string): "danang" | "hue" => {
  const normalized = normalizeText(routeName);
  if (normalized.includes("hue") && normalized.startsWith("hue")) return "hue";
  return "danang";
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
    const sourceCity = getSourceCityByRouteName(route);
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

const closeModal = () => {
  emit("update:modelValue", false);
};

const getTodayIsoDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parsePrice = (value: string): number => {
  const numeric = value.replace(/[^\d]/g, "");
  return Number(numeric || 0);
};

const initForm = () => {
  if (!props.trip) return;

  const matchedRoute = props.routeOptions.find((r) => r.name === props.trip!.route)
    ?? props.routeOptions[0];
  form.route = matchedRoute?.name ?? props.trip.route;
  form.district = "";
  form.ward = "";
  form.date = "";
  form.time = props.trip.time;
  form.price = String(props.trip.price);
  form.driver = props.trip.driver;
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      initForm();
    }
  },
);

const submitDuplicate = () => {
  if (!props.trip) return;

  if (!form.route || !form.district || !form.ward || !form.driver) {
    window.alert("Vui lòng điền đầy đủ tuyến, quận/huyện, phường đón và tài xế.");
    return;
  }

  emit("submit", {
    route: form.route,
    ward: form.ward,
    date: form.date || getTodayIsoDate(),
    time: form.time || props.trip.time,
    price: parsePrice(form.price),
    driver: form.driver,
    availableSeats: props.trip.availableSeats,
  });

  closeModal();
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.modelValue && props.trip"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-[420px]">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-[#4A2A12]">Sao chép chuyến xe</h2>
            <button
              class="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Đóng"
              @click="closeModal"
            >
              <span class="text-gray-600 text-lg leading-none">&times;</span>
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="submitDuplicate">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tuyến</label>
              <select
                v-model="form.route"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
              >
                <option v-for="route in props.routeOptions" :key="route.id" :value="route.name">
                  {{ route.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Phường đón</label>
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
              <input
                v-model="form.date"
                type="date"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Giờ</label>
              <input
                v-model="form.time"
                type="time"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Giá vé</label>
              <input
                v-model="form.price"
                type="text"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tài xế</label>
              <select
                v-model="form.driver"
                class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
              >
                <option v-for="driver in props.drivers" :key="driver" :value="driver">
                  {{ driver }}
                </option>
              </select>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                class="h-11 px-6 bg-[#F2B233] text-white rounded-lg hover:bg-[#E0A020] transition-colors font-medium"
              >
                Xác nhận
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
