<script setup lang="ts">
import Card from "@/components/ui/Card.vue";
import StatCard from "@/components/ui/StatCard.vue";
import Table from "@/components/ui/Table.vue";
import RevenueLineChart from "@/components/ui/RevenueLineChart.vue";
import RouteDonutChart from "@/components/ui/RouteDonutChart.vue";
import WeeklyBarChart from "@/components/ui/WeeklyBarChart.vue";
import { useDashboard } from "@/composables/useDashboard";
import { formatCurrency } from "@/utils/format";

// Use dashboard composable to fetch real data
const { metrics, revenue7Days, weeklyBookings, routeRatio, upcomingTrips, loading, error } =
  useDashboard();

// Format upcoming trips for table
const upcomingColumns = [
  { key: "route", label: "Tuyến" },
  { key: "time", label: "Giờ khởi hành" },
  { key: "driver", label: "Tài xế" },
  { key: "availableSeats", label: "Ghế trống" },
];
</script>

<template>
  <div class="space-y-6">
    <!-- Page Title -->
    <h1 class="text-3xl font-bold text-gray-900">Tổng Quan</h1>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Đang tải dữ liệu...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-700">{{ error }}</p>
    </div>

    <!-- KPI Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        v-for="m of metrics"
        :key="m.id"
        :title="m.title"
        :value="m.format === 'currency' ? formatCurrency(m.value) : m.value"
        :tone="m.tone"
        :icon="
          m.tone === 'gold'
            ? '📦'
            : m.tone === 'green'
              ? '✓'
              : m.tone === 'amber'
                ? '💰'
                : '👥'
        "
      />
    </div>

    <!-- Charts Section -->
    <div v-if="!loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Revenue Line Chart -->
      <Card class="col-span-1">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Doanh Thu 7 Ngày Gần Nhất
        </h2>
        <RevenueLineChart :data="revenue7Days" />
      </Card>

      <!-- Route Distribution Doughnut Chart -->
      <Card class="col-span-1">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Tỷ Lệ Chuyến Theo Tuyến
        </h2>
        <RouteDonutChart :data="routeRatio" />
      </Card>

      <!-- Weekly Bookings Bar Chart -->
      <Card class="col-span-1">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Số Lượng Đặt Chỗ Theo Tuần
        </h2>
        <WeeklyBarChart :data="weeklyBookings" />
      </Card>

      <!-- Upcoming Trips Table -->
      <Card class="col-span-1">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Chuyến Xe Sắp Khởi Hành
        </h2>
        <Table
          :columns="upcomingColumns"
          :data="upcomingTrips"
          class="text-sm"
          @row-click="() => {}"
        />
      </Card>
    </div>
  </div>
</template>
