<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const phone = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const error = ref('')

const getStoredPhone = () => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('hdn-admin-last-phone') || ''
}

phone.value = getStoredPhone()

const handleLogin = async () => {
  error.value = ''
  if (!phone.value || !password.value) {
    error.value = 'Vui lòng nhập số điện thoại và mật khẩu.'
    return
  }
  await authStore.login(phone.value, password.value)
  if (authStore.isAuthenticated) {
    if (rememberMe.value) {
      localStorage.setItem('hdn-admin-last-phone', phone.value)
    } else {
      localStorage.removeItem('hdn-admin-last-phone')
    }
    router.push(authStore.homeRoute)
  } else {
    error.value = authStore.error || 'Đăng nhập thất bại. Vui lòng thử lại.'
  }
}
</script>

<template>
  <div class="flex min-h-screen bg-white">
    <div
      class="relative hidden lg:block lg:w-[55%]"
      style="background-image: url('/design/Login.png')"
    >
      <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('/design/Login.png')" />
      <div class="absolute inset-0 bg-gradient-to-br from-[#4A2A12]/92 via-[#4A2A12]/84 to-[#2F180C]/72" />
      <div class="relative flex h-full flex-col items-center justify-center gap-5 px-10 text-center">
        <img
          src="@/assets/HDN-logo.jpg"
          alt="HDN Ride Logo"
          class="h-64 w-64 rounded-full object-contain shadow-2xl ring-4 ring-white/10"
        />
        <p class="max-w-md text-xl font-medium text-white">
          Dịch vụ đặt xe Huế - Đà Nẵng
        </p>
      </div>
    </div>

    <div class="flex w-full items-center justify-center bg-white px-6 py-10 lg:w-[45%] lg:px-0">
      <div class="w-full max-w-md lg:px-12">
        <div class="mb-6 flex justify-center lg:hidden">
          <img src="@/assets/HDN-logo.jpg" alt="HDN" class="h-20 w-20 rounded-full object-contain shadow-lg" />
        </div>

        <div class="mb-8 space-y-2">
          <h1 class="text-[28px] font-bold text-[#4A2A12]">Đăng nhập hệ thống</h1>
          <p class="text-sm text-gray-500">Sử dụng tài khoản quản trị hoặc quản lý để truy cập HDN Ride.</p>
        </div>

        <div v-if="error" class="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="phone" class="block text-sm font-semibold text-[#4A2A12] mb-2">
              Số điện thoại
            </label>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              :disabled="authStore.loading"
              class="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors disabled:opacity-60"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-semibold text-[#4A2A12] mb-2">
              Mật khẩu
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Nhập mật khẩu"
                :disabled="authStore.loading"
                class="w-full h-12 px-4 pr-12 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors disabled:opacity-60"
              />
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="20" />
                <Eye v-else :size="20" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <input
                id="remember"
                v-model="rememberMe"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 accent-[#F2B233]"
              />
              <label for="remember" class="cursor-pointer text-sm text-[#4A2A12]">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <input
              class="sr-only"
              aria-hidden="true"
            >
            <a href="#" class="text-sm text-[#F2B233] hover:text-[#E0A020] transition-colors">Quên mật khẩu?</a>
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#F2B233] font-bold text-white shadow-md transition-colors hover:bg-[#E0A020] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="authStore.loading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{{ authStore.loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</span>
          </button>
        </form>

        <p class="mt-8 text-center text-xs text-gray-400">
          © 2026 HDN Ride. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'LoginPage',
}
</script>
