<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import Breadcrumb from "@/components/Breadcrumb.vue";
import TripCreateModal from "@/components/trips/TripCreateModal.vue";
import TripDetailModal from "@/components/trips/TripDetailModal.vue";
import TripDuplicateModal from "@/components/trips/TripDuplicateModal.vue";
import TripEditModal from "@/components/trips/TripEditModal.vue";
import { useTripStore } from "@/stores/trips";
import { apiClient } from "@/utils/apiClient";
import type { Route, Trip, TripType } from "@/types/api";
import type { TripExecutionStatus } from "@/types/models";
import { formatDateDisplay } from "@/utils/format";
import {
  Calendar,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
} from "lucide-vue-next";

interface UiTrip {
  id: number;
  route: string;
  routeName: string;
  routeId: number;
  date: string;
  time: string;
  driver: string;
  ward: string;
  price: number;
  status: TripExecutionStatus;
  creator: string;
  availableSeats: number;
}

interface DuplicateTripPayload {
  route: string;
  ward: string;
  date: string;
  time: string;
  price: number;
  driver: string;
  availableSeats: number;
}

interface CreateTripPayload {
  routeId: number;
  driverId: number;
  fromAddress: string;
  toAddress: string;
  date: string;
  time: string;
  totalSeats: number;
  type: TripType;
}

const tripStore = useTripStore();
const { records, loading, error, pagination } = storeToRefs(tripStore);

const routes = ref<Route[]>([]);

const pageSize = 10;
const currentPage = ref(1);

const filterDate = ref("");
const filterRouteId = ref<number | "">("");
const filterDriver = ref("");
const filterCreator = ref("");

const appliedFilters = reactive({
  date: "",
  routeId: "" as number | "",
  driver: "",
  creator: "",
});

const showCreateModal = ref(false);
const createLoading = ref(false);
const showDuplicateModal = ref(false);
const selectedTrip = ref<UiTrip | null>(null);

const showViewModal = ref(false);
const showEditModal = ref(false);
const viewDetailLoading = ref(false);
const actionLoading = ref(false);
const actionError = ref("");
const viewTripDetail = ref<Trip | null>(null);
const editingTripId = ref<number | null>(null);
const editForm = reactive<{
  status: TripExecutionStatus;
  totalSeats: number;
}>({
  status: "PENDING",
  totalSeats: 1,
});

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getRouteBadgeClass = (routeId: number): string =>
  routeId === 1
    ? "bg-[#F2B233]/10 text-[#F2B233]"
    : "bg-[#4A2A12]/10 text-[#4A2A12]";

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

const normalizeTripStatus = (status: string): TripExecutionStatus => {
  const value = String(status || "").toUpperCase();

  if (value === "PENDING" || value === "SCHEDULED") return "PENDING";
  if (value === "RUNNING" || value === "ONGOING") return "RUNNING";
  if (value === "COMPLETED") return "COMPLETED";
  if (value === "CANCELED" || value === "CANCELLED") return "CANCELED";

  return "PENDING";
};

const toApiTripStatus = (status: TripExecutionStatus): string => {
  if (status === "PENDING") return "SCHEDULED";
  if (status === "RUNNING") return "ONGOING";
  if (status === "COMPLETED") return "COMPLETED";
  return "CANCELLED";
};

const toLocalDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toLocalTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const normalizedTrips = computed<UiTrip[]>(() => {
  return records.value?.map((item: any) => {
    const routeName =
      item.route?.name ??
      (item.fromPlace && item.toPlace ? `${item.fromPlace} -> ${item.toPlace}` : "");
    const routeId = Number(item.routeId ?? item.route?.id ?? 0);

    const status: TripExecutionStatus = normalizeTripStatus(item.status);

    const date =
      typeof item.date === "string" && item.date
        ? toLocalDate(item.date)
        : typeof item.departAt === "string" && item.departAt
          ? toLocalDate(item.departAt)
          : "";

    const time =
      typeof item.time === "string" && item.time
        ? item.time.slice(0, 5)
        : typeof item.departAt === "string" && item.departAt
          ? toLocalTime(item.departAt)
          : "--:--";

    return {
      id: Number(item.id ?? 0),
      route: routeName,
      routeName,
      routeId,
      date,
      time,
      driver:
        typeof item.driver === "string" && item.driver
          ? item.driver
          : (item.driver?.name ?? "--"),
      ward: String(item.pickupWard ?? item.fromAddress ?? "--"),
      price: Number(item.price ?? item.tripCost ?? 0),
      status,
      creator: String(
        item.createUser ??
          item.createdBy ??
          item.driver?.name ??
          "Admin hệ thống",
      ),
      availableSeats: Number(item.availableSeats ?? 0),
    };
  });
});

