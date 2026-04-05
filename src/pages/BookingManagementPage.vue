<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import BookingDetailModal from "@/components/bookings/BookingDetailModal.vue";
import BookingConfirmModal from "@/components/bookings/BookingConfirmModal.vue";
import BookingCancelModal from "@/components/bookings/BookingCancelModal.vue";
import TextInput from "@/components/ui/TextInput.vue";
import SelectInput from "@/components/ui/SelectInput.vue";
import { useBookingStore } from "@/stores/bookings";
import { useNotificationStore } from "@/stores/notifications";
import { apiClient } from "@/utils/apiClient";
import type { Booking, PaymentStatus } from "@/types/api";
import {
  formatDateDisplay,
  getRouteBadgeClass,
  getTripTypeBadgeClass,
  getTripTypeText,
} from "@/utils/format";
import {
  Search,
  Edit,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  BadgeCheck,
  Clock3,
  CarFront,
  Route,
  Filter,
  RefreshCw,
} from "lucide-vue-next";

const bookingStore = useBookingStore();
const notificationStore = useNotificationStore();
const currentPage = ref(1);
const pageSize = 10;
const showDetailModal = ref(false);
const showConfirmModal = ref(false);
const showCancelModal = ref(false);
const selectedTripId = ref("");
const tripsLoading = ref(false);
const tripOptions = ref<Array<{ label: string; value: string }>>([]);
const actionSuccess = ref("");
const actionError = ref("");
const modalActionBooking = ref<Booking | null>(null);

const totalRecords = computed(() => bookingStore.adminPagination.total);
const totalPages = computed(() =>
  Math.max(1, bookingStore.adminPagination.totalPages),
);

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
    (currentPage.value - 1) * pageSize + bookingStore.adminBookings.length,
    totalRecords.value,
  );
});

const getRouteLabel = (booking: Booking): string => {
  if (booking.route?.name) return booking.route.name;
  return "--";
};

const getStatusText = (status: Booking["status"]): string => {
  if (status === "CONFIRMED") return "Đã xác nhận";
  if (status === "PENDING") return "Chờ gắn xe";
  if (status === "CANCELLED") return "Đã hủy";
  if (status === "ASSIGNED") return "Đã gán chuyến";
  if (status === "ONGOING") return "Đang chạy";
  if (status === "COMPLETED") return "Hoàn thành";
  return status;
};

const getStatusBadgeClass = (status: Booking["status"]): string => {
  if (status === "CONFIRMED") return "bg-green-100 text-green-600";
  if (status === "PENDING") return "bg-orange-100 text-orange-600";
  if (status === "CANCELLED") return "bg-red-100 text-red-600";
  if (status === "ASSIGNED") return "bg-blue-100 text-blue-600";
  if (status === "ONGOING") return "bg-indigo-100 text-indigo-600";
  if (status === "COMPLETED") return "bg-sky-100 text-sky-700";
  return "bg-gray-100 text-gray-600";
};

const formatBookingDate = (booking: Booking): string => {
  const date = booking.estimatedDepartAt;
  if (!date) return "--";
  return formatDateDisplay(date);
};

