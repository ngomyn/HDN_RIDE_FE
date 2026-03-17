<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { useTripStore } from '@/stores/trips'
import { routeOptions } from '@/data/mockData'
import districtAPI from '@/services/districtAPI'
import type { District } from '@/types/api'
import type { TripExecutionStatus } from '@/types/models'
import { formatDateDisplay } from '@/utils/format'
import {
  Calendar,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
} from 'lucide-vue-next'

interface UiTrip {
  id: number
  route: string
  routeName: string
  date: string
  time: string
  driver: string
  ward: string
  price: number
  status: TripExecutionStatus
  creator: string
  availableSeats: number
}

interface DuplicateFormData {
  route: string
  district: string
  ward: string
  date: string
  time: string
  price: string
  driver: string
}

const tripStore = useTripStore()
const { records, loading, error, pagination } = storeToRefs(tripStore)

const pageSize = 10
const currentPage = ref(1)

const filterDate = ref('')
const filterRoute = ref('all')
const filterDriver = ref('')
const filterCreator = ref('')

const appliedFilters = reactive({
  date: '',
  route: 'all',
  driver: '',
  creator: '',
})

const showDuplicateModal = ref(false)
const selectedTrip = ref<UiTrip | null>(null)

const duplicateFormData = reactive<DuplicateFormData>({
  route: routeOptions[0] ?? '',
  district: '',
  ward: '',
  date: '',
  time: '',
  price: '',
  driver: '',
})

const districtOptions = ref<District[]>([])
const wardOptions = ref<string[]>([])
const districtLoading = ref(false)
const wardsLoading = ref(false)
const allDistricts = ref<District[]>([])

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const routeKey = (route: string): string => {
  const value = normalizeText(route).replace(/\s+/g, '')
  if (value === 'dn-hue' || value === 'danang->hue') return 'dn-hue'
  if (value === 'hue-dn' || value === 'hue->danang') return 'hue-dn'
  return value
}

const getRouteLabel = (route: string): string => {
  const key = routeKey(route)
  if (key === 'dn-hue') return 'Đà Nẵng → Huế'
  if (key === 'hue-dn') return 'Huế → Đà Nẵng'
  return route.replace(/\s*->\s*/g, ' → ')
}

const getRouteBadgeClass = (route: string): string =>
  routeKey(route) === 'dn-hue'
    ? 'bg-[#F2B233]/10 text-[#F2B233]'
    : 'bg-[#4A2A12]/10 text-[#4A2A12]'

const getStatusText = (status: TripExecutionStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'Chờ khởi hành'
    case 'RUNNING':
      return 'Đang chạy'
    case 'COMPLETED':
      return 'Hoàn thành'
    case 'CANCELED':
      return 'Đã hủy'
    default:
      return status
  }
}

