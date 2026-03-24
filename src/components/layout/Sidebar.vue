<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed, onMounted } from "vue";
import MenuDashboardIcon from "../icon/MenuDashboardIcon.vue";
import MenuTripStatusIcon from "../icon/MenuTripStatusIcon.vue";
import MenuBookingIcon from "../icon/MenuBookingIcon.vue";
import MenuDriverIcon from "../icon/MenuDriverIcon.vue";
import MenuStudentIcon from "../icon/MenuStudentIcon.vue";
import MenuCustomerIcon from "../icon/MenuDriverIcon.vue";
import { useStudentVerificationStore } from "@/stores/studentVerifications";
import { useNotificationStore } from "@/stores/notifications";

const router = useRouter();
const currentRoute = computed(() => router.currentRoute.value.name);
const studentStore = useStudentVerificationStore();
const notifStore = useNotificationStore();

onMounted(() => {
  studentStore.fetchPendingCount();
});

const newBookingCount = computed(
  () => notifStore.notifications.filter((n) => n.type === "new_booking" && !n.read).length
);

const menuItems = [
  {
    name: "dashboard",
    label: "Tổng Quan",
    icon: MenuDashboardIcon,
    path: "/dashboard",
  },
  {
    name: "trips",
    label: "Quản Lý Chuyến Xe",
    icon: MenuTripStatusIcon,
    path: "/trips",
  },
  {
    name: "bookings",
    label: "Quản Lý Đặt Chỗ",
    icon: MenuBookingIcon,
    path: "/bookings",
  },
  {
    name: "drivers",
    label: "Quản Lý Tài Xế",
    icon: MenuDriverIcon,
    path: "/drivers",
  },
  {
    name: "customers",
    label: "Quản Lý Khách Hàng",
    icon: MenuCustomerIcon,
    path: "/customers",
  },
  {
    name: "student-verifications",
    label: "Xác Minh Sinh Viên",
    icon: MenuStudentIcon,
    path: "/student-verifications",
  },
];
</script>

<template>
  <aside
    class="fixed left-0 top-0 w-[260px] h-screen bg-brand-brown text-white overflow-y-auto shadow-lg"
  >
    <!-- Logo -->
    <div class="p-6 border-b border-yellow-700 flex items-center gap-3">
      <img
        src="@/assets/HDN-logo.jpg"
        alt="HDN"
        class="w-[44px] h-[44px] rounded-[100%]"
      />
      <div>
        <h1 class="font-bold text-lg">HDN RIDE</h1>
        <p class="text-xs text-yellow-200">Admin</p>
      </div>
    </div>

    <!-- Menu -->
    <nav class="py-4">
      <div class="space-y-2">
        <router-link
          v-for="item of menuItems"
          :key="item.name"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-4 py-3 transition-all duration-200',
            currentRoute === item.name
              ? 'font-semibold border-l-2 border-yellow-500'
              : 'text-yellow-50 hover:bg-yellow-700',
          ]"
          :style="
            currentRoute === item.name
              ? { color: '#F2B233', backgroundColor: 'rgba(242, 178, 51, 0.1)' }
              : {}
          "
        >
          <component
            :is="item.icon"
            :active="currentRoute === item.name"
            class="flex-shrink-0"
          />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.name === 'student-verifications' && studentStore.pendingCount > 0"
            class="min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1"
          >
            {{ studentStore.pendingCount }}
          </span>
          <span
            v-if="item.name === 'bookings' && newBookingCount > 0"
            class="min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1"
          >
            {{ newBookingCount }}
          </span>
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script lang="ts">
export default {
  name: "Sidebar",
};
</script>
