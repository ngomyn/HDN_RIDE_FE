<script setup lang="ts">
import type { AdminDriver } from '@/types/api'
import Modal from '@/components/ui/Modal.vue'

interface Props {
  modelValue: boolean
  driver: AdminDriver | null
}

defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const formatVehicleType = (vehicleType?: string | null) => {
  if (!vehicleType) return '-'
  return vehicleType.replace('SEAT_', '').concat(' chỗ')
}
</script>

<template>
  <Modal :model-value="modelValue" title="Thông Tin Phương Tiện" size="lg" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="driver" class="space-y-5">
      <div class="rounded-2xl bg-[#FFF8EC] p-4">
        <p class="text-xs uppercase tracking-[0.18em] text-[#9A6700]">Tài xế</p>
        <h3 class="mt-2 text-lg font-semibold text-[#4A2A12]">{{ driver.name }}</h3>
        <p class="mt-1 text-sm text-gray-600">{{ driver.phone }}</p>
      </div>

      <div v-if="driver.vehicle" class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="rounded-2xl border border-[#EFE7DE] p-4">
          <p class="text-xs text-gray-500">Hãng xe</p>
          <p class="mt-2 font-semibold text-[#4A2A12]">{{ driver.vehicle.brand || '-' }}</p>
        </div>
        <div class="rounded-2xl border border-[#EFE7DE] p-4">
          <p class="text-xs text-gray-500">Model xe</p>
          <p class="mt-2 font-semibold text-[#4A2A12]">{{ driver.vehicle.model }}</p>
        </div>
        <div class="rounded-2xl border border-[#EFE7DE] p-4">
          <p class="text-xs text-gray-500">Năm sản xuất</p>
          <p class="mt-2 font-semibold text-[#4A2A12]">{{ driver.vehicle.year || '-' }}</p>
        </div>
        <div class="rounded-2xl border border-[#EFE7DE] p-4">
          <p class="text-xs text-gray-500">Biển số xe</p>
          <p class="mt-2 font-semibold text-[#4A2A12]">{{ driver.vehicle.plate }}</p>
        </div>
        <div class="rounded-2xl border border-[#EFE7DE] p-4">
          <p class="text-xs text-gray-500">Số chỗ</p>
          <p class="mt-2 font-semibold text-[#4A2A12]">{{ driver.vehicle.seatsTotal }}</p>
        </div>
        <div class="rounded-2xl border border-[#EFE7DE] p-4">
          <p class="text-xs text-gray-500">Loại xe</p>
          <p class="mt-2 font-semibold text-[#4A2A12]">{{ formatVehicleType(driver.vehicle.vehicleType) }}</p>
        </div>
        <div class="rounded-2xl border border-[#EFE7DE] p-4">
          <p class="text-xs text-gray-500">Số chuyến hoàn thành</p>
          <p class="mt-2 font-semibold text-[#4A2A12]">{{ driver.totalTrips }}</p>
        </div>
        <div class="rounded-2xl border border-[#EFE7DE] p-4">
          <p class="text-xs text-gray-500">Trạng thái tài khoản</p>
          <p class="mt-2 font-semibold text-[#4A2A12]">{{ driver.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa' }}</p>
        </div>
      </div>

      <div v-else class="py-6 text-center text-sm text-gray-400">
        Tài xế chưa có phương tiện
      </div>

      <button class="h-11 w-full rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50" @click="emit('update:modelValue', false)">
        Đóng
      </button>
    </div>
  </Modal>
</template>