const getStatusBadgeClass = (status: TripExecutionStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-orange-100 text-orange-600'
    case 'RUNNING':
      return 'bg-green-100 text-green-600'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-600'
    case 'CANCELED':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const toLocalDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toLocalTime = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

const normalizedTrips = computed<UiTrip[]>(() => {
  console.log(records.value);
  
  return records.value?.map((item: any) => {
    const route =
      typeof item.route === 'string' && item.route
        ? item.route
        : item.fromPlace && item.toPlace
          ? `${item.fromPlace} -> ${item.toPlace}`
          : ''

    const rawStatus = String(item.status ?? 'PENDING').toUpperCase()
    const status: TripExecutionStatus =
      rawStatus === 'PENDING' ||
      rawStatus === 'RUNNING' ||
      rawStatus === 'COMPLETED' ||
      rawStatus === 'CANCELED'
        ? rawStatus
        : 'PENDING'

    const date =
      typeof item.date === 'string' && item.date
        ? toLocalDate(item.date)
        : typeof item.departAt === 'string' && item.departAt
          ? toLocalDate(item.departAt)
          : ''

    const time =
      typeof item.time === 'string' && item.time
        ? item.time.slice(0, 5)
        : typeof item.departAt === 'string' && item.departAt
          ? toLocalTime(item.departAt)
          : '--:--'

    return {
      id: Number(item.id ?? 0),
      route,
      routeName: getRouteLabel(route),
      date,
      time,
      driver:
        typeof item.driver === 'string' && item.driver
          ? item.driver
          : item.driver?.name ?? '--',
      ward: String(item.pickupWard ?? item.fromAddress ?? '--'),
      price: Number(item.price ?? item.tripCost ?? 0),
      status,
      creator: String(item.createdBy ?? 'Admin hệ thống'),
      availableSeats: Number(item.availableSeats ?? 0),
    }
  })
})

const routeFilterOptions = computed(() => [
  { value: 'all', label: 'Tất cả' },
  ...routeOptions.map(route => ({
    value: route,
    label: getRouteLabel(route),
  })),
])

const drivers = computed(() => {
  return Array.from(new Set(normalizedTrips.value.map(trip => trip.driver))).filter(
    driver => Boolean(driver) && driver !== '--'
  )
})

const getSourceCityByRoute = (route: string): 'danang' | 'hue' => {
  return routeKey(route) === 'hue-dn' ? 'hue' : 'danang'
}

const findRouteSource = (route: string): string => {
  const found = routeOptions.find(option => routeKey(option) === routeKey(route))
  return found ?? route
}

const getDistrictsByProvinceFallback = (city: 'danang' | 'hue'): District[] => {
  const provinceKeyword = city === 'hue' ? 'hue' : 'da nang'
  return allDistricts.value.filter(district =>
    normalizeText(district.province_name).includes(provinceKeyword)
  )
}

const ensureAllDistrictsLoaded = async () => {
  if (allDistricts.value.length > 0) {
    return
  }

  const result = await districtAPI.getAllDistricts()
  allDistricts.value = result.data ?? []
}

const mapDistrictNamesToDistrictObjects = (districtNames: string[]): District[] => {
  const districtMap = new Map(
    allDistricts.value.map(district => [normalizeText(district.name), district])
  )

  return districtNames
    .map(name => districtMap.get(normalizeText(name)))
    .filter((district): district is District => Boolean(district))
}

const loadDistrictsForRoute = async (route: string) => {
  districtLoading.value = true
  duplicateFormData.district = ''
  duplicateFormData.ward = ''
  wardOptions.value = []

  try {
    const sourceCity = getSourceCityByRoute(route)
    await ensureAllDistrictsLoaded()

    const byCityResult =
      sourceCity === 'hue'
        ? await districtAPI.getHueDistricts()
        : await districtAPI.getDaNangDistricts()

    const districtNames = byCityResult.data ?? []
    const mappedDistricts = mapDistrictNamesToDistrictObjects(districtNames)

    districtOptions.value =
      mappedDistricts.length > 0
        ? mappedDistricts
        : getDistrictsByProvinceFallback(sourceCity)
  } catch (_error) {
    districtOptions.value = []
  } finally {
    districtLoading.value = false
  }
}

const loadWardsByDistrictCode = async (districtCode: number) => {
  wardsLoading.value = true
  duplicateFormData.ward = ''

  try {
    const result = await districtAPI.getDistrictWards(districtCode)
    wardOptions.value = result.data ?? []
  } catch (_error) {
    wardOptions.value = []
  } finally {
    wardsLoading.value = false
  }
}

watch(
  () => duplicateFormData.route,
  async route => {
    if (!route) {
      districtOptions.value = []
      wardOptions.value = []
      duplicateFormData.district = ''
      duplicateFormData.ward = ''
      return
    }

    await loadDistrictsForRoute(route)
  }
)

watch(
  () => duplicateFormData.district,
  async districtCode => {
    if (!districtCode) {
      wardOptions.value = []
      duplicateFormData.ward = ''
      return
    }

    await loadWardsByDistrictCode(Number(districtCode))
  }
)

const filteredTrips = computed(() => {
  return normalizedTrips.value.filter(trip => {
    if (appliedFilters.date && trip.date !== appliedFilters.date) return false
    if (appliedFilters.route !== 'all' && routeKey(trip.route) !== routeKey(appliedFilters.route)) {
      return false
    }

    if (appliedFilters.driver) {
      const tripDriver = normalizeText(trip.driver)
      if (!tripDriver.includes(normalizeText(appliedFilters.driver))) return false
    }

    if (appliedFilters.creator) {
      const tripCreator = normalizeText(trip.creator)
      if (!tripCreator.includes(normalizeText(appliedFilters.creator))) return false
    }

    return true
  })
})

const totalRecords = computed(() => pagination.value.total ?? 0)

const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / pageSize)))

