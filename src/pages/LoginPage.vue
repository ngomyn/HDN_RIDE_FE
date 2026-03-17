<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/Button.vue'
import TextInput from '@/components/ui/TextInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const phone = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  if (!phone.value || !password.value) {
    error.value = 'Vui Lòng Nhập Điện Thoại Và Mật Khẩu'
    return
  }
  await authStore.login(phone.value, password.value)
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    error.value = authStore.error || 'Dang nhap that bai'
  }
}

const handleDemoLogin = () => {
  phone.value = '0905123456'
  password.value = 'admin123'
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left: Background -->
    <div class="hidden lg:flex flex-1 bg-cover bg-center relative" style="background-image: url('/design/Login.png')">
      <div class="absolute inset-0 bg-black bg-opacity-40" />
      <div class="relative flex flex-col items-center justify-center w-full h-full text-white">
        <img src="/design/Login.png" alt="HDN Logo" class="w-32 h-32 mb-8 drop-shadow-lg" />
        <h1 class="text-4xl font-bold text-center mb-2">HDN RIDE ADMIN</h1>
            <p class="text-xl text-center text-gray-200">Dịch Vụ Xe Ghép Huế - Đà Nẵng</p>
      </div>
    </div>

    <!-- Right: Login Form -->
    <div class="flex-1 flex items-center justify-center px-6 py-12 bg-white">
      <div class="w-full max-w-md">
        <div class="text-center mb-8 lg:hidden">
          <h1 class="text-3xl font-bold text-brand-brown mb-2">Đăng Nhập Admin</h1>
          <p class="text-gray-600">Quản Lý Chuyến Xe Và Đặt Chỗ</p>
        </div>

        <div class="hidden lg:text-center mb-8">
          <h1 class="text-2xl font-bold text-brand-brown mb-2">Đăng Nhập Admin</h1>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-status-danger rounded-lg">
          <p class="text-sm text-status-danger">{{ error }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <TextInput
            v-model="phone"
            type="tel"
            label="Điện Thoại"
            placeholder="0905123456"
            :disabled="authStore.loading"
          />

          <TextInput
            v-model="password"
            type="password"
            label="Mật Khẩu"
            placeholder="Nhập mật khẩu"
            :disabled="authStore.loading"
          />

          <Button
            type="submit"
            variant="primary"
            class="w-full"
            :loading="authStore.loading"
          >
            Đăng Nhập
          </Button>
        </form>

        <!-- Demo Button -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <button
            @click="handleDemoLogin"
            class="text-sm text-brand-gold hover:underline font-medium"
          >
            Hoặc Sử Dụng Tài Khoản Demo
          </button>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center text-xs text-gray-600">
          <p>© 2026 HDN Ride. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'LoginPage',
}
</script>
