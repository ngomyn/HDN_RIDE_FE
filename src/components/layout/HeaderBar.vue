<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCustomerStore } from "@/stores/customers";
import { useNotificationStore, type AppNotification } from "@/stores/notifications";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import TextInput from "@/components/ui/TextInput.vue";
import { MapPin, Award, CheckCircle, Bell, ChevronDown, User, LogOut } from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const customerStore = useCustomerStore();

const props = defineProps<{ sidebarOpen?: boolean }>();

const showNotifications = ref(false);
const showAdminMenu = ref(false);
const showProfileModal = ref(false);
const profileEditMode = ref(false);
const profileForm = ref({ fullName: "", email: "", phone: "" });
const notifDropdownRef = ref<HTMLElement | null>(null);
const adminMenuRef = ref<HTMLElement | null>(null);

const routeTitleMap: Record<string, string> = {
  dashboard: 'Tổng quan',
  trips: 'Quản lý chuyến xe',
  bookings: 'Quản lý đặt chỗ',
  drivers: 'Quản lý tài xế',
  customers: 'Quản lý khách hàng',
  'student-verifications': 'Xác minh sinh viên',
  revenue: 'Quản lý doanh thu',
  settings: 'Cài đặt',
}

const currentTitle = computed(() => {
  const currentRoute = router.currentRoute.value.name
  return typeof currentRoute === 'string' ? (routeTitleMap[currentRoute] ?? 'HDN Ride') : 'HDN Ride'
})

const userInitials = computed(() => {
  const name = authStore.profile.fullName.trim()
  if (!name) return authStore.userRole === 'MANAGER' ? 'MG' : 'AD'

  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
})

onMounted(() => {
  profileForm.value = {
    fullName: authStore.profile.fullName,
    email: authStore.profile.email,
    phone: authStore.profile.phone,
  };
  document.addEventListener("mousedown", handleOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleOutsideClick);
});