watch(totalPages, next => {
  if (currentPage.value > next) {
    currentPage.value = next
  }
})

const paginatedTrips = computed(() => {
  return filteredTrips.value
})

const pageNumbers = computed(() => {
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPages.value, start + 4)
  start = Math.max(1, end - 4)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const resultFrom = computed(() => {
  if (totalRecords.value === 0) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const resultTo = computed(() => {
  if (totalRecords.value === 0) return 0
  return Math.min((currentPage.value - 1) * pageSize + paginatedTrips.value.length, totalRecords.value)
})

const pendingCount = computed(() => filteredTrips.value.filter(trip => trip.status === 'PENDING').length)
const runningCount = computed(() => filteredTrips.value.filter(trip => trip.status === 'RUNNING').length)
const completedCount = computed(() => filteredTrips.value.filter(trip => trip.status === 'COMPLETED').length)
const canceledCount = computed(() => filteredTrips.value.filter(trip => trip.status === 'CANCELED').length)

const toSearchDateStart = (date: string): string => `${date}T00:00:00`
const toSearchDateEnd = (date: string): string => `${date}T23:59:59`

const getRouteSearchPlaces = (route: string): { fromPlace?: string; toPlace?: string } => {
  if (!route || route === 'all') {
    return {}
  }

  const source = findRouteSource(route)
  const key = routeKey(source)

  if (key === 'dn-hue') {
    return { fromPlace: 'Đà Nẵng', toPlace: 'Huế' }
  }

  if (key === 'hue-dn') {
    return { fromPlace: 'Huế', toPlace: 'Đà Nẵng' }
  }

  const [fromPlace, toPlace] = source.split('->').map(part => part.trim())

  if (!fromPlace || !toPlace) {
    return {}
  }

  return { fromPlace, toPlace }
}

const buildSearchParams = (page: number, route: string, date: string) => {
  const routePlaces = getRouteSearchPlaces(route)

  return {
    page,
    limit: pageSize,
    ...routePlaces,
    startDate: date ? toSearchDateStart(date) : undefined,
    endDate: date ? toSearchDateEnd(date) : undefined,
  }
}

const handleSearch = async () => {
  appliedFilters.date = filterDate.value
  appliedFilters.route = filterRoute.value
  appliedFilters.driver = filterDriver.value
  appliedFilters.creator = filterCreator.value
  currentPage.value = 1

  await tripStore.fetchTrips(buildSearchParams(1, appliedFilters.route, appliedFilters.date))
}

const handleReset = async () => {
  filterDate.value = ''
  filterRoute.value = 'all'
  filterDriver.value = ''
  filterCreator.value = ''
  await handleSearch()
}

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return

  currentPage.value = page
  await tripStore.fetchTrips(buildSearchParams(page, appliedFilters.route, appliedFilters.date))
}

const handleDeleteClick = async (trip: UiTrip) => {
  const accepted = window.confirm(`Bạn có chắc muốn xóa chuyến #${trip.id}?`)
  if (!accepted) return
  await tripStore.deleteTrip(trip.id)
}

const handleViewClick = (trip: UiTrip) => {
  window.alert(`Chi tiết chuyến #${trip.id} đang được cập nhật.`)
}

const handleEditClick = (trip: UiTrip) => {
  window.alert(`Sửa chuyến #${trip.id} sẽ được triển khai ở bước tiếp theo.`)
}

const handleDuplicateClick = (trip: UiTrip) => {
  selectedTrip.value = trip
  duplicateFormData.route = findRouteSource(trip.route)
  duplicateFormData.district = ''
  duplicateFormData.ward = ''
  duplicateFormData.date = ''
  duplicateFormData.time = ''
  duplicateFormData.price = String(trip.price)
  duplicateFormData.driver = trip.driver
  showDuplicateModal.value = true
  void loadDistrictsForRoute(duplicateFormData.route)
}

const handleModalClose = () => {
  showDuplicateModal.value = false
  selectedTrip.value = null
}

const getTodayIsoDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parsePrice = (value: string): number => {
  const numeric = value.replace(/[^\d]/g, '')
  return Number(numeric || 0)
}

const handleDuplicateSubmit = () => {
  if (!selectedTrip.value) return

  if (
    !duplicateFormData.route ||
    !duplicateFormData.district ||
    !duplicateFormData.ward ||
    !duplicateFormData.driver
  ) {
    window.alert('Vui lòng điền đầy đủ tuyến, quận/huyện, phường đón và tài xế.')
    return
  }

  const newDate = duplicateFormData.date || getTodayIsoDate()
  const newTime = duplicateFormData.time || selectedTrip.value.time
  const newPrice = parsePrice(duplicateFormData.price)

  const maxId = normalizedTrips.value.reduce((max, trip) => Math.max(max, trip.id), 0)
  tripStore.addLocalTrip({
    id: maxId + 1,
    route: findRouteSource(duplicateFormData.route),
    date: newDate,
    time: newTime,
    driver: duplicateFormData.driver,
    pickupWard: duplicateFormData.ward,
    price: newPrice,
    status: 'PENDING',
    createdBy: 'Admin sao chép',
    availableSeats: selectedTrip.value.availableSeats,
  })

  handleModalClose()
}

onMounted(async () => {
  await handleSearch()
})
</script>

<template>
  <div class="p-6 space-y-5">
    <Breadcrumb :items="['Trang chủ', 'Trạng thái chuyến xe']" />

    <h1 class="text-2xl font-bold text-[#4A2A12]">Kiểm tra trạng thái chuyến xe</h1>

    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3"
    >
      {{ error }}
    </div>

    <div class="bg-white rounded-xl shadow-sm p-5">
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative">
          <Calendar
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            :size="18"
          />
          <input
            v-model="filterDate"
            type="date"
            class="w-[200px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
          >
        </div>

        <select
          v-model="filterRoute"
          class="w-[220px] h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
        >
          <option
            v-for="option in routeFilterOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            :size="18"
          />
          <input
            v-model="filterDriver"
            type="text"
            placeholder="Tìm theo tên tài xế"
            class="w-[200px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
          >
        </div>

        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            :size="18"
          />
          <input
            v-model="filterCreator"
            type="text"
            placeholder="Tìm theo admin tạo"
            class="w-[200px] h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
          >
        </div>

        <button
          class="h-11 px-6 bg-[#F2B233] text-white rounded-lg hover:bg-[#E0A020] transition-colors font-medium flex items-center gap-2 disabled:opacity-60"
          :disabled="loading"
          @click="handleSearch"
        >
          <Search :size="18" />
          Tìm kiếm
        </button>

        <button
          class="h-11 px-5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          @click="handleReset"
        >
          Đặt lại
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-sm text-gray-600">Tổng chuyến</p>
        <p class="text-2xl font-bold text-[#F2B233]">{{ filteredTrips.length }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-sm text-gray-600">Chờ khởi hành</p>
        <p class="text-2xl font-bold text-orange-500">{{ pendingCount }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-sm text-gray-600">Đang chạy</p>
        <p class="text-2xl font-bold text-green-600">{{ runningCount }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-sm text-gray-600">Hoàn thành/Đã hủy</p>
        <p class="text-2xl font-bold text-blue-600">{{ completedCount + canceledCount }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1120px]">
          <thead>
            <tr class="bg-[#4A2A12] text-white text-sm">
              <th class="text-left py-3 px-4 font-semibold w-[60px]">STT</th>
              <th class="text-left py-3 px-4 font-semibold w-[180px]">Tuyến</th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">Ngày</th>
              <th class="text-left py-3 px-4 font-semibold w-[80px]">Giờ</th>
              <th class="text-left py-3 px-4 font-semibold w-[150px]">Tài xế</th>
              <th class="text-left py-3 px-4 font-semibold w-[160px]">Phường đón</th>
              <th class="text-left py-3 px-4 font-semibold w-[120px]">Giá vé</th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">Trạng thái</th>
              <th class="text-left py-3 px-4 font-semibold w-[130px]">Người tạo</th>
              <th class="text-left py-3 px-4 font-semibold w-[110px]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="py-6 px-4 text-center text-gray-500" colspan="10">
                Đang tải dữ liệu...
              </td>
            </tr>
            <tr v-else-if="paginatedTrips.length === 0">
              <td class="py-6 px-4 text-center text-gray-500" colspan="10">
                Không có chuyến xe phù hợp bộ lọc.
              </td>
            </tr>
            <tr
              v-for="(trip, index) in paginatedTrips"
              v-else
              :key="trip.id"
              :class="index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'"
            >
              <td class="py-3 px-4 text-sm text-[#4A2A12]">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'inline-block px-2 py-1 rounded text-xs font-medium',
                    getRouteBadgeClass(trip.route),
                  ]"
                >
                  {{ trip.routeName }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ formatDateDisplay(trip.date) }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ trip.time }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ trip.driver }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ trip.ward }}</td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ trip.price.toLocaleString('vi-VN') }} ₫</td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'inline-block px-2 py-1 rounded text-xs font-medium',
                    getStatusBadgeClass(trip.status),
                  ]"
                >
                  {{ getStatusText(trip.status) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-[#4A2A12]">{{ trip.creator }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Xem"
                    @click="handleViewClick(trip)"
                  >
                    <Eye :size="16" class="text-blue-600" />
                  </button>
                  <button
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Sửa"
                    @click="handleEditClick(trip)"
                  >
                    <Edit :size="16" class="text-orange-600" />
                  </button>
                  <button
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Xóa"
                    @click="handleDeleteClick(trip)"
                  >
                    <Trash2 :size="16" class="text-red-600" />
                  </button>
                  <button
                    class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Sao chép"
                    @click="handleDuplicateClick(trip)"
                  >
                    <Copy :size="16" class="text-gray-600" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between px-4 py-4 border-t border-gray-200">
        <div class="text-sm text-gray-600">
          Hiển thị {{ resultFrom }}-{{ resultTo }} của {{ totalRecords }} kết quả
        </div>
        <div class="flex items-center gap-1">
          <button
            class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft :size="16" />
          </button>

          <button
            v-for="page in pageNumbers"
            :key="page"
            class="w-8 h-8 flex items-center justify-center border rounded transition-colors"
            :class="
              page === currentPage
                ? 'bg-[#F2B233] text-white border-[#F2B233]'
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            "
            @click="goToPage(page)"
          >
            {{ page }}
          </button>

          <button
            class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDuplicateModal && selectedTrip"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          @click.self="handleModalClose"
        >
          <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-[420px]">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-[#4A2A12]">Sao chép chuyến xe</h2>
              <button
                class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="Đóng"
                @click="handleModalClose"
              >
                <X :size="16" class="text-gray-600" />
              </button>
            </div>

            <form class="space-y-4" @submit.prevent="handleDuplicateSubmit">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tuyến</label>
                <select
                  v-model="duplicateFormData.route"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                >
                  <option v-for="route in routeOptions" :key="route" :value="route">
                    {{ getRouteLabel(route) }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                <select
                  v-model="duplicateFormData.district"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                  :disabled="districtLoading || districtOptions.length === 0"
                >
                  <option value="">
                    {{ districtLoading ? 'Đang tải quận/huyện...' : 'Chọn quận/huyện' }}
                  </option>
                  <option
                    v-for="district in districtOptions"
                    :key="district.code"
                    :value="String(district.code)"
                  >
                    {{ district.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phường đón</label>
                <select
                  v-model="duplicateFormData.ward"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                  :disabled="!duplicateFormData.district || wardsLoading || wardOptions.length === 0"
                >
                  <option value="">
                    {{ wardsLoading ? 'Đang tải phường/xã...' : 'Chọn phường/xã' }}
                  </option>
                  <option v-for="ward in wardOptions" :key="ward" :value="ward">{{ ward }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                <input
                  v-model="duplicateFormData.date"
                  type="date"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Giờ</label>
                <input
                  v-model="duplicateFormData.time"
                  type="time"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Giá vé</label>
                <input
                  v-model="duplicateFormData.price"
                  type="text"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tài xế</label>
                <select
                  v-model="duplicateFormData.driver"
                  class="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2B233] transition-colors"
                >
                  <option v-for="driver in drivers" :key="driver" :value="driver">{{ driver }}</option>
                </select>
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  class="h-11 px-6 bg-[#F2B233] text-white rounded-lg hover:bg-[#E0A020] transition-colors font-medium flex items-center gap-2"
                >
                  <Check :size="18" />
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
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
