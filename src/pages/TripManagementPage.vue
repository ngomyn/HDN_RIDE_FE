<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import Breadcrumb from "@/components/Breadcrumb.vue";
import TripCreateModal from "@/components/trips/TripCreateModal.vue";
import TripEditModal from "@/components/trips/TripEditModal.vue";
import TripBookingsModal from "@/components/trips/TripBookingsModal.vue";
import TripBookingRemoveConfirmModal from "@/components/trips/TripBookingRemoveConfirmModal.vue";
import TripDeleteConfirmModal from "@/components/trips/TripDeleteConfirmModal.vue";
import TextInput from "@/components/ui/TextInput.vue";
import SelectInput from "@/components/ui/SelectInput.vue";
import { useBookingStore } from "@/stores/bookings";
import { useTripStore } from "@/stores/trips";
import { apiClient } from "@/utils/apiClient";
import type {
  AdminDriver,
  Booking,
  DriverType,
  PriceConfig,
  Route,
  TripSearchQuery,
  TripStatus,
  TripType,
  VehicleType,
} from "@/types/api";
import {
  formatCurrency,
  formatDateDisplay,
  getRouteBadgeClass,
  getTripTypeBadgeClass,
  getTripTypeText,
} from "@/utils/format";
import {
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock3,
  PlayCircle,
  XCircle,
  CheckCircle2,
  Route as RouteIcon,
  Filter,
  RefreshCw,
} from "lucide-vue-next";

interface UiTrip {
  id: string;
  routeName: string;
  routeId: number;
  route?: Route;
  tripCode: string;
  type: TripType;
  date: string;
  time: string;
  driver: string;
  driverId: string;
  driverType: DriverType;
  fareLabel: string;
  fareValue: number | null;
  fareUnit: string | null;
  status: TripStatus;
  creator: string;
  availableSeats: number;
  totalSeats: number;
  canEdit: boolean;
  canDelete: boolean;
}

interface CreateTripPayload {
  routeId: number;
  driverId: string;
  date: string;
  time: string;
  totalSeats: number;
  availableSeats: number;
  type: TripType;
}

const tripStore = useTripStore();
const bookingStore = useBookingStore();
const { records, loading, error, pagination } = storeToRefs(tripStore);

const routes = ref<Route[]>([]);
const drivers = ref<AdminDriver[]>([]);
const pricingConfigs = ref<PriceConfig[]>([]);

const pageSize = 10;
const currentPage = ref(1);

const filterRouteId = ref("");
const filterType = ref("");
const filterSeatFrom = ref("");
const filterSeatTo = ref("");
const filterDepartFrom = ref("");
const filterDepartTo = ref("");
const filterTripCostFrom = ref("");
const filterTripCostTo = ref("");
const filterStatus = ref("");
const filterDriver = ref("");
const filterCreator = ref("");

const appliedFilters = reactive({
  routeId: "",
  type: "",
  seatFrom: "",
  seatTo: "",
  departFrom: "",
  departTo: "",
  tripCostFrom: "",
  tripCostTo: "",
  status: "",
  driver: "",
  creator: "",
});

const showCreateModal = ref(false);
const createLoading = ref(false);
const showEditModal = ref(false);
const showBookingsModal = ref(false);
const showDeleteModal = ref(false);
const showBookingRemoveModal = ref(false);
const actionLoading = ref(false);
const removingBookingId = ref<string | null>(null);
const actionError = ref("");
const actionSuccess = ref("");
const selectedTrip = ref<UiTrip | null>(null);
const selectedTripBookings = ref<Booking[]>([]);
const tripPendingDelete = ref<UiTrip | null>(null);
const bookingPendingRemove = ref<Booking | null>(null);
const editingTripId = ref<string | null>(null);
const editForm = reactive<{
  status: TripStatus;
  totalSeats: number;
}>({
  status: "SCHEDULED",
  totalSeats: 1,
});

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

