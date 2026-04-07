<script setup lang="ts">
import { reactive, watch } from "vue";
import type { CreateDriverDto } from "@/types/api";
import Modal from "@/components/ui/Modal.vue";
import TextInput from "@/components/ui/TextInput.vue";
import SelectInput from "@/components/ui/SelectInput.vue";

const driverTypeOptions = [
  { label: "Tài xế công ty", value: "COMPANY" },
  { label: "Tài xế đối tác", value: "THIRD_PARTY" },
];

interface Props {
  modelValue: boolean;
  loading: boolean;
  error: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: CreateDriverDto];
}>();

const vehicleSeatOptions = [
  { label: "4 chỗ", value: "4" },
  { label: "7 chỗ", value: "7" },
  { label: "9 chỗ", value: "9" },
  { label: "16 chỗ", value: "16" },
];

const form = reactive({
  name: "",
  phone: "",
  password: "",
  gmail: "",
  citizenId: "",
  dateOfBirth: "",
  driverType: "COMPANY",
  contractNumber: "",
  vehicleBrand: "",
  vehicleModel: "",
  vehicleYear: "",
  vehiclePlate: "",
  vehicleSeats: "7",
});

const errors = reactive({
  name: "",
  phone: "",
  password: "",
  gmail: "",
  citizenId: "",
  dateOfBirth: "",
  driverType: "",
  vehicleModel: "",
  vehicleYear: "",
  vehiclePlate: "",
  vehicleSeats: "",
});

const resetForm = () => {
  form.name = "";
  form.phone = "";
  form.password = "";
  form.gmail = "";
  form.citizenId = "";
  form.dateOfBirth = "";
  form.driverType = "COMPANY";
  form.contractNumber = "";
  form.vehicleBrand = "";
  form.vehicleModel = "";
  form.vehicleYear = "";
  form.vehiclePlate = "";
  form.vehicleSeats = "7";

  errors.name = "";
  errors.phone = "";
  errors.password = "";
  errors.gmail = "";
  errors.citizenId = "";
  errors.dateOfBirth = "";
  errors.driverType = "";
  errors.vehicleModel = "";
  errors.vehicleYear = "";
  errors.vehiclePlate = "";
  errors.vehicleSeats = "";
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm();
    }
  },
);

const validateForm = () => {
  errors.name = form.name.trim() ? "" : "Họ và tên là bắt buộc";
  errors.phone = /^\d{10}$/.test(form.phone.trim())
    ? ""
    : "Số điện thoại phải có đúng 10 chữ số";
  errors.password =
    form.password.length >= 6 ? "" : "Mật khẩu tối thiểu 6 ký tự";
  errors.gmail =
    !form.gmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail.trim())
      ? ""
      : "Email không hợp lệ";
  errors.citizenId = /^[0-9]{12}$/.test(form.citizenId.trim())
    ? ""
    : "CCCD phải có đúng 12 chữ số";
  errors.dateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())
    ? ""
    : "Ngày sinh phải theo định dạng YYYY-MM-DD";
  errors.driverType = ["COMPANY", "THIRD_PARTY"].includes(form.driverType)
    ? ""
    : "Vui lòng chọn loại tài xế";
  errors.vehicleModel = form.vehicleModel.trim() ? "" : "Model xe là bắt buộc";
  errors.vehiclePlate = form.vehiclePlate.trim()
    ? ""
    : "Biển số xe là bắt buộc";
  errors.vehicleSeats = ["4", "7", "9", "16"].includes(form.vehicleSeats)
    ? ""
    : "Số chỗ chỉ hỗ trợ 4, 7, 9 hoặc 16";

  if (form.vehicleYear.trim()) {
    const year = Number(form.vehicleYear);
    errors.vehicleYear =
      Number.isInteger(year) && year >= 1990 && year <= 2100
        ? ""
        : "Năm sản xuất phải nằm trong khoảng 1990-2100";
  } else {
    errors.vehicleYear = "";
  }

  return !Object.values(errors).some(Boolean);
};

const closeModal = () => emit("update:modelValue", false);

