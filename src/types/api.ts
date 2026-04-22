// Enums
export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'MANAGER'
export type AccountStatus = 'ACTIVE' | 'INACTIVE'
export type DriverType = 'COMPANY' | 'THIRD_PARTY'
export type VehicleType = 'SEAT_4' | 'SEAT_7' | 'SEAT_9' | 'SEAT_16'
export type TripType = 'SHARED' | 'PRIVATE'
export type BookingType = 'SHARED' | 'PRIVATE'
export type TripStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
export type BookingStatus = 'PENDING' | 'ASSIGNED' | 'CONFIRMED' | 'ONGOING' | 'CANCELLED' | 'COMPLETED'
export type PaymentType = 'CASH' | 'BANK_TRANSFER'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'
export type CancelledBy = 'CUSTOMER' | 'ADMIN' | 'SYSTEM'
export type StudentStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

// Models
export interface Route {
  id: number
  code: number
  name: string
  fromCity: string
  toCity: string
}
export interface User {
  id: string
  userCode: string
  name: string
  phone: string
  gmail?: string | null
  role: Role
  driverType?: DriverType | null
  accountStatus: AccountStatus
  avatar: string | null
  rating: number | null
  loyaltyPoints: number
  createUser?: string
  createDate?: string
  updateUser?: string | null
  updateDate?: string
}

export interface StudentVerification {
  id: number
  userId: string
  user?: Pick<User, 'id' | 'name' | 'phone' | 'avatar'>
  image: string
  status: StudentStatus
  rejectedBy: string | null
  rejectReason: string | null
  approvedBy: string | null
  submittedAt: string
  reviewedAt: string | null
}

export interface VerifyStudentCardDto {
  action: 'APPROVE' | 'REJECT'
  rejectReason?: string
}

export interface Vehicle {
  id: number
  driverId: string
  brand?: string
  model: string
  year?: number
  plate: string
  seatsTotal: number
  vehicleType?: VehicleType | null
}

export interface Trip {
  id: string
  tripCode: string
  driverId: string
  driver?: (Pick<User, 'id' | 'name' | 'rating' | 'driverType'> & {
    vehicle?: DriverVehicleSummary | null
  })
  routeId: number
  route?: Route
  vehicleType?: VehicleType | null
  departAt: string
  type: TripType
  totalSeats: number
  availableSeats: number
  tripCost: number | null
  priceLocked?: boolean
  status: TripStatus
  createUser?: string
  createDate?: string
  updateUser?: string | null
  updateDate?: string
}

export interface Booking {
  id: string
  bookingCode: string
  userId: string
  tripId: string | null
  user?: Pick<User, 'id' | 'name' | 'phone'>
  trip?: (Pick<Trip, 'id' | 'tripCode' | 'routeId' | 'departAt' | 'status' | 'totalSeats' | 'availableSeats'> & {
    route?: Route
    driver?: Pick<User, 'id' | 'name' | 'phone' | 'avatar'>
  }) | null
  routeId: number
  route?: Route
  paymentMethod?: {
    id: number
    type: PaymentType
  } | null
  passengerName: string
  passengerPhone: string
  pickupWard: string
  pickupAddress: string
  pickupLat: number | null
  pickupLng: number | null
  dropoffPhone: string
  dropoffWard: string | null
  bookingType: BookingType
  numberOfPassengers: number
  assignedByAdminPhone: string | null
  status: BookingStatus
  paymentStatus: PaymentStatus
  paymentMethodId: number | null
  amount: number | null
  dropoffAddress: string | null
  dropoffLat: number | null
  dropoffLng: number | null
  distance: number | null
  expectedTime: number | null
  estimatedDepartAt: string
  cancelReason: string | null
  cancelledBy: CancelledBy | null
  cancelledAt: string | null
  createUser?: string
  createDate?: string
  updateUser?: string | null
  updateDate?: string
}

export interface DriverVehicleSummary {
  id: number
  brand?: string
  model: string
  year?: number
  plate: string
  seatsTotal: number
  vehicleType?: VehicleType | null
}