const formatBookingTime = (booking: Booking): string => {
  const source = booking.estimatedDepartAt;
  if (!source) return "--:--";
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return "--:--";
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const getBookerName = (booking: Booking): string => {
  return booking.user?.name || "--";
};

const getBookerPhone = (booking: Booking): string => {
  return booking.user?.phone || "--";
};

const loadAdminBookings = async (page = currentPage.value) => {
  await bookingStore.fetchAdminBookings(page, pageSize);
  currentPage.value = bookingStore.adminPagination.page;
};

const loadSummary = async () => {
  await bookingStore.fetchAdminBookingSummary(
    bookingStore.adminFilters.startDate || undefined,
  );
};

const loadTripOptions = async (booking?: Booking | null) => {
  tripsLoading.value = true;
  try {
    const response = await apiClient.searchTrips({
      bookingId: booking?.id,
      startDate: booking ? undefined : new Date().toISOString(),
      page: 1,
      limit: 100,
    });

    const items = response.data?.items ?? [];
    tripOptions.value = items.map((trip) => ({
      label: `#${trip.tripCode} | ${trip.route?.name ?? `Route ${trip.routeId}`} | ${trip.driver?.name ?? "Chưa có tài xế"} | ${formatDateDisplay(trip.departAt)} | Còn ${trip.availableSeats} ghế`,
      value: String(trip.id),
    }));
  } catch (_error) {
    tripOptions.value = [];
  } finally {
    tripsLoading.value = false;
  }
};

const openBookingDetail = async (bookingId: string) => {
  let booking =
    bookingStore.adminBookings.find((item) => item.id === bookingId) ?? null;

  if (!booking) {
    try {
      const response = await apiClient.getBookingDetail(bookingId);
      booking = response.data;
    } catch {
      booking = null;
    }
  }

  if (!booking) {
    actionError.value = "Không tải được thông tin booking từ thông báo.";
    return;
  }

  handleRowClick(booking);
};

onMounted(async () => {
  await Promise.all([loadAdminBookings(1), loadSummary(), loadTripOptions()]);

  const pendingBookingId = notificationStore.consumePendingBookingIntent();
  if (pendingBookingId) {
    await openBookingDetail(pendingBookingId);
  }
});

watch(
  () => notificationStore.pendingBookingIntentId,
  (bookingId) => {
    if (!bookingId) return;

    const pendingBookingId = notificationStore.consumePendingBookingIntent();
    if (pendingBookingId) {
      void openBookingDetail(pendingBookingId);
    }
  },
);

const bookingSummaryCards = computed(() => [
  {
    id: "total",
    title: "Tổng hôm nay",
    value: bookingStore.summary.totalToday,
    caption: "Tổng booking tạo trong ngày",
    icon: ClipboardList,
    iconClass: "bg-[#F2B233]/10 text-[#F2B233]",
    borderClass: "border-[#F2B233]",
  },
  {
    id: "confirmed",
    title: "Đã xác nhận",
    value: bookingStore.summary.confirmedToday,
    caption: "Booking đã được xác nhận",
    icon: BadgeCheck,
    iconClass: "bg-[#22C55E]/10 text-[#22C55E]",
    borderClass: "border-[#22C55E]",
  },
  {
    id: "pending",
    title: "Chờ xác nhận",
    value: bookingStore.summary.pendingToday,
    caption: "Cần xử lý và gán chuyến",
    icon: Clock3,
    iconClass: "bg-[#F59E0B]/10 text-[#F59E0B]",
    borderClass: "border-[#F59E0B]",
  },
  {
    id: "assigned",
    title: "Đã phân tài xế",
    value: bookingStore.summary.assignedToday ?? 0,
    caption: "Booking đã có chuyến phù hợp",
    icon: CarFront,
    iconClass: "bg-[#3B82F6]/10 text-[#3B82F6]",
    borderClass: "border-[#3B82F6]",
  },
  {
    id: "ongoing",
    title: "Đang thực hiện",
    value: bookingStore.summary.ongoingToday ?? 0,
    caption: "Khách đang ở trên tuyến",
    icon: Route,
    iconClass: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
    borderClass: "border-[#8B5CF6]",
  },
  {
    id: "cancelled",
    title: "Đã hủy",
    value: bookingStore.summary.cancelledToday ?? 0,
    caption: "Booking đã bị hủy trong ngày",
    icon: X,
    iconClass: "bg-[#EF4444]/10 text-[#EF4444]",
    borderClass: "border-[#EF4444]",
  },
]);

const routeFilterOptions = [
  { label: "Tất cả tuyến", value: "" },
  { label: "Đà Nẵng -> Huế", value: "1" },
  { label: "Huế -> Đà Nẵng", value: "2" },
];

const statusFilterOptions = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Chờ gắn xe", value: "PENDING" },
  { label: "Đã gán chuyến", value: "ASSIGNED" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đang chạy", value: "ONGOING" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đã hủy", value: "CANCELLED" },
];

const handleSearch = async () => {
  actionError.value = "";
  actionSuccess.value = "";
  currentPage.value = 1;
  await Promise.all([loadAdminBookings(1), loadSummary()]);
};

const handleReset = async () => {
  bookingStore.resetAdminFilters();
  actionError.value = "";
  actionSuccess.value = "";
  currentPage.value = 1;
  await Promise.all([loadAdminBookings(1), loadSummary()]);
};

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  await loadAdminBookings(page);
};

const handleRowClick = (booking: Booking) => {
  bookingStore.selectBooking(booking);
  selectedTripId.value = booking.tripId ? String(booking.tripId) : "";
  actionError.value = "";
  showDetailModal.value = true;
  void loadTripOptions(booking);
};

const handleRequestConfirm = (booking: Booking) => {
  if (booking.status !== "ASSIGNED") return;
  modalActionBooking.value = booking;
  actionError.value = "";
  showConfirmModal.value = true;
};

