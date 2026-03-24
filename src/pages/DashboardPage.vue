<script setup lang="ts">
import { computed } from "vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import RevenueLineChart from "@/components/ui/RevenueLineChart.vue";
import RouteDonutChart from "@/components/ui/RouteDonutChart.vue";
import WeeklyBarChart from "@/components/ui/WeeklyBarChart.vue";
import { useDashboard } from "@/composables/useDashboard";
import { formatCurrency } from "@/utils/format";
import { Bus, Ticket, DollarSign, UserPlus } from "lucide-vue-next";

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
  <div class="">
    <Breadcrumb :items="['Trang chủ', 'Tổng quan']" />

    <h1 class="text-2xl font-bold text-[#4A2A12] my-5">Tổng quan</h1>

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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div
          class="bg-white rounded-xl shadow-sm border-t-[3px] border-[#F2B233] p-5"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">Tổng chuyến xe hôm nay</p>
              <p class="text-[28px] font-bold text-[#4A2A12]">
                {{ metricMap.tripsToday?.value ?? 0 }}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-[#F2B233]/10 rounded-full flex items-center justify-center"
            >
              <Bus :size="20" class="text-[#F2B233]" />
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-sm border-t-[3px] border-[#22C55E] p-5"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">Tổng đặt chỗ hôm nay</p>
              <p class="text-[28px] font-bold text-[#4A2A12]">
                {{ metricMap.bookingsToday?.value ?? 0 }}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-[#22C55E]/10 rounded-full flex items-center justify-center"
            >
              <Ticket :size="20" class="text-[#22C55E]" />
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-sm border-t-[3px] border-[#F2B233] p-5"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">Doanh thu hôm nay</p>
              <p class="text-[28px] font-bold text-[#4A2A12]">
                {{ formatCurrency(Number(metricMap.revenueToday?.value ?? 0)) }}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-[#F2B233]/10 rounded-full flex items-center justify-center"
            >
              <DollarSign :size="20" class="text-[#F2B233]" />
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-sm border-t-[3px] border-[#3B82F6] p-5"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">Khách hàng mới</p>
              <p class="text-[28px] font-bold text-[#4A2A12]">
                {{ metricMap.newCustomers?.value ?? 0 }}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-[#3B82F6]/10 rounded-full flex items-center justify-center"
            >
              <UserPlus :size="20" class="text-[#3B82F6]" />
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div class="xl:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold text-[#4A2A12] mb-4">
            Doanh thu 7 ngày gần nhất
          </h3>
          <RevenueLineChart :data="revenue7Days" />
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold text-[#4A2A12] mb-4">
            Tỷ lệ chuyến xe
          </h3>
          <RouteDonutChart :data="routeRatio" />
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold text-[#4A2A12] mb-4">
            Số lượng đặt chỗ theo tuần
          </h3>
          <WeeklyBarChart :data="weeklyBookings" />
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold text-[#4A2A12] mb-4">
            Chuyến xe sắp khởi hành
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-[#4A2A12] text-white text-sm">
                  <th class="text-left py-3 px-3 rounded-tl-lg">Tuyến</th>
                  <th class="text-left py-3 px-3">Giờ</th>
                  <th class="text-left py-3 px-3">Tài xế</th>
                  <th class="text-left py-3 px-3 rounded-tr-lg">Ghế trống</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="upcomingTrips.length === 0">
                  <td
                    colspan="4"
                    class="py-8 px-3 text-center text-sm text-gray-500"
                  >
                    Không có chuyến sắp khởi hành
                  </td>
                </tr>
                <tr
                  v-for="(trip, index) in upcomingTrips"
                  :key="trip.id ?? index"
                  :class="index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'"
                >
                  <td class="py-3 px-3">
                    <span
                      :class="routeBadgeClass(trip.route)"
                      class="inline-block px-2 py-1 rounded text-xs font-medium"
                    >
                      {{ formatRouteLabel(trip.route) }}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-sm text-[#4A2A12]">
                    {{ trip.time }}
                  </td>
                  <td class="py-3 px-3 text-sm text-[#4A2A12]">
                    {{ trip.driver }}
                  </td>
                  <td class="py-3 px-3 text-sm text-[#4A2A12] font-semibold">
                    {{ trip.availableSeats }}
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
