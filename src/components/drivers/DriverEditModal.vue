<script setup lang="ts">
import { reactive, watch } from "vue";
import type { AdminDriver, UpdateDriverDto } from "@/types/api";
import Modal from "@/components/ui/Modal.vue";
import TextInput from "@/components/ui/TextInput.vue";
import SelectInput from "@/components/ui/SelectInput.vue";

const driverTypeOptions = [
  { label: "Tài xế công ty", value: "COMPANY" },
  { label: "Tài xế đối tác", value: "THIRD_PARTY" },
];

const vehicleSeatOptions = [
  { label: "4 chỗ", value: "4" },
  { label: "7 chỗ", value: "7" },
  { label: "9 chỗ", value: "9" },
  { label: "16 chỗ", value: "16" },
];

interface Props {
  modelValue: boolean;
  driver: AdminDriver | null;
  loading: boolean;
  error: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: { driverId: string; data: UpdateDriverDto }];
}>();

const form = reactive({
  id: "",
  name: "",
  phone: "",
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
  gmail: "",
  citizenId: "",
  dateOfBirth: "",
  driverType: "",
  vehicleModel: "",
  vehicleYear: "",
  vehiclePlate: "",
  vehicleSeats: "",
});

watch(
  () => [props.modelValue, props.driver] as const,
  ([isOpen, driver]) => {
    if (!isOpen || !driver) {
      return;
    }

    form.id = driver.id;
    form.name = driver.name;
    form.phone = driver.phone;
    form.gmail = driver.gmail ?? "";
    form.citizenId = driver.citizenId ?? "";
    form.dateOfBirth = driver.dateOfBirth ? driver.dateOfBirth.slice(0, 10) : "";
    form.driverType = driver.driverType ?? "COMPANY";
    form.contractNumber = driver.contractNumber ?? "";
    form.vehicleBrand = driver.vehicle?.brand ?? "";
    form.vehicleModel = driver.vehicle?.model ?? "";
    form.vehicleYear = driver.vehicle?.year ? String(driver.vehicle.year) : "";
    form.vehiclePlate = driver.vehicle?.plate ?? "";
    form.vehicleSeats = driver.vehicle?.seatsTotal ? String(driver.vehicle.seatsTotal) : "7";
    errors.name = "";
    errors.gmail = "";
    errors.citizenId = "";
    errors.dateOfBirth = "";
    errors.driverType = "";
    errors.vehicleModel = "";
    errors.vehicleYear = "";
    errors.vehiclePlate = "";
    errors.vehicleSeats = "";
  },
  { immediate: true },
);

const closeModal = () => emit("update:modelValue", false);

const handleSubmit = () => {
  errors.name = form.name.trim() ? "" : "Tên tài xế là bắt buộc";
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
  errors.vehiclePlate = form.vehiclePlate.trim() ? "" : "Biển số xe là bắt buộc";
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

  if (Object.values(errors).some(Boolean) || !form.id) {
    return;
  }

  emit("submit", {
    driverId: form.id,
    data: {
      name: form.name.trim(),
      gmail: form.gmail.trim() || null,
      citizenId: form.citizenId.trim(),
      dateOfBirth: form.dateOfBirth.trim(),
      driverType: form.driverType as NonNullable<UpdateDriverDto["driverType"]>,
      contractNumber: form.contractNumber.trim() || null,
      vehicleBrand: form.vehicleBrand.trim() || null,
      vehicleModel: form.vehicleModel.trim(),
      vehicleYear: form.vehicleYear.trim() ? Number(form.vehicleYear) : null,
      vehiclePlate: form.vehiclePlate.trim(),
      vehicleSeats: Number(form.vehicleSeats),
    },
  });
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Chỉnh Sửa Tài Xế"
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="driver" class="space-y-6">
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
          <TextInput :model-value="form.phone" label="Số điện thoại" disabled />
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
          {{ loading ? "Đang lưu..." : "Lưu thay đổi" }}
        </button>
      </div>
    </div>
  </Modal>
</template>
