<script setup lang="ts">
import { computed } from "vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import RevenueLineChart from "@/components/ui/RevenueLineChart.vue";
import RouteDonutChart from "@/components/ui/RouteDonutChart.vue";
import WeeklyBarChart from "@/components/ui/WeeklyBarChart.vue";
import { useDashboard } from "@/composables/useDashboard";
import { formatCurrency } from "@/utils/format";
import { Bus, Ticket, DollarSign, UserPlus, ArrowRight, Clock3, RefreshCw } from "lucide-vue-next";

// Use dashboard composable to fetch real data
const {
  metrics,
  revenue7Days,
  weeklyBookings,
  routeRatio,
  upcomingTrips,
  loading,
  error,
} = useDashboard();

const metricMap = computed(() => {
  const map = new Map(metrics.value.map((item) => [item.id, item]));
  return {
    tripsToday: map.get("trips-today"),
    bookingsToday: map.get("bookings-today"),
    revenueToday: map.get("revenue-today"),
    newCustomers: map.get("new-customers"),
  };
});

const summaryCards = computed(() => [
  {
    id: "trips-today",
    title: "Tổng chuyến xe hôm nay",
    value: String(metricMap.value.tripsToday?.value ?? 0),
    accent: "#F2B233",
    softClass: "bg-[#F2B233]/10 text-[#F2B233]",
    borderClass: "border-[#F2B233]",
    caption: "Lịch vận hành trong ngày",
    icon: Bus,
  },
  {
    id: "bookings-today",
    title: "Tổng đặt chỗ hôm nay",
    value: String(metricMap.value.bookingsToday?.value ?? 0),
    accent: "#22C55E",
    softClass: "bg-[#22C55E]/10 text-[#22C55E]",
    borderClass: "border-[#22C55E]",
    caption: "Lượng chỗ đã được giữ",
    icon: Ticket,
  },
  {
    id: "revenue-today",
    title: "Doanh thu hôm nay",
    value: formatCurrency(Number(metricMap.value.revenueToday?.value ?? 0)),
    accent: "#D97706",
    softClass: "bg-[#D97706]/10 text-[#D97706]",
    borderClass: "border-[#D97706]",
    caption: "Doanh thu từ giao dịch hợp lệ",
    icon: DollarSign,
  },
  {
    id: "new-customers",
    title: "Khách hàng mới",
    value: String(metricMap.value.newCustomers?.value ?? 0),
    accent: "#2563EB",
    softClass: "bg-[#2563EB]/10 text-[#2563EB]",
    borderClass: "border-[#2563EB]",
    caption: "Tài khoản phát sinh trong ngày",
    icon: UserPlus,
  },
]);

const dominantRoute = computed(() => {
  if (routeRatio.value.length === 0) {
    return { label: "Chưa có dữ liệu", total: 0 };
  }

  const sorted = [...routeRatio.value].sort((left, right) => right.total - left.total);
  return {
    label: formatRouteLabel(sorted[0].route),
    total: sorted[0].total,
  };
});

const totalRouteTrips = computed(() =>
  routeRatio.value.reduce((sum, item) => sum + Number(item.total || 0), 0),
);

const dashboardUpdatedLabel = computed(() => {
  const now = new Date();
  return now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
});

const formatRouteLabel = (route: string) => {
  const normalized = String(route || "").trim();
  if (!normalized) return "-";

  if (/da\s*nang\s*[-=]*>\s*hue/i.test(normalized)) return "Đà Nẵng → Huế";
  if (/hue\s*[-=]*>\s*da\s*nang/i.test(normalized)) return "Huế → Đà Nẵng";

  return normalized.replace(/\s*[-=]*>\s*/g, " → ");
};

const routeBadgeClass = (route: string) => {
  const label = formatRouteLabel(route).toLowerCase();
  if (
    label.includes("đà nẵng") &&
    label.includes("huế") &&
    label.indexOf("đà nẵng") < label.indexOf("huế")
  ) {
    return "bg-[#F2B233]/10 text-[#F2B233]";
  }
  return "bg-[#4A2A12]/10 text-[#4A2A12]";
};
</script>

