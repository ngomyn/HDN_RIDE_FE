<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  loading: boolean
  bookingCode?: string
  routeName?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [reason: string]
}>()

const reason = ref('')
const errorMessage = ref('')

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      reason.value = ''
      errorMessage.value = ''
    }
  },
)

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  const trimmedReason = reason.value.trim()
  if (!trimmedReason) {
    errorMessage.value = 'Vui lòng nhập lý do huỷ booking.'
    return
  }

  emit('confirm', trimmedReason)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.modelValue"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="closeModal"
      >
        <div class="w-full max-w-[460px] rounded-3xl bg-white p-6 shadow-lg">
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Xác nhận huỷ</p>
            <h3 class="text-xl font-bold text-[#4A2A12]">Xác nhận huỷ đặt chỗ này chứ?</h3>
            <p class="text-sm leading-6 text-gray-500">
              {{ props.bookingCode ? `Booking ${props.bookingCode}` : 'Booking đã chọn' }}
              <span v-if="props.routeName">, tuyến {{ props.routeName }}</span>.
            </p>
          </div>

          <div class="mt-5 space-y-2">
            <label class="block text-sm font-semibold text-[#4A2A12]" for="booking-cancel-reason">Lý do huỷ</label>
            <textarea
              id="booking-cancel-reason"
              v-model="reason"
              rows="4"
              class="w-full rounded-2xl border border-[#D8CEC1] px-4 py-3 text-sm text-[#4A2A12] outline-none transition-colors focus:border-[#F2B233]"
              placeholder="Nhập lý do huỷ booking"
            />
            <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
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
              class="h-11 rounded-xl bg-red-500 px-5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              :disabled="props.loading"
              @click="handleConfirm"
            >
              {{ props.loading ? 'Đang huỷ...' : 'Có' }}
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