export interface AdminDriver {
  id: string
  name: string
  phone: string
  gmail: string | null
  avatar: string | null
  rating: number | null
  driverType: DriverType | null
  accountStatus: AccountStatus
  loyaltyPoints: number
  createDate: string
  vehicle: DriverVehicleSummary | null
  totalTrips: number
  citizenId: string | null
  dateOfBirth: string | null
  contractNumber: string | null
}

export interface DriverSummary {
  total: number
  active: number
  averageRating: number
  totalTrips: number
}

export interface CustomerAdminItem {
  id: string
  userCode: string
  name: string
  phone: string
  avatar: string | null
  gmail: string | null
  accountStatus: AccountStatus
  isStudent: boolean
  studentStatus: StudentStatus
  loyaltyPoints: number
  totalBookings: number
  successfulReferrals: number
  referralCode: string | null
  createDate: string
}

export interface CustomerAdminSummary {
  total: number
  active: number
  approvedStudents: number
  pendingStudents: number
}

export interface AdminStaffItem {
  id: string
  name: string
  phone: string
  gmail: string | null
  accountStatus: AccountStatus
  createDate: string
  dateOfBirth: string
}

export interface AdminStaffSummary {
  total: number
  active: number
  inactive: number
}

export interface CustomerAdminListQuery {
  userId?: string
  page?: number
  limit?: number
  name?: string
  phone?: string
  accountStatus?: AccountStatus
  studentStatus?: StudentStatus
  totalBookingsFrom?: string
  totalBookingsTo?: string
  loyaltyPointsFrom?: string
  loyaltyPointsTo?: string
  successfulReferralsFrom?: string
  successfulReferralsTo?: string
  joinedFrom?: string
  joinedTo?: string
}

export interface AdminDriverListQuery {
  page?: number
  limit?: number
  accountStatus?: AccountStatus
  name?: string
  phone?: string
  plate?: string
  completedTripsFrom?: string
  completedTripsTo?: string
  joinedFrom?: string
  joinedTo?: string
}

export interface AdminStaffListQuery {
  page?: number
  limit?: number
  accountStatus?: AccountStatus
  name?: string
  phone?: string
  joinedFrom?: string
  joinedTo?: string
}

export interface CreateDriverResult {
  driver: {
    id: string
    name: string
    phone: string
    gmail?: string | null
    avatar: string | null
    driverType?: DriverType | null
    accountStatus: AccountStatus
    loyaltyPoints: number
    createDate: string
  }
  vehicle: DriverVehicleSummary
}

export interface DriverStatusUpdateResult {
  id: string
  name: string
  phone: string
  accountStatus: AccountStatus
}

export interface District {
  id: number
  name: string
  code: number
  division_type: string
  codename: string
  province_code: number
  province_name: string
}

// DTOs (Request bodies)
export interface RegisterDto {
  name: string
  phone: string
  password: string
  dateOfBirth: string
  gmail?: string
}

export interface LoginDto {
  phone: string
  password: string
  role?: Role
}

export interface UpdateProfileDto {
  name?: string
  avatar?: string
}

export interface CreateVehicleDto {
  brand?: string
  model: string
  year?: number
  plate: string
  seatsTotal: number
}

export interface UpdateVehicleDto {
  brand?: string
  model?: string
  year?: number
  plate?: string
}

export interface CreateTripDto {
  routeId: number
  departAt: string
  type: TripType
  totalSeats: number
  availableSeats: number
  tripCost?: number
  driverId?: string
  vehicleId?: number
}

export interface UpdateTripDto {
  status?: TripStatus
  totalSeats?: number
}

export interface CreateBookingDto {
  routeId: number
  passengerName: string
  passengerPhone: string
  pickupWard: string
  pickupAddress: string
  dropoffPhone: string
  dropoffWard: string
  bookingType: BookingType
  paymentType?: PaymentType
  numberOfPassengers: number
  estimatedDepartAt: string // ISO datetime - when customer wants to depart
  pickupLat?: number
  pickupLng?: number
  dropoffAddress?: string
  dropoffLat?: number
  dropoffLng?: number
  distance?: number
  expectedTime?: number
}

export interface AssignBookingDto {
  tripId: string
}

export interface AdminBookingListQuery {
  page?: number
  limit?: number
  date?: string
  startDate?: string
  endDate?: string
  routeId?: number
  bookingCode?: string
  customer?: string
  phone?: string
  seatFrom?: number
  seatTo?: number
  status?: BookingStatus
}