const getStatusBadgeClass = (status: TripStatus): string => {
  switch (status) {
    case "SCHEDULED":
      return "bg-orange-100 text-orange-600";
    case "ONGOING":
      return "bg-green-100 text-green-600";
    case "COMPLETED":
      return "bg-blue-100 text-blue-600";
    case "CANCELLED":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const normalizeTripStatus = (status: string): TripStatus => {
  const value = String(status || "").toUpperCase();

  if (value === "PENDING" || value === "SCHEDULED") return "SCHEDULED";
  if (value === "RUNNING" || value === "ONGOING") return "ONGOING";
  if (value === "COMPLETED") return "COMPLETED";
  if (value === "CANCELED" || value === "CANCELLED") return "CANCELLED";

  return "SCHEDULED";
};

const toTripType = (value: string): TripType | undefined => {
  return value === "SHARED" || value === "PRIVATE" ? value : undefined;
};

const toTripStatusFilter = (value: string): TripStatus | undefined => {
  if (!value) return undefined;
  return normalizeTripStatus(value);
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

const driverMap = computed(() => {
  const map = new Map<string, AdminDriver>();
  for (const driver of drivers.value) {
    map.set(driver.id, driver);
  }
  return map;
});

const resolveTripDriverType = (item: any): DriverType => {
  const detailType = item.driver?.driverType as DriverType | undefined | null;
  const mappedType = driverMap.value.get(
    String(item.driverId ?? item.driver?.id ?? ""),
  )?.driverType;
  return detailType ?? mappedType ?? "COMPANY";
};

const resolveVehicleTypeFromSeats = (
  seatsTotal?: number | null,
): VehicleType | null => {
  if (seatsTotal === 4) return "SEAT_4";
  if (seatsTotal === 7) return "SEAT_7";
  if (seatsTotal === 9) return "SEAT_9";
  if (seatsTotal === 16) return "SEAT_16";
  return null;
};

const resolveTripVehicleType = (item: any): VehicleType | null => {
  return (
    (item.vehicleType as VehicleType | null | undefined) ??
    (item.driver?.vehicle?.vehicleType as VehicleType | null | undefined) ??
    (driverMap.value.get(String(item.driverId ?? item.driver?.id ?? ""))
      ?.vehicle?.vehicleType as VehicleType | null | undefined) ??
    resolveVehicleTypeFromSeats(resolveTripSeatCount(item))
  );
};

const resolveTripSeatCount = (item: any): number => {
  const tripSeats = Number(item.totalSeats ?? 0);
  if (tripSeats > 0) return tripSeats;

  const vehicleSeats = Number(
    item.driver?.vehicle?.seatsTotal ??
      driverMap.value.get(String(item.driverId ?? item.driver?.id ?? ""))
        ?.vehicle?.seatsTotal ??
      0,
  );

  return vehicleSeats;
};

const resolveTripFare = (item: any) => {
  const lockedPrice = Number(item.tripCost ?? 0);
  const type = (item.type as TripType) ?? "SHARED";

  if (lockedPrice > 0) {
    return {
      amount: lockedPrice,
      label: formatCurrency(lockedPrice),
      unit: type === "PRIVATE" ? "giá/xe" : "giá/chỗ",
    };
  }

  const routeId = Number(item.routeId ?? item.route?.id ?? 0);
  const vehicleType = resolveTripVehicleType(item);
  const config = pricingConfigs.value.find(
    (price) =>
      price.routeId === routeId &&
      price.pricingType === type &&
      price.vehicleType === (type === "PRIVATE" ? vehicleType : null),
  );

  if (!config) {
    return {
      amount: null,
      label: "Chưa cấu hình giá",
      unit: null,
    };
  }

  return {
    amount: config.price,
    label: formatCurrency(config.price),
    unit: type === "PRIVATE" ? "giá/xe" : "giá/chỗ",
  };
};

const normalizedTrips = computed<UiTrip[]>(() => {
  return records.value?.map((item: any) => {
    const routeName =
      item.route?.name ??
      (item.fromPlace && item.toPlace
        ? `${item.fromPlace} -> ${item.toPlace}`
        : "");
    const routeId = Number(item.routeId ?? item.route?.id ?? 0);

    const status: TripStatus = normalizeTripStatus(item.status);

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

    const fare = resolveTripFare(item);
    const driverId = String(item.driverId ?? item.driver?.id ?? "");

    return {
      id: String(item.id ?? ""),
      routeName,
      routeId,
      route: item.route as Route | undefined,
      tripCode: String(item.tripCode ?? item.id ?? ""),
      type: (item.type as TripType) ?? "SHARED",
      date,
      time,
      driver:
        typeof item.driver === "string" && item.driver
          ? item.driver
          : (item.driver?.name ?? "--"),
      driverId,
      driverType: resolveTripDriverType(item),
      fareLabel: fare.label,
      fareValue: fare.amount,
      fareUnit: fare.unit,
      status,
      creator: String(
        item.createUser ??
          item.createdBy ??
          item.driver?.name ??
          "Admin hệ thống",
      ),
      availableSeats: Number(item.availableSeats ?? 0),
      totalSeats: resolveTripSeatCount(item),
      canEdit: status === "SCHEDULED",
      canDelete: status === "SCHEDULED",
    };
  });
});

const routeFilterOptions = computed(() => [
  { value: "", label: "Tất cả" },
  ...routes.value.map((route) => ({
    value: String(route.id),
    label: route.name,
  })),
]);

const typeFilterOptions = [
  { value: "", label: "Tất cả" },
  { value: "SHARED", label: "Ghép xe" },
  { value: "PRIVATE", label: "Bao xe" },
];

const statusFilterOptions = [
  { value: "", label: "Tất cả" },
  { value: "SCHEDULED", label: "Chờ khởi hành" },
  { value: "ONGOING", label: "Đang chạy" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

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

watch(showDeleteModal, (isOpen) => {
  if (!isOpen && !actionLoading.value) {
    tripPendingDelete.value = null;
  }
});

watch(showBookingRemoveModal, (isOpen) => {
  if (!isOpen && !removingBookingId.value) {
    bookingPendingRemove.value = null;
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
  () => todayTrips.value.filter((trip) => trip.status === "SCHEDULED").length,
);

const todayRunningCount = computed(
  () => todayTrips.value.filter((trip) => trip.status === "ONGOING").length,
);

const todayCanceledCount = computed(
  () => todayTrips.value.filter((trip) => trip.status === "CANCELLED").length,
);

const todayCompletedCount = computed(
  () => todayTrips.value.filter((trip) => trip.status === "COMPLETED").length,
);

const tripSummaryCards = computed(() => [
  {
    id: "pending",
    title: "Chờ khởi hành",
    value: todayPendingCount.value,
    caption: "Chuyến chuẩn bị xuất bến hôm nay",
    icon: Clock3,
    iconClass: "bg-orange-100 text-orange-600",
    valueClass: "text-orange-600",
  },
  {
    id: "running",
    title: "Đang chạy",
    value: todayRunningCount.value,
    caption: "Đang phục vụ khách trên tuyến",
    icon: PlayCircle,
    iconClass: "bg-green-100 text-green-600",
    valueClass: "text-green-600",
  },
  {
    id: "canceled",
    title: "Đã hủy",
    value: todayCanceledCount.value,
    caption: "Lịch chạy không thể thực hiện",
    icon: XCircle,
    iconClass: "bg-red-100 text-red-600",
    valueClass: "text-red-600",
  },
  {
    id: "completed",
    title: "Hoàn thành",
    value: todayCompletedCount.value,
    caption: "Chuyến đã kết thúc trong ngày",
    icon: CheckCircle2,
    iconClass: "bg-blue-100 text-blue-600",
    valueClass: "text-blue-600",
  },
]);

const selectedRouteLabel = computed(() => {
  if (filterRouteId.value === "") return "Tất cả tuyến";
  return (
    routes.value.find((route) => route.id === Number(filterRouteId.value))
      ?.name ?? "Tất cả tuyến"
  );
});

const toSearchDateStart = (date: string): string => `${date}T00:00:00`;
const toSearchDateEnd = (date: string): string => `${date}T23:59:59`;

const toNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildSearchParams = (
  page: number,
  filters: typeof appliedFilters,
): TripSearchQuery => {
  return {
    page,
    limit: pageSize,
    routeId: toNumber(filters.routeId),
    type: toTripType(filters.type),
    startDate: filters.departFrom
      ? toSearchDateStart(filters.departFrom)
      : undefined,
    endDate: filters.departTo ? toSearchDateEnd(filters.departTo) : undefined,
    seatFrom: toNumber(filters.seatFrom),
    seatTo: toNumber(filters.seatTo),
    tripCostFrom: toNumber(filters.tripCostFrom),
    tripCostTo: toNumber(filters.tripCostTo),
    status: toTripStatusFilter(filters.status),
    driver: filters.driver || undefined,
    createUser: filters.creator || undefined,
  };
};

const handleSearch = async () => {
  appliedFilters.routeId = filterRouteId.value;
  appliedFilters.type = filterType.value;
  appliedFilters.seatFrom = filterSeatFrom.value;
  appliedFilters.seatTo = filterSeatTo.value;
  appliedFilters.departFrom = filterDepartFrom.value;
  appliedFilters.departTo = filterDepartTo.value;
  appliedFilters.tripCostFrom = filterTripCostFrom.value;
  appliedFilters.tripCostTo = filterTripCostTo.value;
  appliedFilters.status = filterStatus.value;
  appliedFilters.driver = filterDriver.value;
  appliedFilters.creator = filterCreator.value;
  currentPage.value = 1;

  await tripStore.fetchTrips(buildSearchParams(1, appliedFilters));
};

const handleReset = async () => {
  filterRouteId.value = "";
  filterType.value = "";
  filterSeatFrom.value = "";
  filterSeatTo.value = "";
  filterDepartFrom.value = "";
  filterDepartTo.value = "";
  filterTripCostFrom.value = "";
  filterTripCostTo.value = "";
  filterStatus.value = "";
  filterDriver.value = "";
  filterCreator.value = "";
  await handleSearch();
};

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return;

  currentPage.value = page;
  await tripStore.fetchTrips(buildSearchParams(page, appliedFilters));
};

const refreshCurrentPage = async () => {
  const safePage = Math.min(currentPage.value, totalPages.value);
  currentPage.value = safePage;
  await tripStore.fetchTrips(buildSearchParams(safePage, appliedFilters));
};

const toDepartAtIso = (date: string, time: string): string => {
  const departAt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(departAt.getTime())) {
    throw new Error("Thời gian khởi hành không hợp lệ.");
  }
  return departAt.toISOString();
};

const loadPricingConfigs = async (routeItems: Route[]) => {
  const configResponses = await Promise.all(
    routeItems.map(async (route) => {
      try {
        const response = await apiClient.getPricingConfigs(route.id);
        return response.data ?? [];
      } catch (_error) {
        return [] as PriceConfig[];
      }
    }),
  );

  pricingConfigs.value = configResponses.flat();
};

const loadDriverOptions = async () => {
  const response = await apiClient.getAdminDrivers({ page: 1, limit: 200 });
  drivers.value = response.data?.items ?? [];
};

const handleCreateClick = () => {
  actionError.value = "";
  actionSuccess.value = "";
  showCreateModal.value = true;
};

const handleCreateSubmit = async (payload: CreateTripPayload) => {
  createLoading.value = true;
  actionError.value = "";
  actionSuccess.value = "";

  try {
    await apiClient.createTrip({
      driverId: payload.driverId,
      routeId: payload.routeId,
      departAt: toDepartAtIso(payload.date, payload.time),
      type: payload.type,
      totalSeats: Number(payload.totalSeats),
      availableSeats: Number(payload.availableSeats),
    });

    showCreateModal.value = false;
    actionSuccess.value = "Tạo chuyến thành công.";
    await refreshCurrentPage();
  } catch (err: any) {
    actionError.value = err.message || "Tạo chuyến thất bại.";
  } finally {
    createLoading.value = false;
  }
};

const handleDeleteClick = async (trip: UiTrip) => {
  if (!trip.canDelete) return;
  tripPendingDelete.value = trip;
  showDeleteModal.value = true;
};

const handleConfirmDelete = async () => {
  if (!tripPendingDelete.value) return;

  actionLoading.value = true;
  actionError.value = "";
  actionSuccess.value = "";

  try {
    await tripStore.deleteTrip(tripPendingDelete.value.id);
    showDeleteModal.value = false;
    tripPendingDelete.value = null;
    actionSuccess.value = "Xóa chuyến thành công.";
    await refreshCurrentPage();
  } catch (err: any) {
    actionError.value = err.message || "Xóa chuyến thất bại.";
  } finally {
    actionLoading.value = false;
  }
};

const handleEditClick = async (trip: UiTrip) => {
  actionLoading.value = true;
  actionError.value = "";
  actionSuccess.value = "";

  try {
    const [tripResponse, bookingsResponse] = await Promise.all([
      apiClient.getTripDetail(trip.id),
      apiClient.getTripBookings(trip.id),
    ]);

    const detail = tripResponse.data;
    if (!detail) {
      throw new Error("Không thể tải dữ liệu chỉnh sửa.");
    }

    editingTripId.value = trip.id;
    selectedTrip.value = {
      ...trip,
      tripCode: detail.tripCode ?? trip.tripCode,
      type: (detail.type as TripType) ?? trip.type,
      totalSeats: resolveTripSeatCount(detail),
      availableSeats: Number(detail.availableSeats ?? trip.availableSeats),
      driver: detail.driver?.name ?? trip.driver,
      driverType: resolveTripDriverType(detail),
      fareLabel: resolveTripFare(detail).label,
      fareValue: resolveTripFare(detail).amount,
      fareUnit: resolveTripFare(detail).unit,
      canEdit: normalizeTripStatus(detail.status) === "SCHEDULED",
      canDelete: normalizeTripStatus(detail.status) === "SCHEDULED",
    };
    selectedTripBookings.value = bookingsResponse.data ?? [];
    editForm.status = normalizeTripStatus(detail.status);
    editForm.totalSeats = resolveTripSeatCount(detail);
    showEditModal.value = true;
  } catch (err: any) {
    actionError.value = err.message || "Không thể tải dữ liệu chỉnh sửa.";
  } finally {
    actionLoading.value = false;
  }
};

const handleEditSubmit = async () => {
  if (!editingTripId.value) return;
  if (!selectedTrip.value?.canEdit) return;

  if (!editForm.totalSeats || editForm.totalSeats < 1) {
    actionError.value = "Tổng số ghế phải lớn hơn 0.";
    actionSuccess.value = "";
    return;
  }

  const bookedSeats = selectedTripBookings.value.reduce(
    (sum, booking) => sum + booking.numberOfPassengers,
    0,
  );

  if (editForm.totalSeats < bookedSeats) {
    actionError.value = "Tổng số ghế không được nhỏ hơn số ghế đã đặt.";
    actionSuccess.value = "";
    return;
  }

  actionLoading.value = true;
  actionError.value = "";
  actionSuccess.value = "";

  try {
    await apiClient.updateTrip(editingTripId.value, {
      status: editForm.status,
      totalSeats: Number(editForm.totalSeats),
    });

    showEditModal.value = false;
    editingTripId.value = null;
    actionSuccess.value = "Cập nhật chuyến xe thành công.";
    await refreshCurrentPage();
  } catch (err: any) {
    actionError.value = err.message || "Cập nhật chuyến xe thất bại.";
  } finally {
    actionLoading.value = false;
  }
};

const handleCloseEditModal = () => {
  showEditModal.value = false;
  showBookingsModal.value = false;
  showBookingRemoveModal.value = false;
  editingTripId.value = null;
  selectedTrip.value = null;
  selectedTripBookings.value = [];
  bookingPendingRemove.value = null;
  removingBookingId.value = null;
  actionError.value = "";
};

const handleViewBookings = () => {
  actionError.value = "";
  showBookingsModal.value = true;
};

const handleRequestRemoveBooking = (booking: Booking) => {
  actionError.value = "";
  bookingPendingRemove.value = booking;
  showBookingRemoveModal.value = true;
};

const handleConfirmRemoveBooking = async () => {
  if (!bookingPendingRemove.value) return;

  removingBookingId.value = bookingPendingRemove.value.id;
  actionError.value = "";
  actionSuccess.value = "";

  try {
    await bookingStore.removeBookingFromTrip(bookingPendingRemove.value.id);

    selectedTripBookings.value = selectedTripBookings.value.filter(
      (item) => item.id !== bookingPendingRemove.value?.id,
    );

    if (selectedTrip.value) {
      selectedTrip.value = {
        ...selectedTrip.value,
        availableSeats: Math.min(
          selectedTrip.value.availableSeats +
            bookingPendingRemove.value.numberOfPassengers,
          selectedTrip.value.totalSeats,
        ),
      };
    }

    showBookingRemoveModal.value = false;
    bookingPendingRemove.value = null;
    actionSuccess.value = "Đã xoá booking khỏi chuyến và đưa về hàng chờ.";

    await refreshCurrentPage();
  } catch (err: any) {
    actionError.value = err.message || "Xoá booking khỏi chuyến thất bại.";
  } finally {
    removingBookingId.value = null;
  }
};

onMounted(async () => {
  try {
    const routeResponse = await apiClient.getRoutes();
    routes.value = routeResponse.data ?? [];
    await Promise.all([loadDriverOptions(), loadPricingConfigs(routes.value)]);
  } catch (_err) {
    routes.value = [];
    drivers.value = [];
    pricingConfigs.value = [];
  }
  await handleSearch();
});
</script>

<template>
  <div class="space-y-6">
    <Breadcrumb :items="['Trang chủ', 'Quản lý chuyến xe']" />

    <section
      class="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#FFF8EC_0%,#F9E7BC_55%,#F2B233_100%)] px-6 py-7 shadow-[0_24px_60px_rgba(98,62,15,0.14)]"
    >
      <div
        class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="space-y-3">
          <span
            class="inline-flex items-center rounded-full border border-[#D8B36A] bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A6700]"
          >
            Điều phối chuyến xe
          </span>
          <div class="space-y-2">
            <h1 class="text-3xl font-bold text-[#4A2A12]">Quản lý chuyến xe</h1>
            <p class="max-w-2xl text-sm leading-6 text-[#6B4B2A]">
              Theo dõi lịch chạy, tài xế, số ghế còn trống và thao tác nhanh
              trên từng chuyến theo đúng luồng vận hành hằng ngày.
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
          <div
            class="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur-sm"
          >
            <p class="text-xs uppercase tracking-[0.18em] text-[#9A6700]">
              Tuyến đang lọc
            </p>
            <p
              class="mt-1 flex items-center gap-2 text-sm font-semibold text-[#4A2A12]"
            >
              <RouteIcon :size="15" />
              {{ selectedRouteLabel }}
            </p>
          </div>
          <button
            class="h-[auto] flex items-center justify-center gap-2 rounded-2xl bg-[#4A2A12] px-6 font-semibold text-white transition-colors hover:bg-[#3B210E]"
            @click="handleCreateClick"
          >
            <Plus :size="18" />
            Tạo chuyến
          </button>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="card in tripSummaryCards"
        :key="card.id"
        class="rounded-3xl border border-[#EFE7DE] bg-white p-5 shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">{{ card.title }}</p>
            <p
              :class="card.valueClass"
              class="mt-2 text-3xl font-bold leading-none"
            >
              {{ card.value }}
            </p>
          </div>
          <div
            :class="card.iconClass"
            class="flex h-11 w-11 items-center justify-center rounded-2xl"
          >
            <component :is="card.icon" :size="20" />
          </div>
        </div>
        <p
          class="mt-5 border-t border-dashed border-[#E8DED2] pt-4 text-xs text-gray-500"
        >
          {{ card.caption }}
        </p>
      </article>
    </div>

    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5"
    >
      {{ error }}
    </div>

    <div
      v-if="actionError"
      class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {{ actionError }}
    </div>

    <div
      v-if="actionSuccess"
      class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
    >
      {{ actionSuccess }}
    </div>

    <section
      class="rounded-3xl border border-[#EFE7DE] bg-white p-5 shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
    >
      <div
        class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div class="flex items-center gap-2 text-[#4A2A12]">
            <Filter :size="18" />
            <h2 class="text-lg font-semibold">Bộ lọc chuyến xe</h2>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Lọc theo tuyến, loại chuyến, ghế, ngày chạy, giá, trạng thái và
            người tạo.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            class="flex h-11 items-center gap-2 rounded-lg bg-[#F2B233] px-6 font-medium text-white transition-colors hover:bg-[#E0A020]"
            :disabled="loading"
            @click="handleSearch"
          >
            <Search :size="18" />
            Tìm kiếm
          </button>

          <button
            class="flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-5 text-gray-700 transition-colors hover:bg-gray-50"
            :disabled="loading"
            @click="handleReset"
          >
            <RefreshCw :size="18" />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectInput
          v-model="filterRouteId"
          label="Tuyến"
          :options="routeFilterOptions"
          placeholder="Tất cả"
        />
        <SelectInput
          v-model="filterType"
          label="Loại chuyến"
          :options="typeFilterOptions"
          placeholder="Tất cả"
        />
        <TextInput
          v-model="filterDriver"
          label="Tài xế"
          placeholder="Nhập tên tài xế"
        />
        <TextInput
          v-model="filterCreator"
          label="Người tạo"
          placeholder="Nhập số điện thoại admin"
        />
        <TextInput
          v-model="filterSeatFrom"
          type="number"
          label="Số ghế từ"
          placeholder="Ví dụ: 4"
        />
        <TextInput
          v-model="filterSeatTo"
          type="number"
          label="Số ghế đến"
          placeholder="Ví dụ: 16"
        />
        <TextInput v-model="filterDepartFrom" type="date" label="Ngày đi từ" />
        <TextInput v-model="filterDepartTo" type="date" label="Ngày đi đến" />
        <TextInput
          v-model="filterTripCostFrom"
          type="number"
          label="Giá từ"
          placeholder="Ví dụ: 120000"
        />
        <TextInput
          v-model="filterTripCostTo"
          type="number"
          label="Giá đến"
          placeholder="Ví dụ: 450000"
        />
        <SelectInput
          v-model="filterStatus"
          label="Trạng thái"
          :options="statusFilterOptions"
          placeholder="Tất cả"
        />
      </div>
    </section>

    <section
      class="overflow-hidden rounded-3xl border border-[#EFE7DE] bg-white shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
    >
      <div
        class="flex flex-col gap-3 border-b border-[#F2ECE4] px-5 py-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 class="text-lg font-semibold text-[#4A2A12]">
            Danh sách chuyến xe
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            Theo dõi toàn bộ chuyến đã tạo và thao tác nhanh trên từng bản ghi.
          </p>
        </div>
        <div
          class="inline-flex items-center rounded-full bg-[#FFF8EC] px-3 py-1.5 text-sm font-medium text-[#9A6700]"
        >
          {{ totalRecords }} chuyến
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1120px]">
          <thead>
            <tr class="bg-[#4A2A12] text-sm text-white">
              <th class="text-left py-3 px-4 font-semibold w-[60px]">STT</th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">Tuyến</th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">
                Loại chuyến
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">
                Ngày khởi hành
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[80px]">
                Giờ khởi hành
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[150px]">
                Tài xế
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[110px]">
                Ghế trống/Tổng ghế
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">
                Giá vé
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">
                Trạng thái
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">
                Phone người tạo
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[110px]">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="py-6 px-4 text-center text-gray-500" colspan="11">
                Đang tải dữ liệu...
              </td>
            </tr>
            <tr v-else-if="paginatedTrips.length === 0">
              <td class="py-6 px-4 text-center text-gray-500" colspan="11">
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
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    getRouteBadgeClass(trip.route?.code),
                  ]"
                >
                  {{ trip.routeName }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    getTripTypeBadgeClass(trip.type),
                  ]"
                >
                  {{ getTripTypeText(trip.type) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ formatDateDisplay(trip.date) }}
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ trip.time }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ trip.driver }}
              </td>
              <td class="py-3 px-4 text-sm font-medium text-[#4A2A12]">
                {{ trip.availableSeats }}/{{ trip.totalSeats }}
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                <p class="font-medium">{{ trip.fareLabel }}</p>
                <p v-if="trip.fareUnit" class="mt-1 text-xs text-gray-500">
                  {{ trip.fareUnit }}
                </p>
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
                    class="rounded-xl bg-amber-50 p-2 transition-colors hover:bg-amber-100"
                    title="Sửa"
                    @click="handleEditClick(trip)"
                  >
                    <Edit :size="16" class="text-orange-600" />
                  </button>
                  <button
                    v-if="trip.canDelete"
                    class="rounded-xl bg-red-50 p-2 transition-colors hover:bg-red-100"
                    title="Xóa"
                    @click="handleDeleteClick(trip)"
                  >
                    <Trash2 :size="16" class="text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 md:flex-row md:items-center md:justify-between"
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
    </section>

    <TripEditModal
      v-model="showEditModal"
      :loading="actionLoading"
      :trip-code="selectedTrip?.tripCode"
      :route-name="selectedTrip?.routeName"
      :trip-type="selectedTrip?.type"
      :driver-name="selectedTrip?.driver"
      :depart-date="selectedTrip?.date"
      :depart-time="selectedTrip?.time"
      :status="editForm.status"
      :total-seats="editForm.totalSeats"
      :available-seats="selectedTrip?.availableSeats ?? 0"
      :booking-count="selectedTripBookings.length"
      :can-edit="selectedTrip?.canEdit ?? false"
      @update:status="editForm.status = $event"
      @update:total-seats="editForm.totalSeats = $event"
      @viewBookings="handleViewBookings"
      @submit="handleEditSubmit"
      @close="handleCloseEditModal"
    />

    <TripBookingsModal
      v-model="showBookingsModal"
      :loading="actionLoading"
      :trip-code="selectedTrip?.tripCode"
      :bookings="selectedTripBookings"
      :removing-booking-id="removingBookingId"
      @remove-booking="handleRequestRemoveBooking"
    />

    <TripBookingRemoveConfirmModal
      v-model="showBookingRemoveModal"
      :loading="removingBookingId !== null"
      :booking-code="bookingPendingRemove?.bookingCode"
      :passenger-name="bookingPendingRemove?.passengerName"
      :trip-code="selectedTrip?.tripCode"
      @confirm="handleConfirmRemoveBooking"
    />

    <TripDeleteConfirmModal
      v-model="showDeleteModal"
      :loading="actionLoading"
      :trip-code="tripPendingDelete?.tripCode"
      :route-name="tripPendingDelete?.routeName"
      :depart-date="
        tripPendingDelete?.date
          ? formatDateDisplay(tripPendingDelete.date)
          : undefined
      "
      :depart-time="tripPendingDelete?.time"
      @confirm="handleConfirmDelete"
    />

    <TripCreateModal
      v-model="showCreateModal"
      :loading="createLoading"
      :route-options="routes"
      :driver-options="drivers"
      :pricing-configs="pricingConfigs"
      @submit="handleCreateSubmit"
    />
  </div>
</template>
