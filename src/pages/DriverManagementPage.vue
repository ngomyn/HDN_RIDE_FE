<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useDriverStore } from '@/stores/drivers'
import type { AdminDriver, CreateDriverDto } from '@/types/api'
import Breadcrumb from '@/components/Breadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import TextInput from '@/components/ui/TextInput.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import {
  Search,
  Eye,
  Pencil,
  UserCheck,
  UserX,
  Car,
  Phone,
  Plus,
  CheckCircle,
  AlertCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-vue-next'

const driverStore = useDriverStore()
const currentPage = ref(1)
const pageSize = 10

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showVehicleModal = ref(false)

const createForm = reactive({
  name: '',
  phone: '',
  password: '',
  avatar: '',
  vehicleModel: '',
  vehiclePlate: '',
  vehicleSeats: 7,
  citizenId: '',
  dateOfBirth: '',
  contractNumber: '',
})

const createFormErrors = reactive({
  name: '',
  phone: '',
  password: '',
  vehicleModel: '',
  vehiclePlate: '',
  citizenId: '',
  dateOfBirth: '',
})

const editForm = reactive({ id: 0, name: '', avatar: '', rating: '' })
const editFormErrors = reactive({ name: '' })
const searchInput = ref('')
const showStatusConfirm = ref(false)
const statusConfirmDriver = ref<AdminDriver | null>(null)

const statusFilterOptions = [
  { label: 'Tat ca', value: '' },
  { label: 'Dang hoat dong', value: 'ACTIVE' },
  { label: 'Tam khoa', value: 'INACTIVE' },
]

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const renderStars = (rating: number | null) => Math.round(rating ?? 0)

const getInitials = (name: string) => {
  const words = name.trim().split(' ').filter(Boolean)
  if (words.length >= 2) return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase()
  return (words[0]?.charAt(0) ?? 'U').toUpperCase()
}

const loadDrivers = async (page = currentPage.value) => {
  await driverStore.fetchDrivers(page, pageSize)
  currentPage.value = driverStore.pagination.page
}

onMounted(async () => {
  await Promise.all([loadDrivers(1), driverStore.fetchDriverSummary()])
})

const resetCreateForm = () => {
  createForm.name = ''
  createForm.phone = ''
  createForm.password = ''
  createForm.avatar = ''
  createForm.vehicleModel = ''
  createForm.vehiclePlate = ''
  createForm.vehicleSeats = 7
  createForm.citizenId = ''
  createForm.dateOfBirth = ''
  createForm.contractNumber = ''
  createFormErrors.name = ''
  createFormErrors.phone = ''
  createFormErrors.password = ''
  createFormErrors.vehicleModel = ''
  createFormErrors.vehiclePlate = ''
  createFormErrors.citizenId = ''
  createFormErrors.dateOfBirth = ''
}

const validateCreateForm = (): boolean => {
  let isValid = true
  createFormErrors.name = createForm.name.trim() ? '' : 'Ho va ten la bat buoc'
  createFormErrors.phone = createForm.phone.trim() ? '' : 'So dien thoai la bat buoc'
  createFormErrors.password = createForm.password ? '' : 'Mat khau la bat buoc'
  createFormErrors.vehicleModel = createForm.vehicleModel.trim() ? '' : 'Model xe la bat buoc'
  createFormErrors.vehiclePlate = createForm.vehiclePlate.trim() ? '' : 'Bien so xe la bat buoc'
  createFormErrors.citizenId = createForm.citizenId.trim() ? '' : 'So CCCD la bat buoc'
  createFormErrors.dateOfBirth = createForm.dateOfBirth.trim() ? '' : 'Ngay sinh la bat buoc'

  if (createForm.citizenId.trim() && !/^[0-9]{12}$/.test(createForm.citizenId.trim())) {
    createFormErrors.citizenId = 'CCCD phai co dung 12 chu so'
    isValid = false
  }
  createFormErrors.vehiclePlate = createForm.vehiclePlate.trim() ? '' : 'Bien so xe la bat buoc'

  if (createForm.phone.trim() && !/^\d{10}$/.test(createForm.phone.trim().replace(/\s/g, ''))) {
    createFormErrors.phone = 'So dien thoai phai co 10 chu so'
    isValid = false
  }

  if (createForm.password && createForm.password.length < 6) {
    createFormErrors.password = 'Mat khau toi thieu 6 ky tu'
    isValid = false
  }

  return isValid && !Object.values(createFormErrors).some((err) => err)
}

const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const submitCreate = async () => {
  if (!validateCreateForm()) {
    return
  }

  const payload: CreateDriverDto = {
    name: createForm.name.trim(),
    phone: createForm.phone.trim(),
    password: createForm.password,
    avatar: createForm.avatar.trim() || undefined,
    vehicleModel: createForm.vehicleModel.trim(),
    vehiclePlate: createForm.vehiclePlate.trim(),
    vehicleSeats: Number(createForm.vehicleSeats),
    citizenId: createForm.citizenId.trim(),
    dateOfBirth: createForm.dateOfBirth.trim(),
    contractNumber: createForm.contractNumber.trim() || undefined,
  }

  await driverStore.createDriver(payload)
  if (!driverStore.error) {
    showCreateModal.value = false
    await Promise.all([loadDrivers(currentPage.value), driverStore.fetchDriverSummary()])
  }
}

const openEditModal = (driver: AdminDriver) => {
  driverStore.selectDriver(driver)
  editForm.id = driver.id
  editForm.name = driver.name
  editForm.avatar = driver.avatar ?? ''
  editForm.rating = String(driver.rating ?? 0)
  editFormErrors.name = ''
  showEditModal.value = true
}

const validateEditForm = (): boolean => {
  editFormErrors.name = editForm.name.trim() ? '' : 'Ten tai xe la bat buoc'
  return !editFormErrors.name
}

const submitEdit = async () => {
  if (!validateEditForm()) {
    return
  }

  const ratingValue = Number(editForm.rating)
  await driverStore.updateDriver(editForm.id, {
    name: editForm.name.trim(),
    avatar: editForm.avatar.trim() || undefined,
    rating: Number.isNaN(ratingValue) ? undefined : ratingValue,
  })

  if (!driverStore.error) {
    showEditModal.value = false
    await loadDrivers(currentPage.value)
  }
}

const openStatusConfirm = (driver: AdminDriver) => {
  statusConfirmDriver.value = driver
  showStatusConfirm.value = true
}

const confirmStatusToggle = async () => {
  if (!statusConfirmDriver.value) return
  const nextStatus = statusConfirmDriver.value.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  await driverStore.updateDriverStatus(statusConfirmDriver.value.id, nextStatus)
  showStatusConfirm.value = false
  statusConfirmDriver.value = null
  if (!driverStore.error) {
    await Promise.all([loadDrivers(currentPage.value), driverStore.fetchDriverSummary()])
  }
}

const toggleDriverStatus = async (driver: AdminDriver) => {
  openStatusConfirm(driver)
}

const openVehicleModal = (driver: AdminDriver) => {
  driverStore.selectDriver(driver)
  showVehicleModal.value = true
}

const handleSearch = async () => {
  driverStore.setSearchFilter(searchInput.value)
  currentPage.value = 1
  await loadDrivers(1)
}

const handleReset = async () => {
  searchInput.value = ''
  driverStore.setSearchFilter('')
  driverStore.setStatusFilter('')
  currentPage.value = 1
  await loadDrivers(1)
}

const handleStatusChange = async () => {
  currentPage.value = 1
  await loadDrivers(1)
}

const goToPage = async (page: number) => {
  if (page < 1 || page > driverStore.pagination.totalPages) return
  currentPage.value = page
  await loadDrivers(page)
}

const pageNumbers = () => {
  const total = driverStore.pagination.totalPages
  const cur = currentPage.value
  const pages: (number | string)[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
}
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumb :items="['Trang chu', 'Quan ly tai xe']" />

    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-[#4A2A12]">Quan Ly Tai Xe</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Tong tai xe</p>
            <p class="text-2xl font-bold text-[#4A2A12]">{{ driverStore.summary?.total ?? driverStore.pagination.total }}</p>
          </div>
          <div class="w-12 h-12 bg-[#F2B233]/10 rounded-full flex items-center justify-center">
            <Car class="text-[#F2B233]" :size="24" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Dang hoat dong</p>
            <p class="text-2xl font-bold text-green-600">{{ driverStore.summary?.active ?? driverStore.activeCount }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle class="text-green-600" :size="24" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Danh gia TB</p>
            <p class="text-2xl font-bold text-[#F2B233]">{{ driverStore.summary?.averageRating?.toFixed(1) ?? '-' }}</p>
          </div>
          <div class="w-12 h-12 bg-[#F2B233]/10 rounded-full flex items-center justify-center">
            <Star class="text-[#F2B233]" :size="24" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Tong chuyen di</p>
            <p class="text-2xl font-bold text-[#4A2A12]">{{ driverStore.summary?.totalTrips ?? '-' }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <TrendingUp class="text-blue-600" :size="24" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-5">
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative flex-1 min-w-[250px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Tim theo ten, so dien thoai..."
            class="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="w-[180px]">
          <SelectInput
            v-model="driverStore.filters.status"
            :options="statusFilterOptions"
            placeholder="Tat ca trang thai"
            @update:model-value="handleStatusChange"
          />
        </div>

        <button class="h-11 px-6 bg-[#F2B233] text-white rounded-lg hover:bg-[#E0A020] transition-colors font-medium flex items-center gap-2" @click="handleSearch">
          <Search :size="18" />
          Tim kiem
        </button>

        <button class="h-11 px-5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" @click="handleReset">
          Dat lai
        </button>

        <button class="h-11 px-6 bg-[#4A2A12] text-white rounded-lg hover:bg-[#3A1F0E] transition-colors font-medium flex items-center gap-2" @click="openCreateModal">
          <Plus :size="18" />
          Them tai xe
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div v-if="driverStore.error" class="px-6 py-3 text-sm text-red-700 bg-red-50 border-b border-red-200">{{ driverStore.error }}</div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1120px] text-sm">
          <thead>
            <tr class="bg-[#4A2A12] text-white">
              <th class="text-left py-3 px-4 font-semibold w-[60px]">STT</th>
              <th class="text-left py-3 px-4 font-semibold w-[220px]">Tai xe</th>
              <th class="text-left py-3 px-4 font-semibold w-[150px]">So dien thoai</th>
              <th class="text-left py-3 px-4 font-semibold w-[160px]">Danh gia</th>
              <th class="text-left py-3 px-4 font-semibold w-[170px]">Phuong tien</th>
              <th class="text-left py-3 px-4 font-semibold w-[110px]">So chuyen</th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">Ngay tham gia</th>
              <th class="text-left py-3 px-4 font-semibold w-[140px]">Trang thai</th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">Thao tac</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="driverStore.loading">
              <td colspan="9" class="px-4 py-8 text-center text-gray-400">Dang tai...</td>
            </tr>
            <tr v-else-if="driverStore.records.length === 0">
              <td colspan="9" class="px-4 py-8 text-center text-gray-400">Khong co tai xe nao</td>
            </tr>
            <tr v-for="(driver, idx) in driverStore.records" :key="driver.id" :class="idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'">
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-[#F2B233] rounded-full overflow-hidden flex items-center justify-center text-white font-semibold text-sm">
                    <img v-if="driver.avatar" :src="driver.avatar" :alt="driver.name" class="w-full h-full object-cover" />
                    <span v-else>{{ getInitials(driver.name) }}</span>
                  </div>
                  <span class="text-sm font-medium text-[#4A2A12]">{{ driver.name }}</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-1 text-sm text-gray-600">
                  <Phone :size="14" />
                  {{ driver.phone }}
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-1">
                  <span class="font-semibold text-gray-800 mr-1">{{ driver.rating?.toFixed(1) ?? '-' }}</span>
                  <Star v-for="i in 5" :key="i" :size="12" :class="i <= renderStars(driver.rating) ? 'text-[#F2B233] fill-[#F2B233]' : 'text-gray-300 fill-gray-200'" />
                </div>
              </td>
              <td class="py-3 px-4">
                <button v-if="driver.vehicle" class="text-xs px-2 py-1 bg-[#4A2A12]/10 text-[#4A2A12] rounded hover:bg-[#4A2A12]/20 transition-colors" @click.stop="openVehicleModal(driver)">
                  {{ driver.vehicle.plate }}
                </button>
                <span v-else class="text-xs text-gray-400">Chua co xe</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm font-semibold text-[#F2B233]">{{ driver.totalTrips }}</span>
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ formatDate(driver.createdAt) }}</td>
              <td class="py-3 px-4">
                <span :class="driver.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'" class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium">
                  <CheckCircle v-if="driver.accountStatus === 'ACTIVE'" :size="12" />
                  <AlertCircle v-else :size="12" />
                  {{ driver.accountStatus === 'ACTIVE' ? 'Hoat dong' : 'Tam khoa' }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button class="p-1.5 hover:bg-gray-200 rounded transition-colors" title="Xem" @click="openVehicleModal(driver)">
                    <Eye :size="16" class="text-blue-600" />
                  </button>
                  <button class="p-1.5 hover:bg-gray-200 rounded transition-colors" title="Sua" @click="openEditModal(driver)">
                    <Pencil :size="16" class="text-orange-600" />
                  </button>
                  <button class="p-1.5 hover:bg-gray-200 rounded transition-colors" :title="driver.accountStatus === 'ACTIVE' ? 'Tam khoa' : 'Kich hoat'" @click="toggleDriverStatus(driver)">
                    <UserX v-if="driver.accountStatus === 'ACTIVE'" :size="16" class="text-red-600" />
                    <UserCheck v-else :size="16" class="text-green-600" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between px-4 py-4 border-t border-gray-200">
        <div class="text-sm text-gray-600">Hien thi {{ driverStore.records.length }} / {{ driverStore.pagination.total }} ket qua</div>
        <div class="flex items-center gap-1">
          <button class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">
            <ChevronLeft :size="16" />
          </button>
          <template v-for="p in pageNumbers()" :key="p">
            <button v-if="p !== '...'" class="w-8 h-8 flex items-center justify-center border rounded transition-colors" :class="p === currentPage ? 'bg-[#F2B233] text-white border-[#F2B233]' : 'border-gray-300 hover:bg-gray-50 text-gray-700'" @click="goToPage(Number(p))">
              {{ p }}
            </button>
            <span v-else class="px-1 text-gray-400">...</span>
          </template>
          <button class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" :disabled="currentPage >= driverStore.pagination.totalPages" @click="goToPage(currentPage + 1)">
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <Modal v-model="showCreateModal" title="Them Tai Xe Moi" size="lg">
    <div class="space-y-6">
      <div>
        <h3 class="text-base font-semibold text-[#4A2A12] mb-3 pb-2 border-b border-gray-200">Thong tin tai xe</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <TextInput v-model="createForm.name" label="Ho va ten *" placeholder="Nguyen Van B" />
            <p v-if="createFormErrors.name" class="text-xs text-red-600 mt-1.5">{{ createFormErrors.name }}</p>
          </div>
          <div>
            <TextInput v-model="createForm.phone" label="So dien thoai *" placeholder="0901122334" />
            <p v-if="createFormErrors.phone" class="text-xs text-red-600 mt-1.5">{{ createFormErrors.phone }}</p>
          </div>
          <div>
            <TextInput v-model="createForm.password" type="password" label="Mat khau *" />
            <p v-if="createFormErrors.password" class="text-xs text-red-600 mt-1.5">{{ createFormErrors.password }}</p>
          </div>
          <div>
            <TextInput v-model="createForm.avatar" label="Avatar URL" placeholder="https://..." />
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-base font-semibold text-[#4A2A12] mb-3 pb-2 border-b border-gray-200">Thong tin phap ly</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <TextInput v-model="createForm.citizenId" label="So CCCD *" placeholder="012345678901" />
            <p v-if="createFormErrors.citizenId" class="text-xs text-red-600 mt-1.5">{{ createFormErrors.citizenId }}</p>
          </div>
          <div>
            <TextInput v-model="createForm.dateOfBirth" type="date" label="Ngay sinh *" />
            <p v-if="createFormErrors.dateOfBirth" class="text-xs text-red-600 mt-1.5">{{ createFormErrors.dateOfBirth }}</p>
          </div>
          <div class="md:col-span-2">
            <TextInput v-model="createForm.contractNumber" label="Ma hop dong" placeholder="HD-2024-001 (tuy chon)" />
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-base font-semibold text-[#4A2A12] mb-3 pb-2 border-b border-gray-200">Thong tin phuong tien</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <TextInput v-model="createForm.vehicleModel" label="Model xe *" placeholder="INNOVA CROSS 2.0HEV" />
            <p v-if="createFormErrors.vehicleModel" class="text-xs text-red-600 mt-1.5">{{ createFormErrors.vehicleModel }}</p>
          </div>
          <div>
            <TextInput v-model="createForm.vehiclePlate" label="Bien so xe *" placeholder="16A-12345" />
            <p v-if="createFormErrors.vehiclePlate" class="text-xs text-red-600 mt-1.5">{{ createFormErrors.vehiclePlate }}</p>
          </div>
          <div>
            <TextInput :model-value="String(createForm.vehicleSeats)" type="number" label="So cho *" @update:model-value="createForm.vehicleSeats = Number($event)" />
          </div>
        </div>
      </div>

      <div v-if="driverStore.error" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{{ driverStore.error }}</div>

      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <button class="flex-1 h-11 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" @click="showCreateModal = false">Huy</button>
        <button class="flex-1 h-11 bg-[#F2B233] hover:bg-[#E0A020] text-white rounded-lg transition-colors font-medium disabled:opacity-50" :disabled="driverStore.loading" @click="submitCreate">
          {{ driverStore.loading ? 'Dang tao...' : 'Them tai xe' }}
        </button>
      </div>
    </div>
  </Modal>

  <Modal v-model="showEditModal" title="Chinh Sua Tai Xe" size="lg">
    <div v-if="driverStore.selectedDriver" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <TextInput v-model="editForm.name" label="Ten tai xe *" />
          <p v-if="editFormErrors.name" class="text-xs text-red-600 mt-1.5">{{ editFormErrors.name }}</p>
        </div>
        <TextInput v-model="editForm.avatar" label="Avatar URL" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput v-model="editForm.rating" type="number" label="Danh gia (0-5)" />
        <TextInput :model-value="driverStore.selectedDriver.phone" label="So dien thoai" disabled />
      </div>

      <div class="rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm space-y-2">
        <p class="text-gray-500 mb-1">Xe hien tai</p>
        <input type="text" :value="driverStore.selectedDriver.vehicle?.model ?? '-'" disabled class="w-full h-10 px-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700" />
        <input type="text" :value="driverStore.selectedDriver.vehicle?.plate ?? '-'" disabled class="w-full h-10 px-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700" />
      </div>

      <div v-if="driverStore.error" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{{ driverStore.error }}</div>

      <div class="flex gap-3 pt-2">
        <button class="flex-1 h-11 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" @click="showEditModal = false">Huy</button>
        <button class="flex-1 h-11 bg-[#F2B233] hover:bg-[#E0A020] text-white rounded-lg transition-colors font-medium disabled:opacity-50" :disabled="driverStore.loading" @click="submitEdit">
          {{ driverStore.loading ? 'Dang luu...' : 'Luu thay doi' }}
        </button>
      </div>
    </div>
  </Modal>

  <Modal v-model="showVehicleModal" title="Thong Tin Phuong Tien">
    <div v-if="driverStore.selectedDriver" class="space-y-4">
      <div class="flex items-center gap-4 pb-4 border-b border-gray-100">
        <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg flex-shrink-0">
          {{ getInitials(driverStore.selectedDriver.name) }}
        </div>
        <div>
          <p class="font-semibold text-gray-900">{{ driverStore.selectedDriver.name }}</p>
          <p class="text-sm text-gray-500">{{ driverStore.selectedDriver.phone }}</p>
        </div>
      </div>

      <div v-if="driverStore.selectedDriver.vehicle" class="space-y-3 text-sm">
        <div>
          <p class="text-gray-500 text-xs mb-1">Model xe</p>
          <input type="text" :value="driverStore.selectedDriver.vehicle.model" disabled class="w-full h-10 px-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700" />
        </div>
        <div>
          <p class="text-gray-500 text-xs mb-1">Bien so xe</p>
          <input type="text" :value="driverStore.selectedDriver.vehicle.plate" disabled class="w-full h-10 px-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700" />
        </div>
        <div>
          <p class="text-gray-500 text-xs mb-1">So cho ngoi</p>
          <input type="text" :value="String(driverStore.selectedDriver.vehicle.seatsTotal)" disabled class="w-full h-10 px-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700" />
        </div>
        <div>
          <p class="text-gray-500 text-xs mb-1">Tong chuyen di</p>
          <input type="text" :value="String(driverStore.selectedDriver.totalTrips)" disabled class="w-full h-10 px-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700" />
        </div>
      </div>

      <div v-else class="text-gray-400 text-sm text-center py-4">Tai xe chua co phuong tien</div>

      <button class="w-full h-11 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" @click="showVehicleModal = false">Dong</button>
    </div>
  </Modal>

  <Modal v-model="showStatusConfirm" title="Xac Nhan Thay Doi Trang Thai">
    <div v-if="statusConfirmDriver" class="space-y-4">
      <p class="text-sm text-gray-700">
        Ban co chac chan muon {{ statusConfirmDriver.accountStatus === 'ACTIVE' ? 'tam khoa' : 'kich hoat' }} tai xe <strong>{{ statusConfirmDriver.name }}</strong>?
      </p>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p>Trang thai hien tai: <strong>{{ statusConfirmDriver.accountStatus === 'ACTIVE' ? 'Hoat dong' : 'Tam khoa' }}</strong></p>
        <p class="mt-1">Trang thai moi: <strong>{{ statusConfirmDriver.accountStatus === 'ACTIVE' ? 'Tam khoa' : 'Hoat dong' }}</strong></p>
      </div>
      <div class="flex gap-3 pt-2">
        <button class="flex-1 h-11 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" @click="showStatusConfirm = false">Huy</button>
        <button class="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium" @click="confirmStatusToggle">
          Xac nhan thay doi
        </button>
      </div>
    </div>
  </Modal>
</template>