const routeFilterOptions = computed(() => [
  { value: "", label: "Tất cả" },
  ...routes.value.map((route) => ({
    value: route.id,
    label: route.name,
  })),
]);

const drivers = computed(() => {
  return Array.from(
    new Set(normalizedTrips.value.map((trip) => trip.driver)),
  ).filter((driver) => Boolean(driver) && driver !== "--");
});

const findRouteSource = (route: string): string => route;

const filteredTrips = computed(() => normalizedTrips.value);

const totalRecords = computed(() => pagination.value.total ?? 0);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalRecords.value / pageSize)),
);

watch(totalPages, (next) => {
  if (currentPage.value > next) {
    currentPage.value = next;
  }
});

const paginatedTrips = computed(() => {
  return filteredTrips.value;
});

const pageNumbers = computed(() => {
  let start = Math.max(1, currentPage.value - 2);
  let end = Math.min(totalPages.value, start + 4);
  start = Math.max(1, end - 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});

const resultFrom = computed(() => {
  if (totalRecords.value === 0) return 0;
  return (currentPage.value - 1) * pageSize + 1;
});

const resultTo = computed(() => {
  if (totalRecords.value === 0) return 0;
  return Math.min(
    (currentPage.value - 1) * pageSize + paginatedTrips.value.length,
    totalRecords.value,
  );
});

const todayDateKey = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

const todayTrips = computed(() => {
  return filteredTrips.value.filter((trip) => trip.date === todayDateKey.value);
});

const todayPendingCount = computed(
  () => todayTrips.value.filter((trip) => trip.status === "PENDING").length,
);

const todayRunningCount = computed(
  () => todayTrips.value.filter((trip) => trip.status === "RUNNING").length,
);

const todayCanceledCount = computed(
  () => todayTrips.value.filter((trip) => trip.status === "CANCELED").length,
);

const todayCompletedCount = computed(
  () => todayTrips.value.filter((trip) => trip.status === "COMPLETED").length,
);

const toSearchDateStart = (date: string): string => `${date}T00:00:00`;
const toSearchDateEnd = (date: string): string => `${date}T23:59:59`;

const buildSearchParams = (
  page: number,
  routeId: number | "",
  date: string,
  driver: string,
  creator: string,
) => {
  return {
    page,
    limit: pageSize,
    routeId: routeId !== "" ? routeId : undefined,
    startDate: date ? toSearchDateStart(date) : undefined,
    endDate: date ? toSearchDateEnd(date) : undefined,
    driver: driver || undefined,
    createUser: creator || undefined,
  };
};

const handleSearch = async () => {
  appliedFilters.date = filterDate.value;
  appliedFilters.routeId = filterRouteId.value;
  appliedFilters.driver = filterDriver.value;
  appliedFilters.creator = filterCreator.value;
  currentPage.value = 1;

  await tripStore.fetchTrips(
    buildSearchParams(
      1,
      appliedFilters.routeId,
      appliedFilters.date,
      appliedFilters.driver,
      appliedFilters.creator,
    ),
  );
};

const handleReset = async () => {
  filterDate.value = "";
  filterRouteId.value = "";
  filterDriver.value = "";
  filterCreator.value = "";
  await handleSearch();
};

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return;

  currentPage.value = page;
  await tripStore.fetchTrips(
    buildSearchParams(
      page,
      appliedFilters.routeId,
      appliedFilters.date,
      appliedFilters.driver,
      appliedFilters.creator,
    ),
  );
};

const fetchTripDetail = async (tripId: number): Promise<Trip | null> => {
  viewDetailLoading.value = true;
  actionError.value = "";

  try {
    const response = await apiClient.getTripDetail(tripId);
    return response.data ?? null;
  } catch (err: any) {
    actionError.value = err.message || "Không thể tải chi tiết chuyến xe.";
    return null;
  } finally {
    viewDetailLoading.value = false;
  }
};

const refreshCurrentPage = async () => {
  const safePage = Math.min(currentPage.value, totalPages.value);
  currentPage.value = safePage;
  await tripStore.fetchTrips(
    buildSearchParams(
      safePage,
      appliedFilters.routeId,
      appliedFilters.date,
      appliedFilters.driver,
      appliedFilters.creator,
    ),
  );
};

const toDepartAtIso = (date: string, time: string): string => {
  const departAt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(departAt.getTime())) {
    throw new Error("Thời gian khởi hành không hợp lệ.");
  }
  return departAt.toISOString();
};

const handleCreateClick = () => {
  showCreateModal.value = true;
};

