import { writeFileSync } from 'fs'

const content = `<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useDriverStore } from '@/stores/drivers'
import type { AdminDriver, CreateDriverDto } from '@/types/api'
import Modal from '@/components/ui/Modal.vue'
import TextInput from '@/components/ui/TextInput.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import { Eye, Pencil, UserCheck, UserX, ChevronLeft, ChevronRight, Star } from 'lucide-vue-next'

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
})

const editForm = reactive({ id: 0, name: '', avatar: '', rating: '' })
const searchInput = ref('')

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
}

const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const submitCreate = async () => {
  if (!createForm.name || !createForm.phone || !createForm.password || !createForm.vehicleModel || !createForm.vehiclePlate) {
    window.alert('Vui long dien day du thong tin.'); return
  }
  const payload: CreateDriverDto = {
    name: createForm.name.trim(),
    phone: createForm.phone.trim(),
    password: createForm.password,
    avatar: createForm.avatar.trim() || undefined,
    vehicleModel: createForm.vehicleModel.trim(),
    vehiclePlate: createForm.vehiclePlate.trim(),
    vehicleSeats: Number(createForm.vehicleSeats),
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
  showEditModal.value = true
}

const submitEdit = async () => {
  if (!editForm.id || !editForm.name.trim()) { window.alert('Thong tin tai xe khong hop le.'); return }
  const ratingValue = Number(editForm.rating)
  await driverStore.updateDriver(editForm.id, {
    name: editForm.name.trim(),
    avatar: editForm.avatar.trim() || undefined,
    rating: Number.isNaN(ratingValue) ? undefined : ratingValue,
  })
  if (!driverStore.error) { showEditModal.value = false; await loadDrivers(currentPage.value) }
}

const toggleDriverStatus = async (driver: AdminDriver) => {
  const nextStatus = driver.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  await driverStore.updateDriverStatus(driver.id, nextStatus)
  if (!driverStore.error) {
    await Promise.all([loadDrivers(currentPage.value), driverStore.fetchDriverSummary()])
  }
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
<\/script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Quan Ly Tai Xe</h1>
      <button class="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors" @click="openCreateModal">
        + Them Tai Xe
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5" style="border-top: 4px solid #3b82f6">
        <p class="text-sm text-gray-500 mb-1">Tong Tai Xe</p>
        <p class="text-3xl font-bold text-gray-900">{{ driverStore.summary?.total ?? driverStore.pagination.total }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5" style="border-top: 4px solid #22c55e">
        <p class="text-sm text-gray-500 mb-1">Dang Hoat Dong</p>
        <p class="text-3xl font-bold text-gray-900">{{ driverStore.summary?.active ?? driverStore.activeCount }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5" style="border-top: 4px solid #f59e0b">
        <p class="text-sm text-gray-500 mb-1">Danh Gia TB</p>
        <p class="text-3xl font-bold text-gray-900">{{ driverStore.summary?.averageRating?.toFixed(1) ?? '-' }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5" style="border-top: 4px solid #a855f7">
        <p class="text-sm text-gray-500 mb-1">Tong Chuyen Di</p>
        <p class="text-3xl font-bold text-gray-900">{{ driverStore.summary?.totalTrips ?? '-' }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs text-gray-500 mb-1">Tim kiem (ten hoac SDT)</label>
          <input v-model="searchInput" type="text" placeholder="Tim kiem..." class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" @keyup.enter="handleSearch" />
        </div>
        <div class="min-w-[160px]">
          <label class="block text-xs text-gray-500 mb-1">Trang thai</label>
          <SelectInput v-model="driverStore.filters.status" :options="statusFilterOptions" placeholder="Tat ca" @update:model-value="handleStatusChange" />
        </div>
        <button class="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors" @click="handleSearch">Tim kiem</button>
        <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors" @click="handleReset">Dat lai</button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div v-if="driverStore.error" class="px-6 py-3 text-sm text-red-700 bg-red-50 border-b border-red-200">{{ driverStore.error }}</div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-800 text-white">
              <th class="px-4 py-3 text-left font-semibold w-12">STT</th>
              <th class="px-4 py-3 text-left font-semibold">Tai Xe</th>
              <th class="px-4 py-3 text-left font-semibold">SDT</th>
              <th class="px-4 py-3 text-left font-semibold">Danh Gia</th>
              <th class="px-4 py-3 text-left font-semibold">Phuong Tien</th>
              <th class="px-4 py-3 text-left font-semibold">Chuyen Di</th>
              <th class="px-4 py-3 text-left font-semibold">Ngay Tham Gia</th>
              <th class="px-4 py-3 text-left font-semibold">Trang Thai</th>
              <th class="px-4 py-3 text-center font-semibold">Thao Tac</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="driverStore.loading"><td colspan="9" class="px-4 py-8 text-center text-gray-400">Dang tai...</td></tr>
            <tr v-else-if="driverStore.records.length === 0"><td colspan="9" class="px-4 py-8 text-center text-gray-400">Khong co tai xe nao</td></tr>
            <tr v-for="(driver, idx) in driverStore.records" :key="driver.id" :class="idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'" class="border-b border-gray-100 hover:bg-amber-50 transition-colors">
              <td class="px-4 py-3 text-gray-500">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-amber-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-amber-700 font-semibold text-xs">
                    <img v-if="driver.avatar" :src="driver.avatar" :alt="driver.name" class="w-full h-full object-cover" />
                    <span v-else>{{ driver.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <span class="font-medium text-gray-900">{{ driver.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ driver.phone }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <span class="font-semibold text-gray-800 mr-1">{{ driver.rating?.toFixed(1) ?? '-' }}</span>
                  <Star v-for="i in 5" :key="i" :size="12" :class="i <= renderStars(driver.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-200'" />
                </div>
              </td>
              <td class="px-4 py-3">
                <button v-if="driver.vehicle" class="text-blue-600 hover:underline font-medium" @click.stop="openVehicleModal(driver)">{{ driver.vehicle.plate }}</button>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 font-medium text-gray-700">{{ driver.totalTrips }}</td>
              <td class="px-4 py-3 text-gray-500">{{ formatDate(driver.createdAt) }}</td>
              <td class="px-4 py-3">
                <span :class="driver.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  {{ driver.accountStatus === 'ACTIVE' ? 'Hoat dong' : 'Tam khoa' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" @click="openVehicleModal(driver)"><Eye :size="15" /></button>
                  <button class="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors" @click="openEditModal(driver)"><Pencil :size="15" /></button>
                  <button :class="driver.accountStatus === 'ACTIVE' ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'" class="p-1.5 rounded-lg transition-colors" @click="toggleDriverStatus(driver)">
                    <UserX v-if="driver.accountStatus === 'ACTIVE'" :size="15" />
                    <UserCheck v-else :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-4 bg-white flex-wrap">
        <p class="text-sm text-gray-500">Hien thi {{ driverStore.records.length }} / {{ driverStore.pagination.total }} tai xe</p>
        <div class="flex items-center gap-1">
          <button :disabled="currentPage <= 1" class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" @click="goToPage(currentPage - 1)"><ChevronLeft :size="16" /></button>
          <template v-for="p in pageNumbers()" :key="p">
            <button v-if="p !== '...'" :class="p === currentPage ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'" class="min-w-[32px] h-8 rounded-lg border text-sm font-medium transition-colors" @click="goToPage(Number(p))">{{ p }}</button>
            <span v-else class="px-1 text-gray-400 select-none">...</span>
          </template>
          <button :disabled="currentPage >= driverStore.pagination.totalPages" class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" @click="goToPage(currentPage + 1)"><ChevronRight :size="16" /></button>
        </div>
      </div>
    </div>
  </div>

  <Modal v-model="showCreateModal" title="Them Tai Xe Moi" size="lg">
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput v-model="createForm.name" label="Ten tai xe *" placeholder="Nguyen Van B" />
        <TextInput v-model="createForm.phone" label="So dien thoai *" placeholder="0901122334" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput v-model="createForm.password" type="password" label="Mat khau *" />
        <TextInput v-model="createForm.avatar" label="Avatar URL" placeholder="https://..." />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput v-model="createForm.vehicleModel" label="Model xe *" placeholder="Toyota Innova" />
        <TextInput v-model="createForm.vehiclePlate" label="Bien so *" placeholder="43A-12345" />
        <TextInput :model-value="String(createForm.vehicleSeats)" type="number" label="So ghe *" @update:model-value="createForm.vehicleSeats = Number($event)" />
      </div>
      <div v-if="driverStore.error" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{{ driverStore.error }}</div>
      <div class="flex gap-3 pt-2">
        <button class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50" @click="showCreateModal = false">Huy</button>
        <button class="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50" :disabled="driverStore.loading" @click="submitCreate">{{ driverStore.loading ? 'Dang tao...' : 'Tao tai xe' }}</button>
      </div>
    </div>
  </Modal>

  <Modal v-model="showEditModal" title="Chinh Sua Tai Xe" size="lg">
    <div v-if="driverStore.selectedDriver" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput v-model="editForm.name" label="Ten tai xe *" />
        <TextInput v-model="editForm.avatar" label="Avatar URL" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput v-model="editForm.rating" type="number" label="Danh gia (0-5)" />
        <TextInput :model-value="driverStore.selectedDriver.phone" label="So dien thoai" disabled />
      </div>
      <div class="rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm">
        <p class="text-gray-500 mb-1">Xe hien tai</p>
        <p class="font-medium">{{ driverStore.selectedDriver.vehicle?.model ?? '-' }} - {{ driverStore.selectedDriver.vehicle?.plate ?? '-' }}</p>
      </div>
      <div v-if="driverStore.error" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{{ driverStore.error }}</div>
      <div class="flex gap-3 pt-2">
        <button class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50" @click="showEditModal = false">Huy</button>
        <button class="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50" :disabled="driverStore.loading" @click="submitEdit">{{ driverStore.loading ? 'Dang luu...' : 'Luu thay doi' }}</button>
      </div>
    </div>
  </Modal>

  <Modal v-model="showVehicleModal" title="Thong Tin Phuong Tien">
    <div v-if="driverStore.selectedDriver" class="space-y-4">
      <div class="flex items-center gap-4 pb-4 border-b border-gray-100">
        <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg flex-shrink-0">{{ driverStore.selectedDriver.name.charAt(0).toUpperCase() }}</div>
        <div>
          <p class="font-semibold text-gray-900">{{ driverStore.selectedDriver.name }}</p>
          <p class="text-sm text-gray-500">{{ driverStore.selectedDriver.phone }}</p>
        </div>
      </div>
      <div v-if="driverStore.selectedDriver.vehicle" class="grid grid-cols-2 gap-3 text-sm">
        <div class="bg-gray-50 rounded-lg p-3"><p class="text-gray-500 text-xs mb-0.5">Model xe</p><p class="font-semibold text-gray-900">{{ driverStore.selectedDriver.vehicle.model }}</p></div>
        <div class="bg-gray-50 rounded-lg p-3"><p class="text-gray-500 text-xs mb-0.5">Bien so</p><p class="font-semibold text-gray-900">{{ driverStore.selectedDriver.vehicle.plate }}</p></div>
        <div class="bg-gray-50 rounded-lg p-3"><p class="text-gray-500 text-xs mb-0.5">So ghe</p><p class="font-semibold text-gray-900">{{ driverStore.selectedDriver.vehicle.seatsTotal }}</p></div>
        <div class="bg-gray-50 rounded-lg p-3"><p class="text-gray-500 text-xs mb-0.5">Tong chuyen di</p><p class="font-semibold text-gray-900">{{ driverStore.selectedDriver.totalTrips }}</p></div>
      </div>
      <div v-else class="text-gray-400 text-sm text-center py-4">Tai xe chua co phuong tien</div>
      <button class="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50" @click="showVehicleModal = false">Dong</button>
    </div>
  </Modal>
</template>
`

writeFileSync('d:\\Work\\HDN\\HDN_RIDE_FE\\src\\pages\\DriverManagementPage.vue', content, 'utf8')
console.log('Written successfully')