<template>
  <div class="space-y-6">
    <Breadcrumb :items="['Trang chủ', 'Tổng quan']" />

    <section class="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#4A2A12_0%,#6B3E1F_58%,#8D5B2A_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(74,42,18,0.22)]">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-3">
          <span class="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Bảng điều hành HDN Ride
          </span>
          <div class="space-y-2">
            <h1 class="text-3xl font-bold leading-tight">Tổng quan vận hành trong ngày</h1>
            <p class="max-w-2xl text-sm leading-6 text-white/80">
              Theo dõi nhanh số chuyến xe, đặt chỗ, doanh thu và các tuyến đang hoạt động để xử lý điều phối trong ngày.
            </p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
          <div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-[0.18em] text-white/60">Tuyến nổi bật</p>
            <p class="mt-1 text-base font-semibold">{{ dominantRoute.label }}</p>
            <p class="mt-1 text-xs text-white/75">{{ dominantRoute.total }} chuyến trong tập dữ liệu hiện tại</p>
          </div>
          <div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-[0.18em] text-white/60">Cập nhật</p>
            <p class="mt-1 flex items-center gap-2 text-base font-semibold">
              <RefreshCw :size="16" />
              {{ dashboardUpdatedLabel }}
            </p>
            <p class="mt-1 text-xs text-white/75">Dữ liệu lấy từ dashboard API hiện tại</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Đang tải dữ liệu...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4"
    >
      <p class="text-red-700">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Summary Cards Row -->
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in summaryCards"
          :key="card.id"
          class="rounded-3xl border border-[#EFE7DE] bg-white p-5 shadow-[0_12px_35px_rgba(29,18,9,0.06)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500">{{ card.title }}</p>
              <p class="mt-2 text-[30px] font-bold leading-none text-[#4A2A12]">{{ card.value }}</p>
            </div>
            <div :class="card.softClass" class="flex h-11 w-11 items-center justify-center rounded-2xl">
              <component :is="card.icon" :size="20" />
            </div>
          </div>
          <div class="flex items-center justify-between border-t border-dashed border-[#E8DED2] pt-4">
            <p class="text-xs text-gray-500">{{ card.caption }}</p>
            <span :class="card.borderClass" class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4A2A12]">
              Hôm nay
            </span>
          </div>
        </article>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div class="xl:col-span-2 rounded-3xl border border-[#EFE7DE] bg-white p-6 shadow-[0_12px_35px_rgba(29,18,9,0.06)]">
          <div class="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-[#4A2A12]">Doanh thu 7 ngày gần nhất</h3>
              <p class="mt-1 text-sm text-gray-500">Theo dõi nhịp tăng trưởng doanh thu theo ngày để cân đối lịch xe và giá vé.</p>
            </div>
            <span class="inline-flex items-center rounded-full border border-[#E7D4B1] bg-[#FFF8EC] px-3 py-1.5 text-xs font-semibold text-[#9A6700]">
              Dữ liệu tuần hiện có
            </span>
          </div>
          <RevenueLineChart :data="revenue7Days" />
        </div>

        <div class="rounded-3xl border border-[#EFE7DE] bg-white p-6 shadow-[0_12px_35px_rgba(29,18,9,0.06)]">
          <div class="mb-5 space-y-3">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-lg font-semibold text-[#4A2A12]">Tỷ lệ chuyến xe</h3>
              <span class="rounded-full bg-[#4A2A12] px-3 py-1 text-xs font-semibold text-white">
                {{ totalRouteTrips }} chuyến
              </span>
            </div>
            <p class="text-sm text-gray-500">Phân bổ số chuyến giữa các hướng tuyến đang vận hành trong dashboard hiện tại.</p>
          </div>
          <RouteDonutChart :data="routeRatio" />
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div class="rounded-3xl border border-[#EFE7DE] bg-white p-6 shadow-[0_12px_35px_rgba(29,18,9,0.06)]">
          <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-[#4A2A12]">Số lượng đặt chỗ theo tuần</h3>
              <p class="mt-1 text-sm text-gray-500">So sánh biến động booking từng ngày để phát hiện sớm khung giờ cao điểm.</p>
            </div>
            <span class="inline-flex items-center gap-2 rounded-full bg-[#EEF6FF] px-3 py-1.5 text-xs font-semibold text-[#2563EB]">
              <Clock3 :size="14" />
              7 ngày gần nhất
            </span>
          </div>
          <WeeklyBarChart :data="weeklyBookings" />
        </div>

        <div class="rounded-3xl border border-[#EFE7DE] bg-white p-6 shadow-[0_12px_35px_rgba(29,18,9,0.06)]">
          <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-[#4A2A12]">Chuyến xe sắp khởi hành</h3>
              <p class="mt-1 text-sm text-gray-500">Danh sách chuyến cần theo dõi sát để điều phối tài xế và giữ chỗ trống.</p>
            </div>
            <div class="inline-flex items-center gap-2 rounded-full border border-[#E8DED2] px-3 py-1.5 text-xs font-semibold text-[#4A2A12]">
              Xem lịch vận hành
              <ArrowRight :size="14" />
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[480px]">
              <thead>
                <tr class="bg-[#4A2A12] text-sm text-white">
                  <th class="rounded-tl-2xl px-4 py-3 text-left font-semibold">Tuyến</th>
                  <th class="px-4 py-3 text-left font-semibold">Giờ</th>
                  <th class="px-4 py-3 text-left font-semibold">Tài xế</th>
                  <th class="rounded-tr-2xl px-4 py-3 text-left font-semibold">Ghế trống</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="upcomingTrips.length === 0">
                  <td
                    colspan="4"
                    class="px-3 py-8 text-center text-sm text-gray-500"
                  >
                    Không có chuyến sắp khởi hành
                  </td>
                </tr>
                <tr
                  v-for="(trip, index) in upcomingTrips"
                  :key="trip.id ?? index"
                  :class="index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'"
                >
                  <td class="px-4 py-3">
                    <span
                      :class="routeBadgeClass(trip.route)"
                      class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    >
                      {{ formatRouteLabel(trip.route) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-[#4A2A12]">
                    {{ trip.time }}
                  </td>
                  <td class="px-4 py-3 text-sm text-[#4A2A12]">
                    {{ trip.driver }}
                  </td>
                  <td class="px-4 py-3 text-sm text-[#4A2A12]">
                    <span class="inline-flex rounded-full bg-[#EEF8F1] px-3 py-1 font-semibold text-[#15803D]">
                      {{ trip.availableSeats }} ghế
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
