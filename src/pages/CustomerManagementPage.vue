<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useCustomerStore } from "@/stores/customers";
import type { CustomerAdminItem } from "@/types/api";
import Modal from "@/components/ui/Modal.vue";
import SelectInput from "@/components/ui/SelectInput.vue";
import Breadcrumb from '@/components/Breadcrumb.vue'
import {
  Eye,
  UserX,
  UserCheck,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";

const customerStore = useCustomerStore();
const currentPage = ref(1);
const pageSize = 10;

const showDetailModal = ref(false);
const showVerifyModal = ref(false);

const accountStatusOptions = [
  { label: "Tất cả", value: "" },
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Tạm khóa", value: "INACTIVE" },
];

const studentStatusOptions = [
  { label: "Tất cả", value: "" },
  { label: "Chưa đăng ký", value: "NONE" },
  { label: "Chờ xét duyệt", value: "PENDING" },
  { label: "Đã xác minh", value: "APPROVED" },
  { label: "Từ chối", value: "REJECTED" },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const studentStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    NONE: "Chưa đăng ký",
    PENDING: "Chờ duyệt",
    APPROVED: "Đã xác minh",
    REJECTED: "Từ chối",
  };
  return map[status] ?? status;
};

const studentStatusClass = (status: string) => {
  const map: Record<string, string> = {
    NONE: "bg-gray-100 text-gray-600 border border-gray-200",
    PENDING: "bg-amber-100 text-amber-700 border border-amber-200",
    APPROVED: "bg-green-100 text-green-700 border border-green-200",
    REJECTED: "bg-red-100 text-red-700 border border-red-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 border border-gray-200";
};

const loadCustomers = async (page = currentPage.value) => {
  await customerStore.fetchCustomers(page, pageSize);
  currentPage.value = customerStore.pagination.page;
};

onMounted(async () => {
  await Promise.all([loadCustomers(1), customerStore.fetchSummary()]);
});

// ------- Detail -------
const openDetailModal = (customer: CustomerAdminItem) => {
  customerStore.selectCustomer(customer);
  showDetailModal.value = true;
};

// ------- Status Toggle -------
const toggleStatus = async (customer: CustomerAdminItem) => {
  const next = customer.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await customerStore.updateStatus(customer.id, next);
};

// ------- Verify Student -------
const openVerifyModal = (customer: CustomerAdminItem) => {
  customerStore.selectCustomer(customer);
  showVerifyModal.value = true;
};

const confirmVerify = async (action: "APPROVE" | "REJECT") => {
  if (!customerStore.selectedCustomer) return;
  await customerStore.verifyStudent(customerStore.selectedCustomer.id, {
    action,
  });
  if (!customerStore.error) {
    showVerifyModal.value = false;
  }
};

// ------- Search / Filter -------
const handleSearch = async () => {
  currentPage.value = 1;
  await loadCustomers(1);
};

const handleReset = async () => {
  customerStore.resetFilters();
  currentPage.value = 1;
  await loadCustomers(1);
};

// ------- Pagination -------
const goToPage = async (page: number) => {
  if (page < 1 || page > customerStore.pagination.totalPages) return;
  currentPage.value = page;
  await loadCustomers(page);
};

const pageNumbers = () => {
  const total = customerStore.pagination.totalPages;
  const cur = currentPage.value;
  const pages: (number | string)[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (cur > 3) pages.push("...");
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++)
      pages.push(i);
    if (cur < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
};
</script>

<template>
  <div class="">
    <!-- Header -->
    <Breadcrumb :items="['Trang chủ', 'Quản lý khách hàng']" />
    <div class="flex items-center justify-between  py-5">
      <h1 class="text-2xl font-bold text-gray-900">Quản Lý Khách Hàng</h1>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-5">
      <div
        class="bg-white rounded-xl border border-gray-200 p-5"
        style="border-top: 4px solid #3b82f6"
      >
        <p class="text-sm text-gray-500 mb-1">Tổng Khách Hàng</p>
        <p class="text-3xl font-bold text-gray-900">
          {{ customerStore.summary?.total ?? customerStore.pagination.total }}
        </p>
      </div>
      <div
        class="bg-white rounded-xl border border-gray-200 p-5"
        style="border-top: 4px solid #22c55e"
      >
        <p class="text-sm text-gray-500 mb-1">Đang Hoạt Động</p>
        <p class="text-3xl font-bold text-gray-900">
          {{ customerStore.summary?.active ?? "—" }}
        </p>
      </div>
      <div
        class="bg-white rounded-xl border border-gray-200 p-5"
        style="border-top: 4px solid #a855f7"
      >
        <p class="text-sm text-gray-500 mb-1">SV Đã Xác Minh</p>
        <p class="text-3xl font-bold text-gray-900">
          {{ customerStore.summary?.approvedStudents ?? "—" }}
        </p>
      </div>
      <div
        class="bg-white rounded-xl border border-gray-200 p-5"
        style="border-top: 4px solid #f59e0b"
      >
        <p class="text-sm text-gray-500 mb-1">Chờ Xác Minh SV</p>
        <p class="text-3xl font-bold text-gray-900">
          {{ customerStore.summary?.pendingStudents ?? "—" }}
        </p>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 mb-5">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[160px]">
          <label class="block text-xs text-gray-500 mb-1">Tên khách hàng</label>
          <input
            v-model="customerStore.filters.name"
            type="text"
            placeholder="Tìm theo tên..."
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="flex-1 min-w-[140px]">
          <label class="block text-xs text-gray-500 mb-1">Số điện thoại</label>
          <input
            v-model="customerStore.filters.phone"
            type="text"
            placeholder="Tìm theo SĐT..."
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="min-w-[150px]">
          <label class="block text-xs text-gray-500 mb-1">Trạng thái TK</label>
          <SelectInput
            v-model="customerStore.filters.accountStatus"
            :options="accountStatusOptions"
            placeholder="Tất cả"
          />
        </div>
        <div class="min-w-[160px]">
          <label class="block text-xs text-gray-500 mb-1">Trạng thái SV</label>
          <SelectInput
            v-model="customerStore.filters.studentStatus"
            :options="studentStatusOptions"
            placeholder="Tất cả"
          />
        </div>
        <button
          class="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          @click="handleSearch"
        >
          Tìm kiếm
        </button>
        <button
          class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          @click="handleReset"
        >
          Đặt lại
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        v-if="customerStore.error"
        class="px-6 py-3 text-sm text-red-700 bg-red-50 border-b border-red-200"
      >
        {{ customerStore.error }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-800 text-white">
              <th class="px-4 py-3 text-left font-semibold w-12">STT</th>
              <th class="px-4 py-3 text-left font-semibold">Khách Hàng</th>
              <th class="px-4 py-3 text-left font-semibold">SĐT</th>
              <th class="px-4 py-3 text-left font-semibold">Số Chuyến</th>
              <th class="px-4 py-3 text-left font-semibold">Ngày Tham Gia</th>
              <th class="px-4 py-3 text-left font-semibold">Trạng Thái TK</th>
              <th class="px-4 py-3 text-left font-semibold">Trạng Thái SV</th>
              <th class="px-4 py-3 text-center font-semibold">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="customerStore.loading">
              <td colspan="8" class="px-4 py-8 text-center text-gray-400">
                Đang tải...
              </td>
            </tr>
            <tr v-else-if="customerStore.records.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-gray-400">
                Không có khách hàng nào
              </td>
            </tr>
            <tr
              v-for="(customer, idx) in customerStore.records"
              :key="customer.id"
              :class="idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
              class="border-b border-gray-100 hover:bg-amber-50 transition-colors"
            >
              <td class="px-4 py-3 text-gray-500">
                {{ (currentPage - 1) * pageSize + idx + 1 }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-blue-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-blue-700 font-semibold text-xs"
                  >
                    <img
                      v-if="customer.avatar"
                      :src="customer.avatar"
                      :alt="customer.name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else>{{
                      customer.name.charAt(0).toUpperCase()
                    }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ customer.name }}</p>
                    <span
                      v-if="customer.isStudent"
                      class="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium"
                      >SV</span
                    >
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ customer.phone }}</td>
              <td class="px-4 py-3 font-medium text-gray-700">
                {{ customer.totalBookings }}
              </td>
              <td class="px-4 py-3 text-gray-500">
                {{ formatDate(customer.createdAt) }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="
                    customer.accountStatus === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  "
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                >
                  {{
                    customer.accountStatus === "ACTIVE"
                      ? "Hoạt động"
                      : "Tạm khóa"
                  }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="studentStatusClass(customer.studentStatus)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                >
                  {{ studentStatusLabel(customer.studentStatus) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button
                    class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                    title="Xem chi tiết"
                    @click="openDetailModal(customer)"
                  >
                    <Eye :size="15" />
                  </button>
                  <button
                    :class="
                      customer.accountStatus === 'ACTIVE'
                        ? 'bg-red-50 hover:bg-red-100 text-red-600'
                        : 'bg-green-50 hover:bg-green-100 text-green-600'
                    "
                    class="p-1.5 rounded-lg transition-colors"
                    :title="
                      customer.accountStatus === 'ACTIVE'
                        ? 'Khóa tài khoản'
                        : 'Mở tài khoản'
                    "
                    @click="toggleStatus(customer)"
                  >
                    <UserX
                      v-if="customer.accountStatus === 'ACTIVE'"
                      :size="15"
                    />
                    <UserCheck v-else :size="15" />
                  </button>
                  <button
                    v-if="customer.studentStatus === 'PENDING'"
                    class="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                    title="Xác minh thẻ sinh viên"
                    @click="openVerifyModal(customer)"
                  >
                    <Award :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-4 bg-white flex-wrap"
      >
        <p class="text-sm text-gray-500">
          Hiển thị {{ customerStore.records.length }} /
          {{ customerStore.pagination.total }} khách hàng
        </p>
        <div class="flex items-center gap-1">
          <button
            :disabled="currentPage <= 1"
            class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft :size="16" />
          </button>
          <template v-for="p in pageNumbers()" :key="p">
            <button
              v-if="p !== '...'"
              :class="
                p === currentPage
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              "
              class="min-w-[32px] h-8 rounded-lg border text-sm font-medium transition-colors"
              @click="goToPage(Number(p))"
            >
              {{ p }}
            </button>
            <span v-else class="px-1 text-gray-400 select-none">…</span>
          </template>
          <button
            :disabled="currentPage >= customerStore.pagination.totalPages"
            class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Customer Detail Modal -->
  <Modal v-model="showDetailModal" title="Chi Tiết Khách Hàng">
    <div v-if="customerStore.selectedCustomer" class="space-y-4">
      <div class="flex items-center gap-4 pb-4 border-b border-gray-100">
        <div
          class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0"
        >
          <img
            v-if="customerStore.selectedCustomer.avatar"
            :src="customerStore.selectedCustomer.avatar"
            class="w-full h-full object-cover rounded-full"
          />
          <span v-else>{{
            customerStore.selectedCustomer.name.charAt(0).toUpperCase()
          }}</span>
        </div>
        <div>
          <p class="font-semibold text-gray-900">
            {{ customerStore.selectedCustomer.name }}
          </p>
          <p class="text-sm text-gray-500">
            {{ customerStore.selectedCustomer.phone }}
          </p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-gray-500 text-xs mb-0.5">Số chuyến đặt</p>
          <p class="font-semibold text-gray-900">
            {{ customerStore.selectedCustomer.totalBookings }}
          </p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-gray-500 text-xs mb-0.5">Ngày tham gia</p>
          <p class="font-semibold text-gray-900">
            {{ formatDate(customerStore.selectedCustomer.createdAt) }}
          </p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-gray-500 text-xs mb-0.5">Trạng thái TK</p>
          <span
            :class="
              customerStore.selectedCustomer.accountStatus === 'ACTIVE'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            "
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
          >
            {{
              customerStore.selectedCustomer.accountStatus === "ACTIVE"
                ? "Hoạt động"
                : "Tạm khóa"
            }}
          </span>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-gray-500 text-xs mb-0.5">Trạng thái SV</p>
          <span
            :class="
              studentStatusClass(customerStore.selectedCustomer.studentStatus)
            "
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
          >
            {{
              studentStatusLabel(customerStore.selectedCustomer.studentStatus)
            }}
          </span>
        </div>
      </div>
      <div
        v-if="customerStore.selectedCustomer.studentCardImage"
        class="space-y-1"
      >
        <p class="text-xs text-gray-500">Ảnh thẻ sinh viên</p>
        <img
          :src="customerStore.selectedCustomer.studentCardImage"
          alt="Student card"
          class="rounded-lg border border-gray-200 max-h-48 object-contain w-full"
        />
      </div>
      <button
        class="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        @click="showDetailModal = false"
      >
        Đóng
      </button>
    </div>
  </Modal>

  <!-- Verify Student Modal -->
  <Modal v-model="showVerifyModal" title="Xác Minh Thẻ Sinh Viên">
    <div v-if="customerStore.selectedCustomer" class="space-y-4">
      <p class="text-sm text-gray-600">
        Xét duyệt thẻ sinh viên của
        <strong>{{ customerStore.selectedCustomer.name }}</strong>
      </p>
      <div v-if="customerStore.selectedCustomer.studentCardImage">
        <p class="text-xs text-gray-500 mb-2">Ảnh thẻ sinh viên</p>
        <img
          :src="customerStore.selectedCustomer.studentCardImage"
          alt="Student card"
          class="rounded-lg border border-gray-200 max-h-56 object-contain w-full"
        />
      </div>
      <div
        v-else
        class="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-lg"
      >
        Không có ảnh thẻ sinh viên
      </div>
      <div
        v-if="customerStore.error"
        class="text-sm text-red-600 bg-red-50 p-3 rounded-lg"
      >
        {{ customerStore.error }}
      </div>
      <div class="flex gap-3 pt-2">
        <button
          class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          @click="showVerifyModal = false"
        >
          Hủy
        </button>
        <button
          class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
          :disabled="customerStore.loading"
          @click="confirmVerify('REJECT')"
        >
          Từ chối
        </button>
        <button
          class="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
          :disabled="customerStore.loading"
          @click="confirmVerify('APPROVE')"
        >
          Phê duyệt
        </button>
      </div>
    </div>
  </Modal>
</template>
