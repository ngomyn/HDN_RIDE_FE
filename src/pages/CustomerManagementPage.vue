<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useCustomerStore } from "@/stores/customers";
import type { AccountStatus, CustomerAdminItem } from "@/types/api";
import Modal from "@/components/ui/Modal.vue";
import TextInput from "@/components/ui/TextInput.vue";
import SelectInput from "@/components/ui/SelectInput.vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import {
  Eye,
  UserX,
  UserCheck,
  Award,
  Search,
  Filter,
  RefreshCw,
  Users,
  CheckCircle,
  GraduationCap,
  Clock3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  CalendarDays,
  Gift,
  Link2,
  BadgeCheck,
} from "lucide-vue-next";

const customerStore = useCustomerStore();
const currentPage = ref(1);
const pageSize = 10;

const showDetailModal = ref(false);
const showVerifyModal = ref(false);
const showStatusConfirmModal = ref(false);
const pendingStatusCustomer = ref<CustomerAdminItem | null>(null);
const openingQueuedVerification = ref(false);

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

const resultFrom = computed(() => {
  if (customerStore.pagination.total === 0) return 0;
  return (currentPage.value - 1) * pageSize + 1;
});

const resultTo = computed(() => {
  if (customerStore.pagination.total === 0) return 0;
  return Math.min(
    (currentPage.value - 1) * pageSize + customerStore.records.length,
    customerStore.pagination.total,
  );
});

const customerSummaryCards = computed(() => [
  {
    id: "total",
    title: "Tổng khách hàng",
    value: customerStore.summary?.total ?? customerStore.pagination.total,
    caption: "Tổng hồ sơ khách trong hệ thống",
    icon: Users,
    iconClass: "bg-[#F2B233]/10 text-[#F2B233]",
  },
  {
    id: "active",
    title: "Đang hoạt động",
    value: customerStore.summary?.active ?? 0,
    caption: "Khách có tài khoản khả dụng",
    icon: CheckCircle,
    iconClass: "bg-green-100 text-green-600",
  },
  {
    id: "approved",
    title: "SV đã xác minh",
    value: customerStore.summary?.approvedStudents ?? 0,
    caption: "Khách có thẻ sinh viên hợp lệ",
    icon: GraduationCap,
    iconClass: "bg-blue-100 text-blue-600",
  },
  {
    id: "pending",
    title: "Chờ xác minh SV",
    value: customerStore.summary?.pendingStudents ?? 0,
    caption: "Yêu cầu xét duyệt đang chờ xử lý",
    icon: Clock3,
    iconClass: "bg-orange-100 text-orange-600",
  },
]);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (value?: number | null) => {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
};

const accountStatusLabel = (status: AccountStatus) => {
  return status === "ACTIVE" ? "Hoạt động" : "Tạm khóa";
};

const accountStatusClass = (status: AccountStatus) => {
  return status === "ACTIVE"
    ? "bg-green-100 text-green-700 border border-green-200"
    : "bg-red-100 text-red-700 border border-red-200";
};

const nextAccountStatus = (status: AccountStatus): AccountStatus => {
  return status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
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

const openQueuedVerificationModal = async () => {
  if (!customerStore.pendingVerificationTarget || openingQueuedVerification.value) {
    return;
  }

  openingQueuedVerification.value = true;

  try {
    const customer = await customerStore.resolveQueuedVerificationCustomer();
    if (customer) {
      showDetailModal.value = false;
      showVerifyModal.value = true;
    }
  } finally {
    customerStore.clearVerificationIntent();
    openingQueuedVerification.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadCustomers(1), customerStore.fetchSummary()]);
  await openQueuedVerificationModal();
});

watch(
  () => customerStore.pendingVerificationTarget,
  async (target) => {
    if (!target) return;
    await openQueuedVerificationModal();
  },
);