const handleRequestCancel = (booking?: Booking) => {
  const target = booking ?? bookingStore.selectedBooking;
  if (!target) return;
  if (target.status !== "PENDING" && target.status !== "ASSIGNED") {
    actionError.value =
      "Chỉ có thể hủy booking ở trạng thái chờ gắn xe hoặc đã gán chuyến.";
    return;
  }

  modalActionBooking.value = target;
  actionError.value = "";
  showCancelModal.value = true;
};

const handleAssign = async () => {
  if (!bookingStore.selectedBooking) return;
  if (!selectedTripId.value) {
    actionError.value = "Vui lòng chọn chuyến để gán booking.";
    return;
  }

  const bookingId = bookingStore.selectedBooking.id;
  const tripId = selectedTripId.value;
  actionError.value = "";
  actionSuccess.value = "";

  await bookingStore.assignBooking(bookingId, tripId);

  let syncedBooking: Booking | null = null;
  try {
    const response = await apiClient.getBookingDetail(bookingId);
    syncedBooking = response.data;
    bookingStore.selectBooking(syncedBooking);
  } catch {
    syncedBooking = null;
  }

  await Promise.all([loadAdminBookings(currentPage.value), loadSummary()]);

  if (syncedBooking?.status === "ASSIGNED" && syncedBooking.tripId === tripId) {
    actionSuccess.value = "Đã gán booking vào chuyến thành công.";
    actionError.value = "";
    showDetailModal.value = false;
    return;
  }

  if (!bookingStore.error) {
    actionSuccess.value = "Đã đồng bộ lại trạng thái booking.";
    actionError.value = "";
  } else {
    actionError.value = bookingStore.error;
  }
};

const handleConfirmBooking = async () => {
  if (!modalActionBooking.value) return;

  await bookingStore.confirmAdminBooking(modalActionBooking.value.id);

  if (!bookingStore.error) {
    actionSuccess.value = "Đã xác nhận booking thành công.";
    actionError.value = "";
    showConfirmModal.value = false;
    if (bookingStore.selectedBooking?.id === modalActionBooking.value.id) {
      showDetailModal.value = false;
    }
    modalActionBooking.value = null;
    await Promise.all([loadAdminBookings(currentPage.value), loadSummary()]);
  } else {
    actionError.value = bookingStore.error;
  }
};

const handleConfirmCancel = async (reason: string) => {
  if (!modalActionBooking.value) return;

  await bookingStore.cancelAdminBooking(modalActionBooking.value.id, reason);

  if (!bookingStore.error) {
    actionSuccess.value = "Đã hủy booking thành công.";
    actionError.value = "";
    showCancelModal.value = false;
    if (bookingStore.selectedBooking?.id === modalActionBooking.value.id) {
      showDetailModal.value = false;
    }
    modalActionBooking.value = null;
    await Promise.all([loadAdminBookings(currentPage.value), loadSummary()]);
  } else {
    actionError.value = bookingStore.error;
  }
};

const handleUpdatePaymentStatus = async (paymentStatus: PaymentStatus) => {
  if (!bookingStore.selectedBooking) return;

  actionError.value = "";
  actionSuccess.value = "";

  await bookingStore.updateBookingPaymentStatus(
    bookingStore.selectedBooking.id,
    paymentStatus,
  );

  if (!bookingStore.error) {
    actionSuccess.value = "Đã cập nhật trạng thái thanh toán.";
  } else {
    actionError.value = bookingStore.error;
  }
};
</script>

