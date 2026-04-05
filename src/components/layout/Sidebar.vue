<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import MenuDashboardIcon from "../icon/MenuDashboardIcon.vue";
import MenuTripStatusIcon from "../icon/MenuTripStatusIcon.vue";
import MenuBookingIcon from "../icon/MenuBookingIcon.vue";
import MenuDriverIcon from "../icon/MenuDriverIcon.vue";
import MenuCustomerIcon from "../icon/MenuDriverIcon.vue";
import { useNotificationStore } from "@/stores/notifications";
import { ChevronLeft, ChevronRight, DollarSign, Settings } from "lucide-vue-next";
import type { Role } from "@/types/api";

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ toggle: [] }>();

const router = useRouter();
const authStore = useAuthStore();
const currentRoute = computed(() => router.currentRoute.value.name);
const notifStore = useNotificationStore();

const newBookingCount = computed(
  () => notifStore.notifications.filter((n) => n.type === "new_booking" && !n.read).length
);

const menuItems = [
  {
    name: "dashboard",
    label: "Tổng Quan",
    icon: MenuDashboardIcon,
    path: "/dashboard",
    allowedRoles: ["ADMIN", "MANAGER"] as Role[],
  },
  {
    name: "trips",
    label: "Quản Lý Chuyến Xe",
    icon: MenuTripStatusIcon,
    path: "/trips",
    allowedRoles: ["ADMIN", "MANAGER"] as Role[],
  },
  {
    name: "bookings",
    label: "Quản Lý Đặt Chỗ",
    icon: MenuBookingIcon,
    path: "/bookings",
    allowedRoles: ["ADMIN", "MANAGER"] as Role[],
  },
  {
    name: "drivers",
    label: "Quản Lý Tài Xế",
    icon: MenuDriverIcon,
    path: "/drivers",
    allowedRoles: ["ADMIN", "MANAGER"] as Role[],
  },
  {
    name: "customers",
    label: "Quản Lý Khách Hàng",
    icon: MenuCustomerIcon,
    path: "/customers",
    allowedRoles: ["ADMIN", "MANAGER"] as Role[],
  },
  {
    name: "revenue",
    label: "Quản Lý Doanh Thu",
    icon: DollarSign,
    path: "/revenue",
    allowedRoles: ["MANAGER"] as Role[],
  },
  {
    name: "settings",
    label: "Cài Đặt",
    icon: Settings,
    path: "/settings",
    allowedRoles: ["MANAGER"] as Role[],
  },
];

const visibleMenuItems = computed(() =>
  menuItems.filter((item) => authStore.canAccess(item.allowedRoles))
);

const portalLabel = computed(() =>
  authStore.userRole === "MANAGER" ? "Quản lý" : "Quản trị viên"
);

const userInitials = computed(() => {
  const name = authStore.profile.fullName.trim()
  if (!name) return authStore.userRole === 'MANAGER' ? 'MG' : 'AD'

  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
})
</script>

<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-screen bg-[#4A2A12] text-white shadow-lg flex flex-col transition-all duration-300 overflow-hidden',
      props.isOpen ? 'w-[260px]' : 'w-[80px]',
    ]"
  >
    <div
      :class="[
        'border-b border-white/10 flex-shrink-0',
        props.isOpen ? 'p-6' : 'p-4 flex justify-center',
      ]"
    >
      <div :class="['flex items-center', props.isOpen ? 'gap-3' : 'justify-center']">
        <div class="w-12 h-12 rounded-full bg-[#F2B233] text-white font-semibold flex items-center justify-center flex-shrink-0 shadow-sm">
          {{ userInitials }}
        </div>
        <div v-if="props.isOpen" class="min-w-0">
          <p class="font-semibold text-sm truncate">{{ authStore.profile.fullName || 'HDN Ride' }}</p>
          <p class="text-sm text-[#F2B233] truncate">{{ portalLabel }}</p>
        </div>
      </div>
    </div>

    <!-- Menu -->
    <nav class="py-3 flex-1 overflow-y-auto">
      <div class="space-y-1">
        <router-link
          v-for="item of visibleMenuItems"
          :key="item.name"
          :to="item.path"
          :title="!props.isOpen ? item.label : undefined"
          :class="[
            'flex items-center py-3 transition-all duration-200 relative',
            props.isOpen ? 'gap-3 px-4' : 'justify-center px-0',
            currentRoute === item.name
              ? 'font-semibold border-l-[3px] border-[#F2B233] bg-[#F2B233]/10 text-[#F2B233]'
              : 'text-white hover:bg-white/5',
          ]"
        >
          <component
            :is="item.icon"
            :active="currentRoute === item.name"
            :size="20"
            class="flex-shrink-0"
          />
          <span v-if="props.isOpen" class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ item.label }}</span>
          <!-- Badges (only when open) -->
          <span
            v-if="props.isOpen && item.name === 'bookings' && newBookingCount > 0"
            class="min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1"
          >
            {{ newBookingCount }}
          </span>
          <!-- Collapsed badge dot -->
          <span
            v-if="!props.isOpen && item.name === 'bookings' && newBookingCount > 0"
            class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
          />
        </router-link>
      </div>
    </nav>

    <!-- Toggle Button -->
    <button
      :class="[
        'flex items-center justify-center border-t border-white/10 h-16 flex-shrink-0 hover:bg-white/5 transition-colors text-white/80',
      ]"
      @click="emit('toggle')"
    >
      <ChevronLeft v-if="props.isOpen" :size="20" />
      <ChevronRight v-else :size="20" />
    </button>
  </aside>
</template>

<script lang="ts">
export default {
  name: "Sidebar",
};
</script>
