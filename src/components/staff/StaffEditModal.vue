<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { AdminStaffItem, UpdateAdminStaffDto } from '@/types/api'
import Modal from '@/components/ui/Modal.vue'
import TextInput from '@/components/ui/TextInput.vue'

interface Props {
  modelValue: boolean
  staff: AdminStaffItem | null
  loading: boolean
  error: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: { userId: string; data: UpdateAdminStaffDto }]
}>()

const form = reactive({
  id: '',
  name: '',
  phone: '',
  gmail: '',
  dateOfBirth: '',
  password: '',
})

const errors = reactive({
  name: '',
  gmail: '',
  dateOfBirth: '',
  password: '',
})

watch(
  () => [props.modelValue, props.staff] as const,
  ([isOpen, staff]) => {
    if (!isOpen || !staff) {
      return
    }

    form.id = staff.id
    form.name = staff.name
    form.phone = staff.phone
    form.gmail = staff.gmail ?? ''
    form.dateOfBirth = staff.dateOfBirth ? staff.dateOfBirth.slice(0, 10) : ''
    form.password = ''
    errors.name = ''
    errors.gmail = ''
    errors.dateOfBirth = ''
    errors.password = ''
  },
  { immediate: true },
)

const closeModal = () => emit('update:modelValue', false)

const handleSubmit = () => {
    errors.name = form.name.trim() ? '' : 'Họ và tên là bắt buộc'
    errors.gmail = !form.gmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail.trim()) ? '' : 'Email không hợp lệ'
    errors.dateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim()) ? '' : 'Ngày sinh phải theo định dạng YYYY-MM-DD'
    errors.password = !form.password || form.password.length >= 6 ? '' : 'Mật khẩu tối thiểu 6 ký tự'

    if (Object.values(errors).some(Boolean) || !form.id) {
      return
    }

    emit('submit', {
      userId: form.id,
      data: {
        name: form.name.trim(),
        gmail: form.gmail.trim() || null,
        dateOfBirth: form.dateOfBirth.trim(),
        ...(form.password ? { password: form.password } : {}),
      },
    })
  }
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Chỉnh Sửa Nhân Viên"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="staff" class="space-y-6">
      <div>
        <h3 class="mb-3 border-b border-gray-200 pb-2 text-base font-semibold text-[#4A2A12]">
          Thông tin nhân viên
        </h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInput v-model="form.name" label="Họ và tên *" placeholder="Nguyễn Văn A" :error="errors.name" />
          <TextInput :model-value="form.phone" label="Số điện thoại" disabled />
          <TextInput v-model="form.gmail" label="Email" placeholder="admin@hdn.vn" :error="errors.gmail" />
          <TextInput v-model="form.dateOfBirth" type="date" label="Ngày sinh *" :error="errors.dateOfBirth" />
          <TextInput v-model="form.password" type="password" label="Mật khẩu mới" placeholder="Để trống nếu không đổi" :error="errors.password" />
        </div>
      </div>

      <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
        {{ error }}
      </div>

      <div class="flex gap-3 border-t border-gray-200 pt-4">
        <button type="button" class="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50" @click="closeModal">
          Hủy
        </button>
        <button type="button" class="flex-1 rounded-xl bg-[#F2B233] px-4 py-3 font-medium text-white transition-colors hover:bg-[#d49a19] disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="handleSubmit">
          {{ loading ? 'Đang lưu...' : 'Lưu thay đổi' }}
        </button>
      </div>
    </div>
  </Modal>
</template>