<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePricingStore } from '@/stores/pricing'
import { apiClient } from '@/utils/apiClient'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { Save, RefreshCw, Clock3 } from 'lucide-vue-next'
import type { OperationalSettings, PriceConfig, Route, VehicleType } from '@/types/api'

const pricingStore = usePricingStore()
const routes = ref<Route[]>([])
const editedPrices = ref<Record<number, string>>({})
const feeSaving = ref(false)
const feeSuccess = ref(false)
const runtimeSettings = ref<OperationalSettings | null>(null)
const runtimeForm = ref({
  bookingOpenTime: '06:00',
  bookingCloseTime: '20:00',
  notificationRetentionDays: 30,
  bankCode: '',
  bankName: '',
  bankAccountNumber: '',
  bankAccountName: '',
})
const runtimeLoading = ref(false)
const runtimeSaving = ref(false)
const runtimeError = ref('')
const runtimeSuccess = ref(false)

const vehicleTypeOrder: Record<Exclude<VehicleType, null>, number> = {
  SEAT_4: 1,
  SEAT_7: 2,
  SEAT_9: 3,
  SEAT_16: 4,
}

const routeCards = computed(() => {
  return routes.value.slice(0, 2).map((route) => {
    const configs = pricingStore.configs.filter((config) => config.routeId === route.id)
    const sharedConfig = configs.find((config) => config.pricingType === 'SHARED') ?? null
    const privateConfigs = configs
      .filter((config) => config.pricingType === 'PRIVATE')
      .sort((left, right) => {
        const leftOrder = left.vehicleType ? vehicleTypeOrder[left.vehicleType] : 999
        const rightOrder = right.vehicleType ? vehicleTypeOrder[right.vehicleType] : 999
        return leftOrder - rightOrder
      })

    return {
      route,
      sharedConfig,
      privateConfigs,
    }
  })
})

const activePrivateConfigs = computed(() => {
  return pricingStore.configs.filter((config) => config.pricingType === 'PRIVATE' && config.isActive !== false).length
})

const getEditedPrice = (config: PriceConfig): string => {
  if (editedPrices.value[config.id] !== undefined) return editedPrices.value[config.id]
  return String(config.price)
}