<template>
  <div class="space-y-6">
    <Breadcrumb :items="['Trang chủ', 'Quản lý đặt chỗ']" />

    <section
      class="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#4A2A12_0%,#6B3E1F_52%,#9A6700_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(74,42,18,0.22)]"
    >
      <div
        class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="space-y-3">
          <span
            class="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/70"
          >
            Điều phối booking
          </span>
          <div class="space-y-2">
            <h1 class="text-3xl font-bold">Quản lý đặt chỗ</h1>
            <p class="max-w-2xl text-sm leading-6 text-white/80">
              Kiểm soát booking phát sinh theo ngày, xử lý xác nhận, gán chuyến
              và theo dõi trạng thái phục vụ khách hàng.
            </p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
          <div
            class="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
          >
            <p class="text-xs uppercase tracking-[0.18em] text-white/60">
              Tổng kết hôm nay
            </p>
            <p class="mt-1 text-lg font-semibold">
              {{ bookingStore.summary.totalToday }} booking
            </p>
            <p class="mt-1 text-xs text-white/75">
              Bao gồm chờ xác nhận, đã gán chuyến và đang phục vụ
            </p>
          </div>
          <div
            class="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
          >
            <p class="text-xs uppercase tracking-[0.18em] text-white/60">
              Bộ lọc hiện tại
            </p>
            <p class="mt-1 text-sm font-semibold">
              {{
                bookingStore.adminFilters.bookingCode ||
                bookingStore.adminFilters.phone ||
                "Tất cả booking"
              }}
            </p>
            <p class="mt-1 text-xs text-white/75">
              {{
                bookingStore.adminFilters.startDate ||
                bookingStore.adminFilters.endDate
                  ? `${bookingStore.adminFilters.startDate || "--"} → ${bookingStore.adminFilters.endDate || "--"}`
                  : "Không giới hạn ngày"
              }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <div
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
    >
      <article
        v-for="card in bookingSummaryCards"
        :key="card.id"
        class="rounded-3xl border border-[#EFE7DE] bg-white p-5 shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">{{ card.title }}</p>
            <p class="mt-2 text-[28px] font-bold leading-none text-[#4A2A12]">
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
          class="mt-4 border-t border-dashed border-[#E8DED2] pt-4 text-xs text-gray-500"
        >
          {{ card.caption }}
        </p>
      </article>
    </div>
    <!-- Khung Search -->
    <section
      class="rounded-3xl border border-[#EFE7DE] bg-white p-5 shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
    >
      <div
        class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div class="flex items-center gap-2 text-[#4A2A12]">
            <Filter :size="18" />
            <h2 class="text-lg font-semibold">Bộ lọc đặt chỗ</h2>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Lọc theo mã booking, tuyến, điện thoại, số ghế, ngày đi và trạng
            thái để tìm đúng booking cần thao tác.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            class="flex h-11 items-center gap-2 rounded-lg bg-[#F2B233] px-6 font-medium text-white transition-colors hover:bg-[#E0A020]"
            :disabled="bookingStore.loading"
            @click="handleSearch"
          >
            <Search :size="18" />
            Tìm kiếm
          </button>

          <button
            class="flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-5 text-gray-700 transition-colors hover:bg-gray-50"
            :disabled="bookingStore.loading"
            @click="handleReset"
          >
            <RefreshCw :size="18" />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextInput
          v-model="bookingStore.adminFilters.bookingCode"
          label="Mã đặt chỗ"
          placeholder="Tìm theo mã booking"
        />
        <SelectInput
          v-model="bookingStore.adminFilters.routeId"
          label="Tuyến"
          :options="routeFilterOptions"
          placeholder="Tất cả tuyến"
        />
        <TextInput
          v-model="bookingStore.adminFilters.phone"
          label="Số điện thoại"
          placeholder="Tìm theo số điện thoại"
        />
        <SelectInput
          v-model="bookingStore.adminFilters.status"
          label="Trạng thái"
          :options="statusFilterOptions"
          placeholder="Tất cả trạng thái"
        />
        <TextInput
          v-model="bookingStore.adminFilters.startDate"
          type="date"
          label="Ngày đi từ"
        />
        <TextInput
          v-model="bookingStore.adminFilters.endDate"
          type="date"
          label="Ngày đi đến"
        />
        <TextInput
          v-model="bookingStore.adminFilters.seatFrom"
          type="number"
          label="Số ghế từ"
          placeholder="1"
        />
        <TextInput
          v-model="bookingStore.adminFilters.seatTo"
          type="number"
          label="Số ghế đến"
          placeholder="10"
        />
      </div>
    </section>

    <div
      v-if="actionSuccess"
      class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700"
    >
      {{ actionSuccess }}
    </div>

    <div
      v-if="actionError || bookingStore.error"
      class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600"
    >
      {{ actionError || bookingStore.error }}
    </div>

    <section
      class="overflow-hidden rounded-3xl border border-[#EFE7DE] bg-white shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
    >
      <div
        class="flex flex-col gap-3 border-b border-[#F2ECE4] px-5 py-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 class="text-lg font-semibold text-[#4A2A12]">
            Danh sách booking
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            Mỗi booking có thể xem chi tiết, gán chuyến hoặc hủy trực tiếp từ
            bảng.
          </p>
        </div>
      </div>

      <!-- { Booking table } -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1120px]">
          <thead>
            <tr class="bg-[#4A2A12] text-white text-sm">
              <th class="text-left py-3 px-4 font-semibold w-[60px]">STT</th>
              <th class="text-left py-3 px-4 font-semibold w-[150px]">
                Mã đặt chỗ
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[170px]">Tuyến</th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">Loại</th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">Ngày</th>
              <th class="text-left py-3 px-4 font-semibold w-[80px]">Giờ</th>
              <th class="text-left py-3 px-4 font-semibold w-[170px]">
                Tên người đặt
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[140px]">
                Số điện thoại
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[100px]">
                Số ghế đặt
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[220px]">
                Điểm đón / trả
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">
                Trạng thái
              </th>
              <th class="text-left py-3 px-4 font-semibold w-[140px]">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="bookingStore.loading">
              <td class="py-6 px-4 text-center text-gray-500" colspan="12">
                Đang tải dữ liệu...
              </td>
            </tr>
            <tr v-else-if="bookingStore.adminBookings.length === 0">
              <td class="py-6 px-4 text-center text-gray-500" colspan="12">
                Không có booking phù hợp bộ lọc.
              </td>
            </tr>
            <tr
              v-for="(booking, index) in bookingStore.adminBookings"
              v-else
              :key="booking.id"
              :class="
                index % 2 === 0
                  ? 'bg-white hover:bg-[#FFF9EB] transition-colors'
                  : 'bg-[#FAFAFA] hover:bg-[#FFF9EB] transition-colors'
              "
            >
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="py-3 px-4 text-sm font-semibold text-[#4A2A12]">
                {{ booking.bookingCode }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    getRouteBadgeClass(booking?.route?.code),
                  ]"
                >
                  {{ getRouteLabel(booking) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                <span
                  :class="[
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    getTripTypeBadgeClass(booking.bookingType),
                  ]"
                >
                  {{ getTripTypeText(booking.bookingType) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ formatBookingDate(booking) }}
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ formatBookingTime(booking) }}
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ getBookerName(booking) }}
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ getBookerPhone(booking) }}
              </td>
              <td
                class="py-3 px-4 text-sm text-[#4A2A12] font-semibold text-center"
              >
                {{ booking.numberOfPassengers }}
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                <div class="space-y-1">
                  <p class="font-semibold text-[#4A2A12]">
                    Đón:
                    {{ booking.pickupWard || booking.pickupDistrict || "--" }}
                  </p>
                  <p class="text-xs text-[#7B6A60]">
                    Trả:
                    {{ booking.dropoffWard || booking.dropoffDistrict || "--" }}
                  </p>
                </div>
              </td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'inline-block px-2 py-1 rounded text-xs font-medium',
                    getStatusBadgeClass(booking.status),
                  ]"
                >
                  {{ getStatusText(booking.status) }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button
                    class="rounded-xl bg-blue-50 p-2 transition-colors hover:bg-blue-100"
                    title="Xem"
                    @click="handleRowClick(booking)"
                  >
                    <Edit :size="16" class="text-blue-600" />
                  </button>
                  <button
                    v-if="booking.status === 'ASSIGNED'"
                    class="rounded-xl bg-green-50 p-2 transition-colors hover:bg-green-100"
                    title="Xác nhận"
                    @click="handleRequestConfirm(booking)"
                  >
                    <Check :size="16" class="text-green-600" />
                  </button>
                  <button
                    v-if="
                      booking.status === 'PENDING' ||
                      booking.status === 'ASSIGNED' ||
                      booking.status === 'CONFIRMED'
                    "
                    class="rounded-xl bg-red-50 p-2 transition-colors hover:bg-red-100"
                    title="Hủy"
                    @click="handleRequestCancel(booking)"
                  >
                    <X :size="16" class="text-red-600" />
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
  </div>

  <BookingDetailModal
    v-model="showDetailModal"
    :booking="bookingStore.selectedBooking"
    :loading="bookingStore.loading"
    :selected-trip-id="selectedTripId"
    :trip-options="tripOptions"
    :trips-loading="tripsLoading"
    @update:selected-trip-id="selectedTripId = $event"
    @update-payment-status="handleUpdatePaymentStatus"
    @assign="handleAssign"
    @cancel="handleRequestCancel"
  />

  <BookingConfirmModal
    v-model="showConfirmModal"
    :loading="bookingStore.loading"
    :booking-code="modalActionBooking?.bookingCode"
    :route-name="
      modalActionBooking ? getRouteLabel(modalActionBooking) : undefined
    "
    :depart-date="
      modalActionBooking ? formatBookingDate(modalActionBooking) : undefined
    "
    :depart-time="
      modalActionBooking ? formatBookingTime(modalActionBooking) : undefined
    "
    @confirm="handleConfirmBooking"
  />

  <BookingCancelModal
    v-model="showCancelModal"
    :loading="bookingStore.loading"
    :booking-code="modalActionBooking?.bookingCode"
    :route-name="
      modalActionBooking ? getRouteLabel(modalActionBooking) : undefined
    "
    @confirm="handleConfirmCancel"
  />
</template>