// ------- Detail -------
const openDetailModal = (customer: CustomerAdminItem) => {
  customerStore.selectCustomer(customer);
  showVerifyModal.value = false;
  showDetailModal.value = true;
};

// ------- Status Toggle -------
const toggleStatus = (customer: CustomerAdminItem) => {
  pendingStatusCustomer.value = customer;
  showStatusConfirmModal.value = true;
};

const confirmToggleStatus = async () => {
  if (!pendingStatusCustomer.value) return;

  const next = nextAccountStatus(pendingStatusCustomer.value.accountStatus);
  await customerStore.updateStatus(pendingStatusCustomer.value.id, next);

  if (!customerStore.error) {
    showStatusConfirmModal.value = false;
    pendingStatusCustomer.value = null;
  }
};

const closeStatusConfirm = () => {
  showStatusConfirmModal.value = false;
  pendingStatusCustomer.value = null;
};

// ------- Verify Student -------
const openVerifyModal = (customer: CustomerAdminItem) => {
  customerStore.selectCustomer(customer);
  showDetailModal.value = false;
  showVerifyModal.value = true;
};

const confirmVerify = async (action: "APPROVE" | "REJECT") => {
  if (!customerStore.selectedCustomer) return;
  await customerStore.verifyStudent(customerStore.selectedCustomer.id, {
    action,
  });
  if (!customerStore.error) {
    showVerifyModal.value = false;
    await loadCustomers(currentPage.value);
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

const getInitials = (name: string) => {
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase();
  }
  return (words[0]?.charAt(0) ?? "U").toUpperCase();
};

const selectedCustomer = computed(() => customerStore.selectedCustomer);
const selectedVerification = computed(() => customerStore.selectedVerification);
</script>

<template>
  <div class="space-y-6">
    <Breadcrumb :items="['Trang chủ', 'Quản lý khách hàng']" />

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
            Quản trị khách hàng
          </span>
          <div class="space-y-2">
            <h1 class="text-3xl font-bold text-[#4A2A12]">Quản lý khách hàng</h1>
            <p class="max-w-2xl text-sm leading-6 text-[#6B4B2A]">
              Theo dõi tài khoản khách, trạng thái xác minh sinh viên và xử lý
              xét duyệt thẻ trực tiếp tại trang quản lý khách hàng.
            </p>
          </div>
        </div>

        <div
          class="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur-sm"
        >
          <p class="text-xs uppercase tracking-[0.18em] text-[#9A6700]">
            Bộ lọc trạng thái
          </p>
          <p class="mt-1 flex items-center gap-2 text-sm font-semibold text-[#4A2A12]">
            <ShieldCheck :size="15" />
            {{ customerStore.filters.accountStatus || 'Tất cả trạng thái' }}
          </p>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="card in customerSummaryCards"
        :key="card.id"
        class="rounded-3xl border border-[#EFE7DE] bg-white p-5 shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">{{ card.title }}</p>
            <p class="mt-2 text-3xl font-bold leading-none text-[#4A2A12]">
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
        <p class="mt-5 border-t border-dashed border-[#E8DED2] pt-4 text-xs text-gray-500">
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
            <h2 class="text-lg font-semibold">Bộ lọc khách hàng</h2>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Tìm theo tên, số điện thoại, trạng thái, số chuyến, điểm thưởng, số giới thiệu và ngày tham gia.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            class="flex h-11 items-center gap-2 rounded-lg bg-[#F2B233] px-6 font-medium text-white transition-colors hover:bg-[#E0A020]"
            :disabled="customerStore.loading"
            @click="handleSearch"
          >
            <Search :size="18" />
            Tìm kiếm
          </button>

          <button
            class="flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-5 text-gray-700 transition-colors hover:bg-gray-50"
            :disabled="customerStore.loading"
            @click="handleReset"
          >
            <RefreshCw :size="18" />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextInput
          v-model="customerStore.filters.name"
          label="Tên khách hàng"
          placeholder="Nhập tên khách hàng"
          @keyup.enter="handleSearch"
        />
        <TextInput
          v-model="customerStore.filters.phone"
          label="Số điện thoại"
          placeholder="Nhập số điện thoại"
          @keyup.enter="handleSearch"
        />
        <SelectInput
          v-model="customerStore.filters.accountStatus"
          label="Trạng thái tài khoản"
          :options="accountStatusOptions"
          placeholder="Tất cả"
        />
        <SelectInput
          v-model="customerStore.filters.studentStatus"
          label="Trạng thái sinh viên"
          :options="studentStatusOptions"
          placeholder="Tất cả"
        />
        <TextInput
          v-model="customerStore.filters.totalBookingsFrom"
          type="number"
          label="Số chuyến từ"
          placeholder="0"
          @keyup.enter="handleSearch"
        />
        <TextInput
          v-model="customerStore.filters.totalBookingsTo"
          type="number"
          label="Số chuyến đến"
          placeholder="100"
          @keyup.enter="handleSearch"
        />
        <TextInput
          v-model="customerStore.filters.loyaltyPointsFrom"
          type="number"
          label="Điểm thưởng từ"
          placeholder="0"
          @keyup.enter="handleSearch"
        />
        <TextInput
          v-model="customerStore.filters.loyaltyPointsTo"
          type="number"
          label="Điểm thưởng đến"
          placeholder="5000"
          @keyup.enter="handleSearch"
        />
        <TextInput
          v-model="customerStore.filters.successfulReferralsFrom"
          type="number"
          label="Giới thiệu thành công từ"
          placeholder="0"
          @keyup.enter="handleSearch"
        />
        <TextInput
          v-model="customerStore.filters.successfulReferralsTo"
          type="number"
          label="Giới thiệu thành công đến"
          placeholder="50"
          @keyup.enter="handleSearch"
        />
        <TextInput
          v-model="customerStore.filters.joinedFrom"
          type="date"
          label="Ngày tham gia từ"
        />
        <TextInput
          v-model="customerStore.filters.joinedTo"
          type="date"
          label="Ngày tham gia đến"
        />
      </div>
    </section>

    <section
      class="overflow-hidden rounded-3xl border border-[#EFE7DE] bg-white shadow-[0_12px_35px_rgba(29,18,9,0.06)]"
    >
      <div
        v-if="customerStore.error"
        class="px-6 py-3 text-sm text-red-700 bg-red-50 border-b border-red-200"
      >
        {{ customerStore.error }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1320px] text-sm">
          <thead>
            <tr class="bg-[#4A2A12] text-white">
              <th class="px-4 py-3 text-left font-semibold w-12">STT</th>
              <th class="px-4 py-3 text-left font-semibold">Khách Hàng</th>
              <th class="px-4 py-3 text-left font-semibold">SĐT</th>
              <th class="px-4 py-3 text-left font-semibold">Số Chuyến</th>
              <th class="px-4 py-3 text-left font-semibold">Điểm Thưởng</th>
              <th class="px-4 py-3 text-left font-semibold">GT Thành Công</th>
              <th class="px-4 py-3 text-left font-semibold">Ngày Tham Gia</th>
              <th class="px-4 py-3 text-left font-semibold">Trạng Thái TK</th>
              <th class="px-4 py-3 text-left font-semibold">Trạng Thái SV</th>
              <th class="px-4 py-3 text-center font-semibold">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="customerStore.loading">
              <td colspan="10" class="px-4 py-8 text-center text-gray-400">
                Đang tải...
              </td>
            </tr>
            <tr v-else-if="customerStore.records.length === 0">
              <td colspan="10" class="px-4 py-8 text-center text-gray-400">
                Không có khách hàng nào
              </td>
            </tr>
            <tr
              v-for="(customer, idx) in customerStore.records"
              :key="customer.id"
              :class="idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'"
              class="border-b border-gray-100"
            >
              <td class="px-4 py-3 text-[#4A2A12]">
                {{ (currentPage - 1) * pageSize + idx + 1 }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-[#F2B233]/20 overflow-hidden flex-shrink-0 flex items-center justify-center text-[#9A6700] font-semibold text-xs"
                  >
                    <img
                      v-if="customer.avatar"
                      :src="customer.avatar"
                      :alt="customer.name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else>{{ getInitials(customer.name) }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-[#4A2A12]">{{ customer.name }}</p>
                    <span
                      v-if="customer.isStudent"
                      class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium"
                      >SV</span
                    >
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-[#4A2A12]">{{ customer.phone }}</td>
              <td class="px-4 py-3 font-medium text-[#4A2A12]">
                {{ customer.totalBookings }}
              </td>
              <td class="px-4 py-3 font-medium text-[#4A2A12]">
                {{ formatNumber(customer.loyaltyPoints) }}
              </td>
              <td class="px-4 py-3 font-medium text-[#4A2A12]">
                {{ customer.successfulReferrals }}
              </td>
              <td class="px-4 py-3 text-[#4A2A12]">
                {{ formatDate(customer.createDate) }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="accountStatusClass(customer.accountStatus)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                >
                  {{ accountStatusLabel(customer.accountStatus) }}
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
        class="px-4 py-4 border-t border-gray-100 flex items-center justify-between gap-4 bg-white flex-wrap"
      >
        <p class="text-sm text-gray-600">
          Hiển thị {{ resultFrom }}-{{ resultTo }} / {{ customerStore.pagination.total }} khách hàng
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
    </section>
  </div>

  <!-- Customer Detail Modal -->
  <Modal v-model="showDetailModal" title="Chi Tiết Khách Hàng" size="xl">
    <div v-if="selectedCustomer" class="space-y-6">
      <div class="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-start md:justify-between">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-full bg-[#F2B233]/15 flex items-center justify-center text-[#9A6700] font-bold text-xl flex-shrink-0 overflow-hidden"
          >
            <img
              v-if="selectedCustomer.avatar"
              :src="selectedCustomer.avatar"
              class="w-full h-full object-cover rounded-full"
            />
            <span v-else>{{ getInitials(selectedCustomer.name) }}</span>
          </div>
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-xl font-semibold text-[#4A2A12]">
                {{ selectedCustomer.name }}
              </p>
              <span
                v-if="selectedCustomer.isStudent"
                class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
              >
                <BadgeCheck :size="14" />
                Sinh viên
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>Mã KH: {{ selectedCustomer.userCode }}</span>
              <span v-if="selectedCustomer.referralCode">
                Mã giới thiệu: {{ selectedCustomer.referralCode }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            :class="accountStatusClass(selectedCustomer.accountStatus)"
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
          >
            {{ accountStatusLabel(selectedCustomer.accountStatus) }}
          </span>
          <span
            :class="studentStatusClass(selectedCustomer.studentStatus)"
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
          >
            {{ studentStatusLabel(selectedCustomer.studentStatus) }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
        <div class="rounded-2xl bg-[#FFF8EC] p-4">
          <p class="text-xs uppercase tracking-[0.18em] text-[#9A6700]">Số chuyến</p>
          <p class="mt-2 text-2xl font-bold text-[#4A2A12]">
            {{ formatNumber(selectedCustomer.totalBookings) }}
          </p>
        </div>
        <div class="rounded-2xl bg-[#F4F8FF] p-4">
          <p class="text-xs uppercase tracking-[0.18em] text-[#2F5AA8]">Điểm thưởng</p>
          <p class="mt-2 text-2xl font-bold text-[#18325E]">
            {{ formatNumber(selectedCustomer.loyaltyPoints) }}
          </p>
        </div>
        <div class="rounded-2xl bg-[#F2FBF3] p-4">
          <p class="text-xs uppercase tracking-[0.18em] text-[#2E7D32]">Giới thiệu thành công</p>
          <p class="mt-2 text-2xl font-bold text-[#1F5A23]">
            {{ formatNumber(selectedCustomer.successfulReferrals) }}
          </p>
        </div>
        <div class="rounded-2xl bg-[#FFF4F1] p-4">
          <p class="text-xs uppercase tracking-[0.18em] text-[#B45309]">Ngày tham gia</p>
          <p class="mt-2 text-base font-semibold text-[#4A2A12]">
            {{ formatDate(selectedCustomer.createDate) }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="rounded-2xl border border-[#EFE7DE] p-4 space-y-3">
          <p class="text-sm font-semibold text-[#4A2A12]">Thông tin liên hệ</p>
          <div class="space-y-3 text-sm text-gray-600">
            <div class="flex items-start gap-3">
              <Phone :size="16" class="mt-0.5 text-[#9A6700]" />
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Số điện thoại</p>
                <p class="font-medium text-[#4A2A12]">{{ selectedCustomer.phone || '—' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Mail :size="16" class="mt-0.5 text-[#9A6700]" />
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Email</p>
                <p class="font-medium text-[#4A2A12]">{{ selectedCustomer.gmail || '—' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <CalendarDays :size="16" class="mt-0.5 text-[#9A6700]" />
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Tham gia lúc</p>
                <p class="font-medium text-[#4A2A12]">{{ formatDateTime(selectedCustomer.createDate) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-[#EFE7DE] p-4 space-y-3">
          <p class="text-sm font-semibold text-[#4A2A12]">Thông tin ưu đãi</p>
          <div class="space-y-3 text-sm text-gray-600">
            <div class="flex items-start gap-3">
              <Gift :size="16" class="mt-0.5 text-[#9A6700]" />
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Điểm thưởng hiện có</p>
                <p class="font-medium text-[#4A2A12]">{{ formatNumber(selectedCustomer.loyaltyPoints) }} điểm</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Link2 :size="16" class="mt-0.5 text-[#9A6700]" />
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Giới thiệu thành công</p>
                <p class="font-medium text-[#4A2A12]">{{ formatNumber(selectedCustomer.successfulReferrals) }} người</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <ShieldCheck :size="16" class="mt-0.5 text-[#9A6700]" />
              <div>
                <p class="text-xs uppercase tracking-[0.16em] text-gray-400">Trạng thái sinh viên</p>
                <p class="font-medium text-[#4A2A12]">{{ studentStatusLabel(selectedCustomer.studentStatus) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-[#EFE7DE] p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[#4A2A12]">Xác minh sinh viên</p>
            <p class="text-xs text-gray-500">Hiển thị hồ sơ gần nhất nếu khách đã gửi thẻ sinh viên.</p>
          </div>
          <span
            :class="studentStatusClass(selectedCustomer.studentStatus)"
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
          >
            {{ studentStatusLabel(selectedCustomer.studentStatus) }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-3">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <div class="rounded-xl bg-gray-50 p-3">
                <p class="text-xs text-gray-400">Ngày gửi hồ sơ</p>
                <p class="mt-1 font-medium text-[#4A2A12]">{{ formatDateTime(selectedVerification?.submittedAt) }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-3">
                <p class="text-xs text-gray-400">Ngày xử lý</p>
                <p class="mt-1 font-medium text-[#4A2A12]">{{ formatDateTime(selectedVerification?.reviewedAt) }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-3">
                <p class="text-xs text-gray-400">Người duyệt</p>
                <p class="mt-1 font-medium text-[#4A2A12]">{{ selectedVerification?.approvedBy || '—' }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-3">
                <p class="text-xs text-gray-400">Người từ chối</p>
                <p class="mt-1 font-medium text-[#4A2A12]">{{ selectedVerification?.rejectedBy || '—' }}</p>
              </div>
            </div>
            <div class="rounded-xl bg-gray-50 p-3 text-sm">
              <p class="text-xs text-gray-400">Lý do từ chối</p>
              <p class="mt-1 font-medium text-[#4A2A12]">{{ selectedVerification?.rejectReason || '—' }}</p>
            </div>
          </div>
          <div>
            <div
              v-if="selectedVerification?.image"
              class="overflow-hidden rounded-2xl border border-gray-200 bg-[#FFFDF8] p-3"
            >
              <p class="mb-3 text-xs uppercase tracking-[0.16em] text-gray-400">Ảnh thẻ sinh viên</p>
              <img
                :src="selectedVerification.image"
                alt="Student card"
                class="max-h-72 w-full rounded-xl object-contain bg-white"
              />
            </div>
            <div
              v-else
              class="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm text-gray-400"
            >
              Khách hàng chưa có ảnh thẻ sinh viên.
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
        <button
          :class="
            selectedCustomer.accountStatus === 'ACTIVE'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          "
          class="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors"
          @click="toggleStatus(selectedCustomer)"
        >
          {{ selectedCustomer.accountStatus === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản' }}
        </button>
        <button
          v-if="selectedCustomer.studentStatus === 'PENDING'"
          class="flex-1 rounded-xl bg-[#F2B233] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#E0A020]"
          @click="openVerifyModal(selectedCustomer)"
        >
          Mở xét duyệt thẻ sinh viên
        </button>
        <button
          class="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          @click="showDetailModal = false"
        >
          Đóng
        </button>
      </div>
    </div>
  </Modal>

  <!-- Verify Student Modal -->
  <Modal v-model="showVerifyModal" title="Xác Minh Thẻ Sinh Viên" size="lg">
    <div v-if="selectedCustomer" class="space-y-5">
      <div class="flex flex-col gap-4 rounded-2xl bg-[#FFF8EC] p-4 md:flex-row md:items-start md:justify-between">
        <div
          class="w-14 h-14 rounded-full bg-[#F2B233]/20 flex items-center justify-center text-[#9A6700] font-bold text-lg flex-shrink-0 overflow-hidden"
        >
          <img
            v-if="selectedCustomer.avatar"
            :src="selectedCustomer.avatar"
            class="w-full h-full object-cover rounded-full"
          />
          <span v-else>{{ getInitials(selectedCustomer.name) }}</span>
        </div>
        <div class="flex-1 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-semibold text-[#4A2A12]">{{ selectedCustomer.name }}</h3>
            <span
              :class="accountStatusClass(selectedCustomer.accountStatus)"
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            >
              {{ accountStatusLabel(selectedCustomer.accountStatus) }}
            </span>
          </div>
          <div class="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{{ selectedCustomer.phone }}</span>
            <span>Mã KH: {{ selectedCustomer.userCode }}</span>
            <span>{{ formatNumber(selectedCustomer.totalBookings) }} chuyến</span>
          </div>
          <span
            :class="studentStatusClass(selectedCustomer.studentStatus)"
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
          >
            {{ studentStatusLabel(selectedCustomer.studentStatus) }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
            <div class="rounded-xl bg-gray-50 p-3">
              <p class="text-xs text-gray-400">Ngày gửi hồ sơ</p>
              <p class="mt-1 font-semibold text-[#4A2A12]">{{ formatDateTime(selectedVerification?.submittedAt) }}</p>
            </div>
            <div class="rounded-xl bg-gray-50 p-3">
              <p class="text-xs text-gray-400">Ngày tham gia</p>
              <p class="mt-1 font-semibold text-[#4A2A12]">{{ formatDate(selectedCustomer.createDate) }}</p>
            </div>
            <div class="rounded-xl bg-gray-50 p-3">
              <p class="text-xs text-gray-400">Điểm thưởng</p>
              <p class="mt-1 font-semibold text-[#4A2A12]">{{ formatNumber(selectedCustomer.loyaltyPoints) }} điểm</p>
            </div>
            <div class="rounded-xl bg-gray-50 p-3">
              <p class="text-xs text-gray-400">Giới thiệu thành công</p>
              <p class="mt-1 font-semibold text-[#4A2A12]">{{ formatNumber(selectedCustomer.successfulReferrals) }} người</p>
            </div>
          </div>

          <div class="rounded-2xl border border-[#EFE7DE] p-4 text-sm">
            <p class="font-semibold text-[#4A2A12]">Ghi chú xét duyệt</p>
            <p class="mt-2 leading-6 text-gray-600">
              Kiểm tra ảnh thẻ sinh viên, đối chiếu thông tin khách hàng và chỉ phê duyệt khi hồ sơ hợp lệ.
            </p>
            <div class="mt-3 rounded-xl bg-gray-50 p-3">
              <p class="text-xs text-gray-400">Lý do từ chối gần nhất</p>
              <p class="mt-1 font-medium text-[#4A2A12]">{{ selectedVerification?.rejectReason || '—' }}</p>
            </div>
          </div>
        </div>

        <div>
          <div
            v-if="selectedVerification?.image"
            class="overflow-hidden rounded-2xl border border-gray-200 bg-[#FFFDF8] p-3"
          >
            <p class="mb-3 text-xs uppercase tracking-[0.16em] text-gray-400">Ảnh thẻ sinh viên</p>
            <img
              :src="selectedVerification.image"
              alt="Student card"
              class="max-h-80 w-full rounded-xl object-contain bg-white"
            />
          </div>
          <div
            v-else
            class="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm text-gray-400"
          >
            Không có ảnh thẻ sinh viên
          </div>
        </div>
      </div>

      <div
        v-if="customerStore.error"
        class="rounded-xl bg-red-50 p-3 text-sm text-red-600"
      >
        {{ customerStore.error }}
      </div>

      <div class="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
        <button
          class="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          @click="showVerifyModal = false"
        >
          Hủy
        </button>
        <button
          class="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          :disabled="customerStore.loading"
          @click="confirmVerify('REJECT')"
        >
          Từ chối
        </button>
        <button
          class="flex-1 rounded-xl bg-green-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
          :disabled="customerStore.loading"
          @click="confirmVerify('APPROVE')"
        >
          Phê duyệt
        </button>
      </div>
    </div>
  </Modal>

  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showStatusConfirmModal && pendingStatusCustomer"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="closeStatusConfirm"
      >
        <div class="w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-lg">
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#F59E0B]">
              Cập nhật trạng thái khách hàng
            </p>
            <h3 class="text-xl font-bold text-[#4A2A12]">
              Xác nhận
              {{ pendingStatusCustomer.accountStatus === 'ACTIVE' ? 'tạm khóa' : 'kích hoạt' }}
              tài khoản này?
            </h3>
            <p class="text-sm leading-6 text-gray-500">
              Khách hàng <strong>{{ pendingStatusCustomer.name }}</strong>
              ({{ pendingStatusCustomer.phone }}) sẽ chuyển từ
              <strong>{{ accountStatusLabel(pendingStatusCustomer.accountStatus) }}</strong>
              sang
              <strong>{{ accountStatusLabel(nextAccountStatus(pendingStatusCustomer.accountStatus)) }}</strong>.
            </p>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="h-11 rounded-xl border border-gray-300 px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              @click="closeStatusConfirm"
            >
              Không
            </button>
            <button
              type="button"
              class="h-11 rounded-xl bg-[#F59E0B] px-5 text-sm font-medium text-white transition-colors hover:bg-[#D97706] disabled:opacity-60"
              :disabled="customerStore.loading"
              @click="confirmToggleStatus"
            >
              {{ customerStore.loading ? 'Đang cập nhật...' : 'Có' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
