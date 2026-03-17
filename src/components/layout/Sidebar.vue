<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed } from "vue";
import MenuDashboardIcon from "../icon/MenuDashboardIcon.vue";
import MenuTripStatusIcon from "../icon/MenuTripStatusIcon.vue";
import MenuCreateTripIcon from "../icon/MenuCreateTripIcon.vue";
import MenuBookingIcon from "../icon/MenuBookingIcon.vue";

const router = useRouter();
const currentRoute = computed(() => router.currentRoute.value.name);

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
          <span>{{ item.label }}</span>
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
