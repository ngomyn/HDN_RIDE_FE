<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { CreateAdminStaffDto } from '@/types/api'
import Modal from '@/components/ui/Modal.vue'
import TextInput from '@/components/ui/TextInput.vue'

interface Props {
  modelValue: boolean
  loading: boolean
  error: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: CreateAdminStaffDto]
}>()

const form = reactive({
  name: '',
  phone: '',
  password: '',
  gmail: '',
  dateOfBirth: '',
})

const errors = reactive({
  name: '',
  phone: '',
  password: '',
  gmail: '',
  dateOfBirth: '',
})

const resetForm = () => {
  form.name = ''
  form.phone = ''
  form.password = ''
  form.gmail = ''
  form.dateOfBirth = ''

  errors.name = ''
  errors.phone = ''
  errors.password = ''
  errors.gmail = ''
  errors.dateOfBirth = ''
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  },
)

const closeModal = () => emit('update:modelValue', false)

const handleSubmit = () => {
  errors.name = form.name.trim() ? '' : 'Họ và tên là bắt buộc'
  errors.phone = /^\d{10}$/.test(form.phone.trim()) ? '' : 'Số điện thoại phải có đúng 10 chữ số'
  errors.password = form.password.length >= 6 ? '' : 'Mật khẩu tối thiểu 6 ký tự'
  errors.gmail = !form.gmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail.trim()) ? '' : 'Email không hợp lệ'
  errors.dateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim()) ? '' : 'Ngày sinh phải theo định dạng YYYY-MM-DD'

  if (Object.values(errors).some(Boolean)) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    phone: form.phone.trim(),
    password: form.password,
    gmail: form.gmail.trim() || undefined,
    dateOfBirth: form.dateOfBirth.trim(),
  })
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Thêm Nhân Viên Mới"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-6">
      <div>
        <h3 class="mb-3 border-b border-gray-200 pb-2 text-base font-semibold text-[#4A2A12]">
          Thông tin nhân viên
        </h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInput v-model="form.name" label="Họ và tên *" placeholder="Nguyễn Văn A" :error="errors.name" />
          <TextInput v-model="form.phone" label="Số điện thoại *" placeholder="0901122334" :error="errors.phone" />
          <TextInput v-model="form.password" type="password" label="Mật khẩu *" :error="errors.password" />
          <TextInput v-model="form.gmail" label="Email" placeholder="admin@hdn.vn" :error="errors.gmail" />
          <TextInput v-model="form.dateOfBirth" type="date" label="Ngày sinh *" :error="errors.dateOfBirth" />
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
          {{ loading ? 'Đang tạo...' : 'Tạo nhân viên' }}
        </button>
      </div>
    </div>
  </Modal>
</template>