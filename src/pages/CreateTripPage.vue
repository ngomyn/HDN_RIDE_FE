<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '@/utils/apiClient'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import TextInput from '@/components/ui/TextInput.vue'
import DateInput from '@/components/ui/DateInput.vue'
import { routeOptions, pickupByRoute, vehicleOptions } from '@/data/mockData'

const router = useRouter()
const loading = ref(false)
const driversLoading = ref(false)
const error = ref('')
const driverOptions = ref<Array<{ label: string; value: string }>>([])

const form = ref({
  route: '',
  pickupWard: '',
  departDate: '',
  departTime: '',
  totalSeats: 16,
  driverId: '',
  vehicle: '',
  notes: '',
})

const availablePickups = computed(() => {
  return form.value.route ? pickupByRoute[form.value.route] || [] : []
})

const selectedDriverLabel = computed(() => {
  const selected = driverOptions.value.find((driver) => driver.value === form.value.driverId)
  return selected?.label || 'Chưa chọn'
})

const parseRoutePlaces = (route: string): { fromPlace: string; toPlace: string } | null => {
  const [fromPlace, toPlace] = route.split('->').map((part) => part.trim())
  if (!fromPlace || !toPlace) return null
  return { fromPlace, toPlace }
}

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

const handleSubmit = async () => {
  error.value = ''
  if (!form.value.route || !form.value.pickupWard || !form.value.departDate || !form.value.departTime || !form.value.driverId) {
    error.value = 'Vui Lòng Điền Đầy Đủ Các Trường Bắt Buộc'
    return
  }

  const routePlaces = parseRoutePlaces(form.value.route)
  if (!routePlaces) {
    error.value = 'Tuyến không hợp lệ'
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
      driverId: Number(form.value.driverId),
      fromPlace: routePlaces.fromPlace,
      fromAddress: form.value.pickupWard,
      toPlace: routePlaces.toPlace,
      toAddress: form.value.notes?.trim() || `Điểm trả tại ${routePlaces.toPlace}`,
      departAt,
      type: 'SHARED',
      totalSeats: Number(form.value.totalSeats) || 16,
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
  await loadDrivers()
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
                v-for="r of routeOptions"
                :key="r"
                type="button"
                :class="[
                  'p-4 border-2 rounded-lg font-medium transition-all',
                  form.route === r
                    ? 'border-brand-gold bg-yellow-50 text-brand-brown'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700',
                ]"
                @click="form.route = r; form.pickupWard = ''"
              >
                {{ r }}
              </button>
            </div>
          </div>

          <!-- Pickup Ward Selection -->
          <SelectInput
            v-model="form.pickupWard"
            label="Chọn Phương Đắn Khách *"
            :options="availablePickups"
            placeholder="Chọn Phương Đắn Khách"
          />

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

          <!-- Driver & Vehicle -->
          <SelectInput
            v-model="form.driverId"
            label="Chon tai xe *"
            :options="driverOptions"
            placeholder="Chon tai xe"
            :disabled="driversLoading"
          />

          <SelectInput
            v-model="form.vehicle"
            label="Chon phuong tien (tuy chon)"
            :options="vehicleOptions"
            placeholder="Chon phuong tien"
          />

          <!-- Notes -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-brand-brown">Ghi chu them</label>
            <textarea
              v-model="form.notes"
              :rows="4"
              placeholder="Nhap ghi chu them (tuy chon)..."
              class="px-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold focus:ring-opacity-30"
            />
          </div>

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
            <p class="font-semibold text-gray-900">{{ form.route || 'Chua chon' }}</p>
          </div>
          <div>
            <p class="text-gray-600">Phuong don</p>
            <p class="font-semibold text-gray-900">{{ form.pickupWard || 'Chua chon' }}</p>
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