export interface TripSearchQuery {
  bookingId?: string
  page?: number
  limit?: number
  routeId?: number
  type?: TripType
  startDate?: string
  endDate?: string
  seatFrom?: number
  seatTo?: number
  tripCostFrom?: number
  tripCostTo?: number
  status?: TripStatus
  driver?: string
  createUser?: string
}

export interface AdminBookingSummary {
  totalToday: number
  confirmedToday: number
  pendingToday: number
  assignedToday?: number
  ongoingToday?: number
  cancelledToday?: number
}

export interface CreateDriverDto {
  name: string
  phone: string
  password: string
  avatar?: string
  gmail?: string
  driverType: DriverType
  vehicleBrand?: string
  vehicleModel: string
  vehicleYear?: number
  vehiclePlate: string
  vehicleSeats: number
  citizenId: string
  dateOfBirth: string
  contractNumber?: string
}

export interface UpdateDriverDto {
  name?: string
  gmail?: string | null
  citizenId?: string
  dateOfBirth?: string
  driverType?: DriverType
  contractNumber?: string | null
  vehicleBrand?: string | null
  vehicleModel?: string
  vehicleYear?: number | null
  vehiclePlate?: string
  vehicleSeats?: number
}

export interface CreateAdminStaffDto {
  name: string
  phone: string
  password: string
  gmail?: string
  dateOfBirth: string
}

export interface UpdateAdminStaffDto {
  name?: string
  gmail?: string | null
  dateOfBirth?: string
  password?: string
}

export interface UpdateAdminStaffStatusDto {
  accountStatus: AccountStatus
}

export interface UpdateBookingPaymentStatusDto {
  paymentStatus: PaymentStatus
}

export interface UpdateDriverStatusDto {
  accountStatus: AccountStatus
}

// Response wrappers
export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AuthResponse {
  token: string
  user: Pick<User, 'id' | 'name' | 'phone' | 'role'>
}

// Pricing types
export interface PriceConfig {
  id: number
  routeId: number
  pricingType: 'SHARED' | 'PRIVATE'
  vehicleType: VehicleType | null
  price: number
  isActive?: boolean
  createDate: string
  updateDate: string
}

export interface CreatePriceConfigDto {
  routeId: number
  pricingType: 'SHARED' | 'PRIVATE'
  vehicleType?: VehicleType | null
  price: number
  isActive?: boolean
}

export interface UpdatePriceConfigDto {
  price?: number
  isActive?: boolean
}

export interface AdminRevenueItem {
  id: number
  tripId: string
  driverId: string
  routeId: number
  totalRevenue: number
  driverEarnings: number
  companyEarnings: number
  driverCommissionRate: number | null
  recordedBy: string
  createUser: string
  createDate: string
  updateUser?: string | null
  updateDate: string
  trip?: Trip
  driver?: Pick<User, 'id' | 'name' | 'phone'>
  route?: Route
}

export interface AdminRevenueSummary {
  companyRevenue: number
  grossRevenue: number
  totalDriverEarnings: number
  tripCount: number
  averageCompanyRevenuePerTrip: number
}

export interface AdminRevenueListResponse extends PaginatedResponse<AdminRevenueItem> {
  summary: AdminRevenueSummary
}

export interface OperationalSettings {
  id: number
  key: string
  bookingOpenTime: string
  bookingCloseTime: string
  notificationRetentionDays: number
  bankCode: string | null
  bankName: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null
  createUser: string
  createDate: string
  updateUser?: string | null
  updateDate: string
}

export type AllowedBookingWardCity = 'danang' | 'hue'

export interface AllowedBookingWardOption {
  code: number
  name: string
  provinceCode: number
  provinceName: string
  isAllowed: boolean
}

export interface UpdateOperationalSettingsDto {
  bookingOpenTime?: string
  bookingCloseTime?: string
  notificationRetentionDays?: number
  bankCode?: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountName?: string
}

export interface AdminNotificationHistoryItem {
  id: number
  type: 'new_booking' | 'student_card_uploaded'
  message: string
  payload: Record<string, unknown> | null
  audience: string
  createUser: string
  createDate: string
}
