<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import TextInput from "@/components/ui/TextInput.vue";

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const showNotifications = ref(false);
const showProfileModal = ref(false);
const profileEditMode = ref(false);
const profileForm = ref({ fullName: "", email: "", phone: "" });

onMounted(() => {
  profileForm.value = {
    fullName: authStore.profile.fullName,
    email: authStore.profile.email,
    phone: authStore.profile.phone,
  };
});

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

const handleSaveProfile = async () => {
  await authStore.updateProfile(profileForm.value);
  profileEditMode.value = false;
};

const handleNotificationClick = (id: number) => {
  notificationStore.markAsRead(id);
};
</script>

<template>
  <header
    class="fixed top-0 right-0 left-[260px] h-16 bg-white border-b border-gray-200 shadow-soft flex items-center justify-between px-6 z-40"
  >
    <!-- Search or Breadcrumb -->
    <div class="flex-1">
      <h2 class="text-lg font-semibold text-gray-900">HDN Ride Admin</h2>
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-4">
      <!-- Notifications Bell -->
      <div class="relative">
        <button
          class="relative w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-xl"
          @click="showNotifications = !showNotifications"
        >
          🔔
          <span
            v-if="notificationStore.unreadCount > 0"
            class="absolute top-1 right-1 w-5 h-5 bg-status-danger text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {{ notificationStore.unreadCount }}
          </span>
        </button>

        <!-- Notifications Dropdown -->
        <transition name="dropdown">
          <div
            v-if="showNotifications"
            class="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50"
          >
            <div
              class="border-b border-gray-200 p-4 flex items-center justify-between"
            >
              <h3 class="font-semibold text-gray-900">Thông Báo</h3>
              <button
                v-if="notificationStore.unreadCount > 0"
                class="text-xs text-brand-gold hover:underline"
                @click="notificationStore.markAllAsRead()"
              >
                Đánh Dấu Tất Cả Đã Đọc
              </button>
            </div>
            <div class="divide-y divide-gray-100">
              <div
                v-for="notif of notificationStore.items"
                :key="notif.id"
                :class="[
                  'px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
                  notif.read ? 'opacity-60' : 'bg-yellow-50',
                ]"
                @click="handleNotificationClick(notif.id)"
              >
                <p class="font-medium text-sm text-gray-900">
                  {{ notif.title }}
                </p>
                <p class="text-xs text-gray-600 mt-1">{{ notif.message }}</p>
                <p class="text-xs text-gray-500 mt-2">{{ notif.createdAt }}</p>
              </div>
              <div
                v-if="notificationStore.items.length === 0"
                class="px-4 py-8 text-center text-gray-500 text-sm"
              >
                Không Có Thông Báo
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- User Menu -->
      <div class="flex items-center gap-3 pl-4 border-l border-gray-200">
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900">
            {{ authStore.profile.fullName }}
          </p>
          <p class="text-xs text-gray-600">{{ authStore.profile.role }}</p>
        </div>
        <button
          class="w-10 h-10 rounded-full bg-brand-gold text-brand-brown font-bold flex items-center justify-center hover:bg-yellow-500 transition-colors"
          @click="showProfileModal = true"
        >
          {{ authStore.profile.fullName.charAt(0) }}
        </button>
      </div>
    </div>
  </header>

  <!-- Profile Modal -->
  <Modal v-model="showProfileModal" title="Hồ Sơ Quản Trị Viên" size="md">
    <div class="space-y-4">
      <div v-if="!profileEditMode" class="space-y-3">
        <div class="flex items-center justify-center mb-4">
          <div
            class="w-16 h-16 rounded-full bg-brand-gold text-brand-brown font-bold flex items-center justify-center text-2xl"
          >
            {{ authStore.profile.fullName.charAt(0) }}
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
