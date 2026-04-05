<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useDriverStore } from "@/stores/drivers";
import type {
  AccountStatus,
  AdminDriver,
  CreateDriverDto,
  UpdateDriverDto,
} from "@/types/api";
import Breadcrumb from "@/components/Breadcrumb.vue";
import TextInput from "@/components/ui/TextInput.vue";
import SelectInput from "@/components/ui/SelectInput.vue";
import DriverCreateModal from "@/components/drivers/DriverCreateModal.vue";
import DriverEditModal from "@/components/drivers/DriverEditModal.vue";
import DriverVehicleModal from "@/components/drivers/DriverVehicleModal.vue";
import DriverStatusConfirmModal from "@/components/drivers/DriverStatusConfirmModal.vue";
import {
  Search,
  Edit,
  UserCheck,
  UserX,
  Car,
  Phone,
  Plus,
  CheckCircle,
  AlertCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Filter,
  RefreshCw,
  ShieldCheck,
} from "lucide-vue-next";

const driverStore = useDriverStore();
const currentPage = ref(1);
const pageSize = 10;

const showCreateModal = ref(false);
const showEditModal = ref(false);
const showVehicleModal = ref(false);
const showStatusConfirm = ref(false);

const statusFilterOptions = [
  { label: "Tất cả", value: "" },
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Tạm khóa", value: "INACTIVE" },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const renderStars = (rating: number | null) => Math.round(rating ?? 0);

const getInitials = (name: string) => {
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase();
  }
  return (words[0]?.charAt(0) ?? "U").toUpperCase();
};

const loadDrivers = async (page = currentPage.value) => {
  await driverStore.fetchDrivers(page, pageSize);
  currentPage.value = driverStore.pagination.page;
};

onMounted(async () => {
  await Promise.all([loadDrivers(1), driverStore.fetchDriverSummary()]);
});

const openCreateModal = () => {
  showCreateModal.value = true;
};

const handleCreateSubmit = async (payload: CreateDriverDto) => {
  await driverStore.createDriver(payload);
  if (!driverStore.error) {
    showCreateModal.value = false;
    await Promise.all([
      loadDrivers(currentPage.value),
      driverStore.fetchDriverSummary(),
    ]);
  }
};

const openEditModal = (driver: AdminDriver) => {
  driverStore.selectDriver(driver);
  showEditModal.value = true;
};

const handleEditSubmit = async (payload: {
  driverId: string;
  data: UpdateDriverDto;
}) => {
  await driverStore.updateDriver(payload.driverId, payload.data);
  if (!driverStore.error) {
    showEditModal.value = false;
    await loadDrivers(currentPage.value);
  }
};

const openVehicleModal = (driver: AdminDriver) => {
  driverStore.selectDriver(driver);
  showVehicleModal.value = true;
};

const openStatusConfirm = (driver: AdminDriver) => {
  driverStore.selectDriver(driver);
  showStatusConfirm.value = true;
};

const handleStatusSubmit = async (payload: {
  driverId: string;
  accountStatus: AccountStatus;
}) => {
  await driverStore.updateDriverStatus(payload.driverId, payload.accountStatus);
  if (!driverStore.error) {
    showStatusConfirm.value = false;
    await Promise.all([
      loadDrivers(currentPage.value),
      driverStore.fetchDriverSummary(),
    ]);
  }
};

const handleSearch = async () => {
  currentPage.value = 1;
  await loadDrivers(1);
};

const handleReset = async () => {
  driverStore.resetFilters();
  currentPage.value = 1;
  await loadDrivers(1);
};

const goToPage = async (page: number) => {
  if (page < 1 || page > driverStore.pagination.totalPages) return;
  currentPage.value = page;
  await loadDrivers(page);
};

const pageNumbers = () => {
  const total = driverStore.pagination.totalPages;
  const cur = currentPage.value;
  const pages: Array<number | string> = [];

  if (total <= 7) {
    for (let index = 1; index <= total; index += 1) {
      pages.push(index);
    }
  } else {
    pages.push(1);
    if (cur > 3) pages.push("...");
    for (
      let index = Math.max(2, cur - 1);
      index <= Math.min(total - 1, cur + 1);
      index += 1
    ) {
      pages.push(index);
    }
    if (cur < total - 2) pages.push("...");
    pages.push(total);
  }

  return pages;
};

