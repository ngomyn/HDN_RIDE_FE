<script setup lang="ts">
interface Props {
  modelValue: boolean;
  loading: boolean;
  bookingCode?: string;
  passengerName?: string;
  tripCode?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();

const closeModal = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.modelValue"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="closeModal"
      >
        <div class="w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-lg">
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Xác nhận xoá</p>
            <h3 class="text-xl font-bold text-[#4A2A12]">Bạn có muốn xoá booking khỏi chuyến này không?</h3>
            <p class="text-sm leading-6 text-gray-500">
              {{ props.bookingCode ? `Booking ${props.bookingCode}` : 'Booking đã chọn' }}
              <span v-if="props.passengerName"> của {{ props.passengerName }}</span>
              <span v-if="props.tripCode"> trong chuyến {{ props.tripCode }}</span>.
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
              class="h-11 rounded-xl bg-red-500 px-5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              :disabled="props.loading"
              @click="emit('confirm')"
            >
              {{ props.loading ? 'Đang xoá...' : 'Có' }}
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