const handleSubmit = () => {
  if (!validateForm()) {
    return;
  }

  emit("submit", {
    name: form.name.trim(),
    phone: form.phone.trim(),
    password: form.password,
    gmail: form.gmail.trim() || undefined,
    citizenId: form.citizenId.trim(),
    dateOfBirth: form.dateOfBirth.trim(),
    driverType: form.driverType as CreateDriverDto["driverType"],
    contractNumber: form.contractNumber.trim() || undefined,
    vehicleBrand: form.vehicleBrand.trim() || undefined,
    vehicleModel: form.vehicleModel.trim(),
    vehicleYear: form.vehicleYear.trim() ? Number(form.vehicleYear) : undefined,
    vehiclePlate: form.vehiclePlate.trim(),
    vehicleSeats: Number(form.vehicleSeats),
  });
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Thêm Tài Xế Mới"
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-6">
      <div>
        <h3
          class="mb-3 border-b border-gray-200 pb-2 text-base font-semibold text-[#4A2A12]"
        >
          Thông tin cá nhân
        </h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInput
            v-model="form.name"
            label="Họ và tên *"
            placeholder="Nguyễn Văn B"
            :error="errors.name"
          />
          <TextInput
            v-model="form.phone"
            label="Số điện thoại *"
            placeholder="0901122334"
            :error="errors.phone"
          />
          <TextInput
            v-model="form.password"
            type="password"
            label="Mật khẩu *"
            :error="errors.password"
          />
          <TextInput
            v-model="form.gmail"
            label="Gmail"
            placeholder="driver@hdn.vn"
            :error="errors.gmail"
          />
        </div>
      </div>

      <div>
        <h3
          class="mb-3 border-b border-gray-200 pb-2 text-base font-semibold text-[#4A2A12]"
        >
          Thông tin pháp lý
        </h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInput
            v-model="form.citizenId"
            label="Số CCCD *"
            placeholder="012345678901"
            :error="errors.citizenId"
          />
          <TextInput
            v-model="form.dateOfBirth"
            type="date"
            label="Ngày sinh *"
            :error="errors.dateOfBirth"
          />
          <SelectInput
            v-model="form.driverType"
            label="Loại tài xế *"
            :options="driverTypeOptions"
            placeholder="Chọn loại tài xế"
            :error="errors.driverType"
          />
          <TextInput
            v-model="form.contractNumber"
            label="Mã hợp đồng"
            placeholder="HD-2026-001"
          />
        </div>
      </div>

      <div>
        <h3
          class="mb-3 border-b border-gray-200 pb-2 text-base font-semibold text-[#4A2A12]"
        >
          Thông tin phương tiện
        </h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TextInput
            v-model="form.vehicleBrand"
            label="Hãng xe"
            placeholder="Toyota"
          />
          <TextInput
            v-model="form.vehicleModel"
            label="Model xe *"
            placeholder="Innova Cross"
            :error="errors.vehicleModel"
          />
          <TextInput
            v-model="form.vehicleYear"
            type="number"
            label="Năm sản xuất"
            placeholder="2024"
            :error="errors.vehicleYear"
          />
          <TextInput
            v-model="form.vehiclePlate"
            label="Biển số xe *"
            placeholder="43A-12345"
            :error="errors.vehiclePlate"
          />
          <SelectInput
            v-model="form.vehicleSeats"
            label="Số chỗ *"
            :options="vehicleSeatOptions"
            placeholder="Chọn số chỗ"
            :error="errors.vehicleSeats"
          />
        </div>
      </div>

      <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
        {{ error }}
      </div>

      <div class="flex gap-3 border-t border-gray-200 pt-4">
        <button
          class="h-11 flex-1 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
          @click="closeModal"
        >
          Hủy
        </button>
        <button
          class="h-11 flex-1 rounded-lg bg-[#F2B233] font-medium text-white transition-colors hover:bg-[#E0A020] disabled:opacity-50"
          :disabled="loading"
          @click="handleSubmit"
        >
          {{ loading ? "Đang tạo..." : "Thêm tài xế" }}
        </button>
      </div>
    </div>
  </Modal>
</template>