const handleOutsideClick = (event: MouseEvent) => {
  if (
    showNotifications.value &&
    notifDropdownRef.value &&
    !notifDropdownRef.value.contains(event.target as Node)
  ) {
    showNotifications.value = false;
  }
  if (
    showAdminMenu.value &&
    adminMenuRef.value &&
    !adminMenuRef.value.contains(event.target as Node)
  ) {
    showAdminMenu.value = false;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

const handleSaveProfile = async () => {
  await authStore.updateProfile(profileForm.value);
  profileEditMode.value = false;
};

const handleOpenProfile = () => {
  showAdminMenu.value = false
  showProfileModal.value = true
}

const handleNotificationClick = async (notification: AppNotification) => {
  notificationStore.markRead(notification.id);
  showNotifications.value = false;

  if (notification.type === "new_booking") {
    const payload = notification.payload as { bookingId?: string };

    if (payload.bookingId) {
      notificationStore.setPendingBookingIntent(payload.bookingId);
    }

    if (router.currentRoute.value.name !== "bookings") {
      await router.push("/bookings");
    }

    return;
  }

  if (notification.type === "student_card_uploaded") {
    const payload = notification.payload as { userId?: string; verificationId?: number };

    if (payload.userId) {
      customerStore.queueVerificationIntent(payload.userId, payload.verificationId);
    }

    if (router.currentRoute.value.name !== "customers") {
      await router.push("/customers");
    }
  }
};

const getNotificationTitle = (type: string): string => {
  if (type === "new_booking") return "Đặt chỗ mới";
  if (type === "student_card_uploaded") return "Xác minh sinh viên";
  return "Thông báo";
};

const formatNotifTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return date.toLocaleDateString("vi-VN");
};
</script>

<template>
  <header
    :class="[
      'fixed top-0 right-0 h-16 bg-white border-b border-[#E8E8E8] shadow-sm flex items-center justify-between px-6 z-40 transition-all duration-300',
      props.sidebarOpen !== false ? 'left-[260px]' : 'left-[80px]',
    ]"
  >
    <div class="flex-1 min-w-0">
      <h2 class="text-lg font-semibold text-[#4A2A12] truncate">{{ currentTitle }}</h2>
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-4">
      <!-- Notifications Bell -->
      <div class="relative" ref="notifDropdownRef">
        <button
          class="relative w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
          @click="showNotifications = !showNotifications"
        >
          <Bell :size="20" class="text-[#4A2A12]" />
          <span
            v-if="notificationStore.unreadCount > 0"
            class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
          </span>
        </button>

        <!-- Notifications Dropdown -->
        <transition name="dropdown">
          <div
            v-if="showNotifications"
            class="absolute right-0 top-12 w-[400px] bg-white rounded-lg shadow-xl border border-gray-200 max-h-[520px] overflow-hidden flex flex-col z-50"
          >
            <div
              class="border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0"
            >
              <h3 class="font-semibold text-[#4A2A12]">Thông báo</h3>
              <button
                v-if="notificationStore.unreadCount > 0"
                class="text-xs text-blue-600 hover:text-blue-700 font-medium"
                @click="notificationStore.markAllRead()"
              >
                Đánh dấu đã đọc tất cả
              </button>
            </div>
            <div class="divide-y divide-gray-100 overflow-y-auto">
              <div
                v-for="notif of notificationStore.recentNotifications"
                :key="notif.id"
                :class="[
                  'px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3',
                  notif.read ? 'opacity-60' : 'bg-yellow-50',
                ]"
                @click="handleNotificationClick(notif)"
              >
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                  :class="notif.type === 'new_booking' ? 'bg-blue-100' : 'bg-orange-100'"
                >
                  <MapPin v-if="notif.type === 'new_booking'" :size="16" class="text-blue-600" />
                  <Award v-else-if="notif.type === 'student_card_uploaded'" :size="16" class="text-orange-600" />
                  <CheckCircle v-else :size="16" class="text-green-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-[#4A2A12]">{{ getNotificationTitle(notif.type) }}</p>
                  <p class="text-xs text-gray-600 mt-0.5 line-clamp-2">{{ notif.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatNotifTime(notif.createdAt) }}</p>
                </div>
              </div>
              <div
                v-if="notificationStore.recentNotifications.length === 0"
                class="px-4 py-8 text-center text-gray-500 text-sm"
              >
                Không có thông báo
              </div>
            </div>
            <div v-if="notificationStore.recentNotifications.length > 0" class="border-t border-gray-200 px-4 py-3 text-center">
              <button class="text-sm font-medium text-[#F2B233] hover:text-[#E0A020] transition-colors">
                Xem tất cả thông báo
              </button>
            </div>
          </div>
        </transition>
      </div>

      <div class="relative pl-4 border-l border-gray-200" ref="adminMenuRef">
        <button
          class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
          @click="showAdminMenu = !showAdminMenu"
        >
          <div class="w-9 h-9 rounded-full bg-[#F2B233] text-white font-semibold flex items-center justify-center">
            {{ userInitials }}
          </div>
          <div class="text-right hidden sm:block">
            <p class="text-sm font-medium text-gray-900">
              {{ authStore.profile.fullName }}
            </p>
            <p class="text-xs text-gray-600">{{ authStore.profile.role }}</p>
          </div>
          <ChevronDown :size="16" class="text-gray-500" />
        </button>

        <transition name="dropdown">
          <div v-if="showAdminMenu" class="absolute right-0 top-12 w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
            <div class="py-2">
              <button class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-[#4A2A12] hover:bg-gray-50 transition-colors" @click="handleOpenProfile">
                <User :size="18" class="text-gray-600" />
                Hồ sơ cá nhân
              </button>
              <button class="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors" @click="handleLogout">
                <LogOut :size="18" />
                Đăng xuất
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </header>

  <Modal v-model="showProfileModal" title="Hồ Sơ Quản Trị Viên" size="md">
    <div class="space-y-4">
      <div v-if="!profileEditMode" class="space-y-3">
        <div class="flex items-center justify-center mb-4">
          <div
            class="w-16 h-16 rounded-full bg-[#F2B233] text-white font-bold flex items-center justify-center text-2xl"
          >
            {{ userInitials }}
          </div>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <p class="text-xs text-gray-600">Họ Và Tên</p>
          <p class="font-medium text-gray-900">
            {{ authStore.profile.fullName }}
          </p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <p class="text-xs text-gray-600">Email</p>
          <p class="font-medium text-gray-900">{{ authStore.profile.email }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <p class="text-xs text-gray-600">Điện Thoại</p>
          <p class="font-medium text-gray-900">{{ authStore.profile.phone }}</p>
        </div>
        <div class="pt-4 flex gap-3">
          <Button
            variant="secondary"
            class="flex-1"
            @click="profileEditMode = true"
          >
            Chỉnh Sửa
          </Button>
          <Button variant="danger" class="flex-1" @click="handleLogout">
            Đăng Xuất
          </Button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <TextInput v-model="profileForm.fullName" label="Họ Và Tên" />
        <TextInput v-model="profileForm.email" label="Email" type="email" />
        <TextInput v-model="profileForm.phone" label="Điện Thoại" />
        <div class="flex gap-3 pt-4">
          <Button
            variant="secondary"
            class="flex-1"
            @click="profileEditMode = false"
          >
            Hủy
          </Button>
          <Button
            class="flex-1"
            :loading="authStore.loading"
            @click="handleSaveProfile"
          >
            Lưu
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
