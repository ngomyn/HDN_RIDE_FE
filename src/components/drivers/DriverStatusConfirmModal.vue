<script setup lang="ts">
import type { AccountStatus, AdminDriver } from '@/types/api'

interface Props {
  modelValue: boolean
  driver: AdminDriver | null
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: { driverId: string; accountStatus: AccountStatus }]
}>()

const closeModal = () => {
  emit('update:modelValue', false)
}

const getNextStatus = (status: AccountStatus): AccountStatus => (status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')

const getActionText = (status: AccountStatus): string =>
  status === 'ACTIVE' ? 'tạm khóa' : 'kích hoạt'
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.modelValue && props.driver"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="closeModal"
      >
        <div class="w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-lg">
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#F59E0B]">Cập nhật trạng thái tài xế</p>
            <h3 class="text-xl font-bold text-[#4A2A12]">Xác nhận {{ getActionText(props.driver.accountStatus) }} tài xế này?</h3>
            <p class="text-sm leading-6 text-gray-500">
              Tài xế <strong>{{ props.driver.name }}</strong> ({{ props.driver.phone }})
              sẽ chuyển từ
              <strong>{{ props.driver.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa' }}</strong>
              sang
              <strong>{{ getNextStatus(props.driver.accountStatus) === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa' }}</strong>.
            </p>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="h-11 rounded-xl border border-gray-300 px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              @click="closeModal"
            >
              Không
            </button>
            <button
              type="button"
              class="h-11 rounded-xl bg-[#F59E0B] px-5 text-sm font-medium text-white transition-colors hover:bg-[#D97706] disabled:opacity-60"
              :disabled="props.loading"
              @click="emit('submit', { driverId: props.driver.id, accountStatus: getNextStatus(props.driver.accountStatus) })"
            >
              {{ props.loading ? 'Đang cập nhật...' : 'Có' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