const handleCreateSubmit = async (payload: CreateTripPayload) => {
  createLoading.value = true;
  actionError.value = "";

  try {
    await apiClient.createTrip({
      driverId: payload.driverId,
      routeId: payload.routeId,
      departAt: toDepartAtIso(payload.date, payload.time),
      type: payload.type,
      totalSeats: Number(payload.totalSeats),
    });

    showCreateModal.value = false;
    await refreshCurrentPage();
  } catch (err: any) {
    actionError.value = err.message || "Tạo chuyến thất bại.";
    window.alert(actionError.value);
  } finally {
    createLoading.value = false;
  }
};

const handleDeleteClick = async (trip: UiTrip) => {
  const accepted = window.confirm(`Bạn có chắc muốn xóa chuyến #${trip.id}?`);
  if (!accepted) return;

  await tripStore.deleteTrip(trip.id);
  await refreshCurrentPage();
};

const handleViewClick = async (trip: UiTrip) => {
  const detail = await fetchTripDetail(trip.id);
  if (!detail) {
    window.alert(actionError.value || "Không thể tải chi tiết chuyến xe.");
    return;
  }

  viewTripDetail.value = detail;
  showViewModal.value = true;
};

const handleEditClick = async (trip: UiTrip) => {
  const detail = await fetchTripDetail(trip.id);
  if (!detail) {
    window.alert(actionError.value || "Không thể tải dữ liệu chỉnh sửa.");
    return;
  }

  editingTripId.value = trip.id;
  editForm.status = normalizeTripStatus(detail.status);
  editForm.totalSeats = Number(detail.totalSeats ?? 1);
  showEditModal.value = true;
};

const handleEditSubmit = async () => {
  if (!editingTripId.value) return;

  if (!editForm.totalSeats || editForm.totalSeats < 1) {
    window.alert("Tổng số ghế phải lớn hơn 0.");
    return;
  }

  actionLoading.value = true;
  actionError.value = "";

  try {
    await apiClient.updateTrip(editingTripId.value, {
      status: toApiTripStatus(editForm.status),
      totalSeats: Number(editForm.totalSeats),
    });

    showEditModal.value = false;
    editingTripId.value = null;
    await refreshCurrentPage();
  } catch (err: any) {
    actionError.value = err.message || "Cập nhật chuyến xe thất bại.";
    window.alert(actionError.value);
  } finally {
    actionLoading.value = false;
  }
};

const handleCloseViewModal = () => {
  showViewModal.value = false;
  viewTripDetail.value = null;
  actionError.value = "";
};

const handleCloseEditModal = () => {
  showEditModal.value = false;
  editingTripId.value = null;
  actionError.value = "";
};

const handleDuplicateClick = (trip: UiTrip) => {
  selectedTrip.value = trip;
  showDuplicateModal.value = true;
};

const handleDuplicateSubmit = (payload: DuplicateTripPayload) => {
  if (!selectedTrip.value) return;

  const maxId = normalizedTrips.value.reduce(
    (max, trip) => Math.max(max, trip.id),
    0,
  );
  tripStore.addLocalTrip({
    id: maxId + 1,
    route: findRouteSource(payload.route),
    date: payload.date,
    time: payload.time,
    driver: payload.driver,
    pickupWard: payload.ward,
    price: payload.price,
    status: "PENDING",
    createdBy: "Admin sao chép",
    availableSeats: payload.availableSeats,
  });

  showDuplicateModal.value = false;
  selectedTrip.value = null;
};

watch(showDuplicateModal, (isOpen) => {
  if (!isOpen) {
    selectedTrip.value = null;
  }
});

onMounted(async () => {
  try {
    const routeResponse = await apiClient.getRoutes();
    routes.value = routeResponse.data ?? [];
  } catch (_err) {
    routes.value = [];
  }
  await handleSearch();
});
</script>

