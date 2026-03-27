<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '@/utils/apiClient'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import TextInput from '@/components/ui/TextInput.vue'
import DateInput from '@/components/ui/DateInput.vue'
import type { Route } from '@/types/api'

const router = useRouter()
const loading = ref(false)
const driversLoading = ref(false)
const error = ref('')
const driverOptions = ref<Array<{ label: string; value: string }>>([])
const routes = ref<Route[]>([])

const form = ref({
  routeId: 0,
  departDate: '',
  departTime: '',
  totalSeats: 16,
  driverId: '',
  tripCost: undefined as number | undefined,
})

const selectedDriverLabel = computed(() => {
  const selected = driverOptions.value.find((driver) => driver.value === form.value.driverId)
  return selected?.label || 'Chưa chọn'
})

const toDepartAtIso = (date: string, time: string): string | null => {
  const departAt = new Date(`${date}T${time}:00`)
  if (Number.isNaN(departAt.getTime())) return null
  return departAt.toISOString()
}

const loadDrivers = async () => {
  driversLoading.value = true
  try {
    const response = await apiClient.getUsers({ role: 'DRIVER', page: 1, limit: 200 })
    const users = response.data?.items ?? []
    driverOptions.value = users.map((driver) => ({
      label: `${driver.name} (${driver.phone})`,
      value: String(driver.id),
    }))
  } catch (_err) {
    driverOptions.value = []
  } finally {
    driversLoading.value = false
  }
}

const loadRoutes = async () => {
  try {
    const response = await apiClient.getRoutes()
    routes.value = response.data ?? []
  } catch (_err) {
    routes.value = []
  }
}

const handleSubmit = async () => {
  error.value = ''
  if (!form.value.routeId || !form.value.departDate || !form.value.departTime || !form.value.driverId) {
    error.value = 'Vui Lòng Điền Đầy Đủ Các Trường Bắt Buộc'
    return
  }

  const departAt = toDepartAtIso(form.value.departDate, form.value.departTime)
  if (!departAt) {
    error.value = 'Thời gian khởi hành không hợp lệ'
    return
  }

  loading.value = true
  try {
    await apiClient.createTrip({
      routeId: form.value.routeId,
      driverId: Number(form.value.driverId),
      departAt,
      type: 'SHARED',
      totalSeats: Number(form.value.totalSeats) || 16,
      tripCost: form.value.tripCost,
    })
    router.push('/trips')
  } catch (err: any) {
    error.value = err.message || 'Tạo Chuyến Thất Bại'
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/trips')
}

onMounted(async () => {
  await Promise.all([loadDrivers(), loadRoutes()])
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold text-gray-900">Tạo Chuyến Xe Mới</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Form Card -->
      <Card class="lg:col-span-2">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Error Alert -->
          <div v-if="error" class="p-4 bg-red-50 border border-status-danger rounded-lg">
            <p class="text-sm text-status-danger">{{ error }}</p>
          </div>

          <!-- Route Selection -->
          <div class="space-y-4 pb-6 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Chọn Tuyến</h2>
            <div class="grid grid-cols-2 gap-4">
              <button
                v-for="r of routes"
                :key="r.id"
                type="button"
                :class="[
                  'p-4 border-2 rounded-lg font-medium transition-all',
                  form.routeId === r.id
                    ? 'border-brand-gold bg-yellow-50 text-brand-brown'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700',
                ]"
                @click="form.routeId = r.id"
              >
                {{ r.name }}
              </button>
            </div>
          </div>

          <!-- Date & Time -->
          <div class="grid grid-cols-2 gap-4">
            <DateInput v-model="form.departDate" label="Ngày Khởi Hành *" />
            <TextInput v-model="form.departTime" type="time" label="Giờ Khởi Hành *" />
          </div>

          <!-- Price per Seat -->
          <TextInput
            :model-value="String(form.totalSeats)"
            type="number"
            label="Tổng số ghế"
            placeholder="16"
            @update:model-value="form.totalSeats = Number($event)"
          />

          <!-- Trip Cost -->
          <TextInput
            :model-value="form.tripCost !== undefined ? String(form.tripCost) : ''"
            type="number"
            label="Giá vé (tùy chọn)"
            placeholder="VD: 150000"
            @update:model-value="form.tripCost = $event ? Number($event) : undefined"
          />

          <!-- Driver -->
          <SelectInput
            v-model="form.driverId"
            label="Chon tai xe *"
            :options="driverOptions"
            placeholder="Chon tai xe"
            :disabled="driversLoading"
          />

          <!-- Actions -->
          <div class="flex gap-3 pt-6">
            <Button variant="secondary" class="flex-1" type="button" @click="handleCancel"> Hủy </Button>
            <Button class="flex-1" type="submit" :loading="loading"> Tạo Chuyến Xe </Button>
          </div>
        </form>
      </Card>

      <!-- Summary Card -->
      <Card class="h-fit sticky top-20">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Tóm Tắt Chuyến</h2>
        <div class="space-y-3 text-sm">
          <div>
            <p class="text-gray-600">Tuyen</p>
            <p class="font-semibold text-gray-900">{{ form.routeId ? (routes.find(r => r.id === form.routeId)?.name ?? '--') : 'Chua chon' }}</p>
          </div>
          <div>
            <p class="text-gray-600">Gio khoi hanh</p>
            <p class="font-semibold text-gray-900">{{ form.departDate && form.departTime ? `${form.departDate} ${form.departTime}` : 'Chua chon' }}</p>
          </div>
          <div class="pt-3 border-t border-gray-200">
            <p class="text-gray-600">Tổng số ghế</p>
            <p class="font-bold text-brand-gold text-lg">{{ form.totalSeats }}</p>
          </div>
          <div>
            <p class="text-gray-600">Tai xe</p>
            <p class="font-semibold text-gray-900">{{ selectedDriverLabel }}</p>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