const onPriceInput = (configId: number, value: string) => {
  editedPrices.value[configId] = value.replace(/\D/g, '')
  feeSuccess.value = false
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const getVehicleTypeLabel = (vehicleType: VehicleType | null) => {
  if (vehicleType === 'SEAT_4') return '4 chỗ'
  if (vehicleType === 'SEAT_7') return '7 chỗ'
  if (vehicleType === 'SEAT_9') return '9 chỗ'
  if (vehicleType === 'SEAT_16') return '16 chỗ'
  return 'Ghép xe'
}

const loadPricingConfigs = async () => {
  const routeIds = routes.value.slice(0, 2).map((route) => route.id)
  await pricingStore.fetchConfigs(routeIds)
}

const loadRuntimeSettings = async () => {
  runtimeLoading.value = true
  runtimeError.value = ''

  try {
    const response = await apiClient.getOperationalSettings()
    runtimeSettings.value = response.data
    runtimeForm.value = {
      bookingOpenTime: response.data.bookingOpenTime,
      bookingCloseTime: response.data.bookingCloseTime,
      notificationRetentionDays: response.data.notificationRetentionDays,
      bankCode: response.data.bankCode ?? '',
      bankName: response.data.bankName ?? '',
      bankAccountNumber: response.data.bankAccountNumber ?? '',
      bankAccountName: response.data.bankAccountName ?? '',
    }
  } catch (err: unknown) {
    runtimeError.value = err instanceof Error ? err.message : 'Không thể tải cấu hình vận hành'
  } finally {
    runtimeLoading.value = false
  }
}

const saveFeeSettings = async () => {
  const changedConfigs = pricingStore.configs.filter((config) => {
    const rawValue = editedPrices.value[config.id]
    if (rawValue === undefined) return false
    const nextPrice = Number(rawValue)
    return Number.isFinite(nextPrice) && nextPrice > 0 && nextPrice !== config.price
  })

  if (changedConfigs.length === 0) {
    feeSuccess.value = true
    setTimeout(() => {
      feeSuccess.value = false
    }, 2000)
    return
  }

  feeSaving.value = true
  feeSuccess.value = false
  pricingStore.error = null

  try {
    for (const config of changedConfigs) {
      await pricingStore.updateConfig(config.id, { price: Number(editedPrices.value[config.id]) })
    }
    feeSuccess.value = true
    setTimeout(() => {
      feeSuccess.value = false
    }, 2000)
  } finally {
    feeSaving.value = false
  }
}

const saveRuntimeSettings = async () => {
  runtimeSaving.value = true
  runtimeError.value = ''
  runtimeSuccess.value = false

  try {
    const response = await apiClient.updateOperationalSettings(runtimeForm.value)
    runtimeSettings.value = response.data
    runtimeForm.value = {
      bookingOpenTime: response.data.bookingOpenTime,
      bookingCloseTime: response.data.bookingCloseTime,
      notificationRetentionDays: response.data.notificationRetentionDays,
      bankCode: response.data.bankCode ?? '',
      bankName: response.data.bankName ?? '',
      bankAccountNumber: response.data.bankAccountNumber ?? '',
      bankAccountName: response.data.bankAccountName ?? '',
    }
    runtimeSuccess.value = true
    setTimeout(() => {
      runtimeSuccess.value = false
    }, 2000)
  } catch (err: unknown) {
    runtimeError.value = err instanceof Error ? err.message : 'Không thể lưu cấu hình vận hành'
  } finally {
    runtimeSaving.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([loadPricingConfigs(), loadRuntimeSettings()])
}

onMounted(async () => {
  const routeResponse = await apiClient.getRoutes()
  routes.value = routeResponse.data ?? []
  await refreshAll()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <Breadcrumb :items="[{ label: 'Trang chủ', to: '/dashboard' }, { label: 'Cài đặt' }]" />

    <h1 class="text-2xl font-bold text-[#4A2A12]">Cài đặt</h1>

    <section class="rounded-xl bg-white p-6 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-xl font-bold text-[#4A2A12]">Cài đặt giá cước</h2>
          <p class="mt-1 text-sm text-gray-500">Tự động tải đủ cấu hình cho 2 tuyến hiện có và chỉnh trực tiếp theo từng loại xe.</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            :disabled="pricingStore.loading || feeSaving"
            @click="loadPricingConfigs"
          >
            <RefreshCw :size="16" />
            Làm mới
          </button>
          <button
            class="flex h-11 items-center gap-2 rounded-lg bg-[#F2B233] px-6 text-sm font-medium text-white transition-colors hover:bg-[#E0A020] disabled:opacity-60"
            :disabled="pricingStore.loading || feeSaving"
            @click="saveFeeSettings"
          >
            <Save :size="18" />
            {{ feeSaving ? 'Đang lưu...' : feeSuccess ? 'Đã lưu' : 'Lưu cài đặt' }}
          </button>
        </div>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article class="rounded-lg border border-gray-200 p-4">
          <p class="text-sm font-medium text-gray-500">Cấu hình ghép chuyến</p>
          <p class="mt-2 text-3xl font-bold text-[#4A2A12]">
            {{ pricingStore.configs.filter((config) => config.pricingType === 'SHARED').length }}
          </p>
        </article>
        <article class="rounded-lg border border-gray-200 p-4">
          <p class="text-sm font-medium text-gray-500">Cấu hình xe riêng đang bật</p>
          <p class="mt-2 text-3xl font-bold text-[#4A2A12]">{{ activePrivateConfigs }}</p>
        </article>
      </div>

      <div v-if="pricingStore.loading" class="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500">
        Đang tải cấu hình giá...
      </div>

      <div v-else-if="pricingStore.error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ pricingStore.error }}
      </div>

      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article
          v-for="card in routeCards"
          :key="card.route.id"
          class="rounded-lg border-2 border-gray-200 p-5"
        >
          <h3 class="mb-4 border-b border-gray-200 pb-3 text-lg font-semibold text-[#4A2A12]">
            Tuyến {{ card.route.fromCity }} - {{ card.route.toCity }}
          </h3>

          <div class="mb-5">
            <label class="mb-2 block text-sm font-medium text-gray-700">Cước ghép xe</label>
            <div v-if="card.sharedConfig" class="relative">
              <input
                :value="getEditedPrice(card.sharedConfig)"
                type="text"
                placeholder="250000"
                class="h-11 w-full rounded-lg border border-gray-300 px-4 pr-24 focus:border-[#F2B233] focus:outline-none"
                @input="onPriceInput(card.sharedConfig.id, ($event.target as HTMLInputElement).value)"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">₫/người</span>
            </div>
            <p v-if="card.sharedConfig" class="mt-1 text-xs text-gray-500">
              = {{ formatCurrency(Number(getEditedPrice(card.sharedConfig) || 0)) }}/người
            </p>
            <p v-else class="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-400">
              Chưa có cấu hình ghép xe cho tuyến này.
            </p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Cước bao xe</label>

            <div class="space-y-3">
              <div
                v-for="config in card.privateConfigs"
                :key="config.id"
                class="flex items-center gap-3"
              >
                <div class="flex h-10 w-24 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 text-sm font-medium text-gray-700">
                  {{ getVehicleTypeLabel(config.vehicleType) }}
                </div>

                <div class="relative flex-1">
                  <input
                    :value="getEditedPrice(config)"
                    type="text"
                    placeholder="800000"
                    class="h-10 w-full rounded-lg border border-gray-300 px-3 pr-12 text-sm focus:border-[#F2B233] focus:outline-none"
                    @input="onPriceInput(config.id, ($event.target as HTMLInputElement).value)"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">₫</span>
                </div>
              </div>

              <p v-if="card.privateConfigs.length === 0" class="rounded-lg border border-dashed border-gray-300 px-4 py-4 text-center text-sm text-gray-400">
                Chưa có cấu hình xe riêng cho tuyến này.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-xl bg-white p-6 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-xl font-bold text-[#4A2A12]">Cài đặt giờ đặt chỗ</h2>
          <p class="mt-1 text-sm text-gray-500">Giữ layout gần Figma nhưng map đúng API runtime settings hiện có của backend.</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            :disabled="runtimeLoading || runtimeSaving"
            @click="loadRuntimeSettings"
          >
            <RefreshCw :size="16" />
            Làm mới
          </button>
          <button
            class="flex h-11 items-center gap-2 rounded-lg bg-[#F2B233] px-6 text-sm font-medium text-white transition-colors hover:bg-[#E0A020] disabled:opacity-60"
            :disabled="runtimeLoading || runtimeSaving"
            @click="saveRuntimeSettings"
          >
            <Save :size="18" />
            {{ runtimeSaving ? 'Đang lưu...' : runtimeSuccess ? 'Đã lưu' : 'Lưu cài đặt' }}
          </button>
        </div>
      </div>

      <div v-if="runtimeLoading" class="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500">
        Đang tải cấu hình vận hành...
      </div>

      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article class="rounded-lg border-2 border-gray-200 p-5">
          <h3 class="mb-4 border-b border-gray-200 pb-3 text-lg font-semibold text-[#4A2A12]">
            Khung giờ nhận booking
          </h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Giờ bắt đầu</label>
              <input
                v-model="runtimeForm.bookingOpenTime"
                type="time"
                class="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-[#F2B233] focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Giờ kết thúc</label>
              <input
                v-model="runtimeForm.bookingCloseTime"
                type="time"
                class="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-[#F2B233] focus:outline-none"
              />
            </div>
          </div>

          <div class="mt-4 rounded-lg border border-[#F2B233] bg-[#FFF9EB] p-3 text-sm text-[#4A2A12]">
            <span class="font-semibold">Khung giờ:</span>
            {{ runtimeForm.bookingOpenTime }} - {{ runtimeForm.bookingCloseTime }}
          </div>
        </article>

        <article class="rounded-lg border-2 border-gray-200 p-5">
          <div class="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 text-lg font-semibold text-[#4A2A12]">
            <Clock3 :size="18" />
            Lưu lịch sử vận hành
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Số ngày giữ notification</label>
            <input
              v-model="runtimeForm.notificationRetentionDays"
              type="number"
              min="1"
              max="365"
              class="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-[#F2B233] focus:outline-none"
            />
          </div>

          <div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            Giá trị hiện tại từ server:
            {{ runtimeSettings?.bookingOpenTime ?? '--:--' }} - {{ runtimeSettings?.bookingCloseTime ?? '--:--' }},
            retention {{ runtimeSettings?.notificationRetentionDays ?? '--' }} ngày.
          </div>
        </article>

        <article class="rounded-lg border-2 border-gray-200 p-5">
          <h3 class="mb-4 border-b border-gray-200 pb-3 text-lg font-semibold text-[#4A2A12]">
            Cấu hình chuyển khoản
          </h3>

          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Mã ngân hàng VietQR</label>
              <input
                v-model="runtimeForm.bankCode"
                type="text"
                placeholder="Ví dụ: 970423"
                class="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-[#F2B233] focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Tên ngân hàng</label>
              <input
                v-model="runtimeForm.bankName"
                type="text"
                placeholder="Ví dụ: TPBank"
                class="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-[#F2B233] focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Số tài khoản</label>
              <input
                v-model="runtimeForm.bankAccountNumber"
                type="text"
                placeholder="Nhập số tài khoản nhận tiền"
                class="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-[#F2B233] focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Tên chủ tài khoản</label>
              <input
                v-model="runtimeForm.bankAccountName"
                type="text"
                placeholder="Nhập tên chủ tài khoản"
                class="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-[#F2B233] focus:outline-none"
              />
            </div>
          </div>

          <div class="mt-4 rounded-lg border border-[#F2B233] bg-[#FFF9EB] p-3 text-sm text-[#4A2A12]">
            <span class="font-semibold">Hiển thị trên app:</span>
            {{ runtimeSettings?.bankName || 'Chưa cấu hình ngân hàng' }}
            <template v-if="runtimeSettings?.bankAccountNumber">
              - {{ runtimeSettings.bankAccountNumber }}
            </template>
            <template v-if="runtimeSettings?.bankAccountName">
              - {{ runtimeSettings.bankAccountName }}
            </template>
          </div>
        </article>
      </div>

      <div v-if="runtimeError" class="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ runtimeError }}
      </div>
    </section>
  </div>
</template>

<script lang="ts">
export default {
  name: 'SettingsPage',
}
</script>