const driverSummaryCards = [
  {
    id: "total",
    title: "Tổng tài xế",
    value: () => driverStore.summary?.total ?? driverStore.pagination.total,
    caption: "Tổng hồ sơ tài xế trong hệ thống",
    icon: Car,
    iconClass: "bg-[#F2B233]/10 text-[#F2B233]",
  },
  {
    id: "active",
    title: "Đang hoạt động",
    value: () => driverStore.summary?.active ?? driverStore.activeCount,
    caption: "Sẵn sàng nhận chuyến và điều phối",
    icon: CheckCircle,
    iconClass: "bg-green-100 text-green-600",
  },
  {
    id: "rating",
    title: "Đánh giá TB",
    value: () => driverStore.summary?.averageRating?.toFixed(1) ?? "-",
    caption: "Điểm đánh giá trung bình từ khách",
    icon: Star,
    iconClass: "bg-[#F2B233]/10 text-[#F2B233]",
  },
  {
    id: "trips",
    title: "Tổng chuyến đi",
    value: () => driverStore.summary?.totalTrips ?? "-",
    caption: "Số chuyến đã phục vụ trên hệ thống",
    icon: TrendingUp,
    iconClass: "bg-blue-100 text-blue-600",
  },
];
</script>

<template>
  <div class="space-y-6">
    <Breadcrumb :items="['Trang chủ', 'Quản lý tài xế']" />

    <section
      class="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#FFF8EC_0%,#F8E4B8_50%,#F2B233_100%)] px-6 py-7 shadow-[0_24px_60px_rgba(98,62,15,0.14)]"
    >
      <div
        class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="space-y-3">
          <span
            class="inline-flex items-center rounded-full border border-[#D8B36A] bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A6700]"
          >
            Đội ngũ tài xế
          </span>
          <div class="space-y-2">
            <h1 class="text-3xl font-bold text-[#4A2A12]">Quản lý tài xế</h1>
            <p class="max-w-2xl text-sm leading-6 text-[#6B4B2A]">
              Quản lý hồ sơ tài xế, trạng thái hoạt động, đánh giá dịch vụ và
              thông tin phương tiện phục vụ điều phối.
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
          <div
            class="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur-sm"
          >
            <p class="text-xs uppercase tracking-[0.18em] text-[#9A6700]">
              Bộ lọc trạng thái
            </p>
            <p
              class="mt-1 flex items-center gap-2 text-sm font-semibold text-[#4A2A12]"
            >
              <ShieldCheck :size="15" />
              {{ driverStore.filters.accountStatus || "Tất cả trạng thái" }}
            </p>
          </div>
          <button
            class="flex h-[auto] items-center justify-center gap-2 rounded-2xl bg-[#4A2A12] px-6 font-semibold text-white transition-colors hover:bg-[#3A1F0E]"
            @click="openCreateModal"
          >
            <Plus :size="18" />
            Thêm tài xế
          </button>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <article
        v-for="card in driverSummaryCards"
        :key="card.id"
        class="rounded-3xl border border-[#EFE7DE] bg-white p-5 shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">{{ card.title }}</p>
            <p class="mt-2 text-3xl font-bold leading-none text-[#4A2A12]">
              {{ card.value() }}
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

    <section
      class="rounded-3xl border border-[#EFE7DE] bg-white p-5 shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
    >
      <div
        class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div class="flex items-center gap-2 text-[#4A2A12]">
            <Filter :size="18" />
            <h2 class="text-lg font-semibold">Bộ lọc tài xế</h2>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Tìm theo tên gần đúng, số điện thoại chính xác, biển số gần đúng, số
            chuyến hoàn thành, ngày tham gia và trạng thái tài khoản.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            class="flex h-11 items-center gap-2 rounded-lg bg-[#F2B233] px-6 font-medium text-white transition-colors hover:bg-[#E0A020]"
            @click="handleSearch"
          >
            <Search :size="18" />
            Tìm kiếm
          </button>
          <button
            class="flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-5 text-gray-700 transition-colors hover:bg-gray-50"
            @click="handleReset"
          >
            <RefreshCw :size="15" />
            Xóa bộ lọc
          </button>
        </div>
      </div>
      
      <!-- Khung search start -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextInput
          v-model="driverStore.filters.name"
          label="Tên tài xế"
          placeholder="Tìm gần đúng theo tên"
        />
        <TextInput
          v-model="driverStore.filters.phone"
          label="Số điện thoại"
          placeholder="Nhập đúng 10 chữ số"
        />
        <TextInput
          v-model="driverStore.filters.plate"
          label="Biển số xe"
          placeholder="Tìm gần đúng theo biển số"
        />
        <SelectInput
          v-model="driverStore.filters.accountStatus"
          label="Trạng thái"
          :options="statusFilterOptions"
          placeholder="Tất cả trạng thái"
        />
        <TextInput
          v-model="driverStore.filters.completedTripsFrom"
          type="number"
          label="Số chuyến hoàn thành từ"
          placeholder="0"
        />
        <TextInput
          v-model="driverStore.filters.completedTripsTo"
          type="number"
          label="Số chuyến hoàn thành đến"
          placeholder="100"
        />
        <TextInput
          v-model="driverStore.filters.joinedFrom"
          type="date"
          label="Ngày tham gia từ"
        />
        <TextInput
          v-model="driverStore.filters.joinedTo"
          type="date"
          label="Ngày tham gia đến"
        />
      </div>
      <!-- Khung search end -->
    </section>

    <section
      class="overflow-hidden rounded-3xl border border-[#EFE7DE] bg-white shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
    >
      <div
        v-if="driverStore.error"
        class="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700"
      >
        {{ driverStore.error }}
      </div>

      <div
        class="flex flex-col gap-3 border-b border-[#F2ECE4] px-5 py-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 class="text-lg font-semibold text-[#4A2A12]">Danh sách tài xế</h2>
          <p class="mt-1 text-sm text-gray-500">
            Theo dõi hồ sơ tài xế, xe đang dùng, đánh giá và trạng thái phục vụ.
          </p>
        </div>
        <div
          class="inline-flex items-center rounded-full bg-[#FFF8EC] px-3 py-1.5 text-sm font-medium text-[#9A6700]"
        >
          {{ driverStore.pagination.total }} tài xế
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1120px] text-sm">
          <thead>
            <tr class="bg-[#4A2A12] text-white">
              <th class="w-[60px] px-4 py-3 text-left font-semibold">STT</th>
              <th class="w-[220px] px-4 py-3 text-left font-semibold">
                Tài xế
              </th>
              <th class="w-[150px] px-4 py-3 text-left font-semibold">
                Số điện thoại
              </th>
              <th class="w-[160px] px-4 py-3 text-left font-semibold">
                Đánh giá
              </th>
              <th class="w-[170px] px-4 py-3 text-left font-semibold">
                Phương tiện
              </th>
              <th class="w-[110px] px-4 py-3 text-left font-semibold">
                Số chuyến
              </th>
              <th class="w-[130px] px-4 py-3 text-left font-semibold">
                Ngày tham gia
              </th>
              <th class="w-[140px] px-4 py-3 text-left font-semibold">
                Trạng thái
              </th>
              <th class="w-[130px] px-4 py-3 text-left font-semibold">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="driverStore.loading">
              <td colspan="9" class="px-4 py-8 text-center text-gray-400">
                Đang tải...
              </td>
            </tr>
            <tr v-else-if="driverStore.records.length === 0">
              <td colspan="9" class="px-4 py-8 text-center text-gray-400">
                Không có tài xế nào
              </td>
            </tr>
            <tr
              v-for="(driver, idx) in driverStore.records"
              v-else
              :key="driver.id"
              :class="idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'"
            >
              <td class="px-4 py-3 text-sm text-[#4A2A12]">
                {{ (currentPage - 1) * pageSize + idx + 1 }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#F2B233] text-sm font-semibold text-white"
                  >
                    <img
                      v-if="driver.avatar"
                      :src="driver.avatar"
                      :alt="driver.name"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>{{ getInitials(driver.name) }}</span>
                  </div>
                  <span class="text-sm font-medium text-[#4A2A12]">{{
                    driver.name
                  }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1 text-sm text-gray-600">
                  <Phone :size="14" />
                  {{ driver.phone }}
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <span class="mr-1 font-semibold text-gray-800">{{
                    driver.rating?.toFixed(1) ?? "-"
                  }}</span>
                  <Star
                    v-for="index in 5"
                    :key="index"
                    :size="12"
                    :class="
                      index <= renderStars(driver.rating)
                        ? 'fill-[#F2B233] text-[#F2B233]'
                        : 'fill-gray-200 text-gray-300'
                    "
                  />
                </div>
              </td>
              <td class="px-4 py-3">
                <button
                  v-if="driver.vehicle"
                  class="rounded-full bg-[#4A2A12]/10 px-3 py-1 text-xs font-semibold text-[#4A2A12] transition-colors hover:bg-[#4A2A12]/20"
                  @click.stop="openVehicleModal(driver)"
                >
                  {{ driver.vehicle.plate }}
                </button>
                <span v-else class="text-xs text-gray-400">Chưa có xe</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm font-semibold text-[#F2B233]">{{
                  driver.totalTrips
                }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ formatDate(driver.createDate) }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="
                    driver.accountStatus === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  "
                  class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                >
                  <CheckCircle
                    v-if="driver.accountStatus === 'ACTIVE'"
                    :size="12"
                  />
                  <AlertCircle v-else :size="12" />
                  {{
                    driver.accountStatus === "ACTIVE" ? "Hoạt động" : "Tạm khóa"
                  }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button
                    class="rounded-xl bg-amber-50 p-2 transition-colors hover:bg-amber-100"
                    title="Sửa"
                    @click="openEditModal(driver)"
                  >
                    <Edit :size="16" class="text-orange-600" />
                  </button>
                  <button
                    class="rounded-xl bg-red-50 p-2 transition-colors hover:bg-red-100"
                    :title="
                      driver.accountStatus === 'ACTIVE'
                        ? 'Tạm khóa'
                        : 'Kích hoạt'
                    "
                    @click="openStatusConfirm(driver)"
                  >
                    <UserX
                      v-if="driver.accountStatus === 'ACTIVE'"
                      :size="16"
                      class="text-red-600"
                    />
                    <UserCheck v-else :size="16" class="text-green-600" />
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
          Hiển thị {{ driverStore.records.length }} /
          {{ driverStore.pagination.total }} kết quả
        </div>
        <div class="flex items-center gap-1">
          <button
            class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft :size="16" />
          </button>
          <template v-for="page in pageNumbers()" :key="page">
            <button
              v-if="page !== '...'"
              class="flex h-8 w-8 items-center justify-center rounded border transition-colors"
              :class="
                page === currentPage
                  ? 'border-[#F2B233] bg-[#F2B233] text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              "
              @click="goToPage(Number(page))"
            >
              {{ page }}
            </button>
            <span v-else class="px-1 text-gray-400">...</span>
          </template>
          <button
            class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            :disabled="currentPage >= driverStore.pagination.totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </section>
  </div>

  <DriverCreateModal
    v-model="showCreateModal"
    :loading="driverStore.loading"
    :error="driverStore.error"
    @submit="handleCreateSubmit"
  />
  <DriverEditModal
    v-model="showEditModal"
    :driver="driverStore.selectedDriver"
    :loading="driverStore.loading"
    :error="driverStore.error"
    @submit="handleEditSubmit"
  />
  <DriverVehicleModal
    v-model="showVehicleModal"
    :driver="driverStore.selectedDriver"
  />
  <DriverStatusConfirmModal
    v-model="showStatusConfirm"
    :driver="driverStore.selectedDriver"
    :loading="driverStore.loading"
    @submit="handleStatusSubmit"
  />
</template>