<template>
  <div class="">
    <Breadcrumb :items="['Trang chủ', 'Quản lý chuyến xe']" />

    <h1 class="text-2xl font-bold text-[#4A2A12] my-5">Quản lý chuyến xe</h1>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-600 mb-1">Chờ khởi hành</p>
        <p class="text-2xl font-bold text-orange-600">{{ todayPendingCount }}</p>
        <p class="text-xs text-gray-500 mt-1">Hôm nay</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-600 mb-1">Đang chạy</p>
        <p class="text-2xl font-bold text-green-600">{{ todayRunningCount }}</p>
        <p class="text-xs text-gray-500 mt-1">Hôm nay</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-600 mb-1">Đã hủy</p>
        <p class="text-2xl font-bold text-red-600">{{ todayCanceledCount }}</p>
        <p class="text-xs text-gray-500 mt-1">Hôm nay</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-600 mb-1">Hoàn thành</p>
        <p class="text-2xl font-bold text-blue-600">{{ todayCompletedCount }}</p>
        <p class="text-xs text-gray-500 mt-1">Hôm nay</p>
      </div>
    </div>

    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5"
    >
      {{ error }}
    </div>

    <div class="bg-white rounded-xl shadow-sm p-5 mb-5">
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative">
          <Calendar
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            :size="18"
          />
          <input
            v-model="filterDate"
            type="date"
            class="w-[200px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
          />
        </div>

        <select
          v-model="filterRouteId"
          class="w-[220px] h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
        >
          <option
            v-for="option in routeFilterOptions"
            :key="String(option.value)"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            :size="18"
          />
          <input
            v-model="filterDriver"
            type="text"
            placeholder="Tìm theo tên tài xế"
            class="w-[200px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
          />
        </div>

        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            :size="18"
          />
          <input
            v-model="filterCreator"
            type="text"
            placeholder="Tìm theo admin tạo"
            class="w-[200px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
          />
        </div>

        <button
          class="h-11 px-6 bg-[#F2B233] text-white rounded-lg hover:bg-[#E0A020] transition-colors font-medium flex items-center gap-2 disabled:opacity-60"
          :disabled="loading"
          @click="handleSearch"
        >
          <Search :size="18" />
          Tìm kiếm
        </button>

        <button
          class="h-11 px-5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          @click="handleReset"
        >
          Đặt lại
        </button>

        <button
          class="h-11 px-6 bg-[#4A2A12] text-white rounded-lg hover:bg-[#3B210E] transition-colors font-medium flex items-center gap-2"
          @click="handleCreateClick"
        >
          <Plus :size="18" />
          Tạo chuyến
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1120px]">
          <thead>
            <tr class="bg-[#4A2A12] text-white text-sm">
              <th class="text-left py-3 px-4 font-semibold w-[60px]">STT</th>
              <th class="text-left py-3 px-4 font-semibold w-[180px]">Tuyến</th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">Ngày</th>
              <th class="text-left py-3 px-4 font-semibold w-[80px]">Giờ</th>
              <th class="text-left py-3 px-4 font-semibold w-[150px]">
                Tài xế
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[160px]">
                Phường đón
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">
                Giá vé
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">
                Trạng thái
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">
                Người tạo
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[110px]">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="py-6 px-4 text-center text-gray-500" colspan="10">
                Đang tải dữ liệu...
              </td>
            </tr>
            <tr v-else-if="paginatedTrips.length === 0">
              <td class="py-6 px-4 text-center text-gray-500" colspan="10">
                Không có chuyến xe phù hợp bộ lọc.
              </td>
            </tr>
            <tr
              v-for="(trip, index) in paginatedTrips"
              v-else
              :key="trip.id"
              :class="index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'"
            >
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'inline-block px-2 py-1 rounded text-xs font-medium',
                    getRouteBadgeClass(trip.routeId),
                  ]"
                >
                  {{ trip.routeName }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ formatDateDisplay(trip.date) }}
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ trip.time }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ trip.driver }}
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ trip.ward }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ trip.price.toLocaleString("vi-VN") }} ₫
              </td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'inline-block px-2 py-1 rounded text-xs font-medium',
                    getStatusBadgeClass(trip.status),
                  ]"
                >
                  {{ getStatusText(trip.status) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ trip.creator }}
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Xem"
                    @click="handleViewClick(trip)"
                  >
                    <Eye :size="16" class="text-blue-600" />
                  </button>
                  <button
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Sửa"
                    @click="handleEditClick(trip)"
                  >
                    <Edit :size="16" class="text-orange-600" />
                  </button>
                  <button
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Xóa"
                    @click="handleDeleteClick(trip)"
                  >
                    <Trash2 :size="16" class="text-red-600" />
                  </button>
                  <button
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Sao chép"
                    @click="handleDuplicateClick(trip)"
                  >
                    <Copy :size="16" class="text-gray-600" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200"
      >
        <div class="text-sm text-gray-600">
          Hiển thị {{ resultFrom }}-{{ resultTo }} của {{ totalRecords }} kết
          quả
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

    <TripDetailModal
      v-model="showViewModal"
      :loading="viewDetailLoading"
      :trip="viewTripDetail"
      @close="handleCloseViewModal"
    />

    <TripEditModal
      v-model="showEditModal"
      :loading="actionLoading"
      :status="editForm.status"
      :total-seats="editForm.totalSeats"
      @update:status="editForm.status = $event"
      @update:total-seats="editForm.totalSeats = $event"
      @submit="handleEditSubmit"
      @close="handleCloseEditModal"
    />

    <TripCreateModal
      v-model="showCreateModal"
      :loading="createLoading"
      :route-options="routes"
      @submit="handleCreateSubmit"
    />

    <TripDuplicateModal
      v-model="showDuplicateModal"
      :trip="selectedTrip"
      :route-options="routes"
      :drivers="drivers"
      @submit="handleDuplicateSubmit"
    />
  </div>
</template>
