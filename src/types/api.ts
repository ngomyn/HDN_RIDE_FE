// Enums
export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN'
export type AccountStatus = 'ACTIVE' | 'INACTIVE'
export type TripType = 'SHARED' | 'PRIVATE'
export type BookingType = 'SHARED' | 'PRIVATE'
export type TripStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
export type BookingStatus = 'PENDING' | 'ASSIGNED' | 'CONFIRMED' | 'ONGOING' | 'CANCELLED' | 'COMPLETED'
export type PaymentType = 'CASH' | 'MOMO' | 'ZALOPAY' | 'CARD'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'
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
  id: number
  name: string
  phone: string
  role: Role
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
  name: string
  phone: string
  avatar: string | null
  studentCardImage: string | null
  studentStatus: StudentStatus
  isStudent: boolean
  createdAt: string
  updateDate?: string
}

export interface VerifyStudentCardDto {
  action: 'APPROVE' | 'REJECT'
}

export interface Vehicle {
  id: number
  driverId: number
  model: string
  plate: string
  seatsTotal: number
}

export interface Trip {
  id: number
  driverId: number
  driver?: Pick<User, 'id' | 'name' | 'rating'>
  routeId: number
  route?: Route
  departAt: string
  type: TripType
  totalSeats: number
  availableSeats: number
  tripCost: number | null
  status: TripStatus
  createUser?: string
  createDate?: string
  updateUser?: string | null
  updateDate?: string
}

export interface Booking {
  id: number
  userId: number
  tripId: number | null
  user?: Pick<User, 'id' | 'name' | 'phone'>
  trip?: Pick<Trip, 'id' | 'routeId' | 'departAt'> | null
  routeId: number
  route?: Route
  passengerName: string
  passengerPhone: string
  pickupDistrict: string
  pickupWard: string
  pickupAddress: string
  dropoffPhone: string
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
  estimatedDepartAt: string
  createUser?: string
  createDate?: string
  updateUser?: string | null
  updateDate?: string
}

export interface DriverVehicleSummary {
  id: number
  model: string
  plate: string
  seatsTotal: number
}

export interface AdminDriver {
  id: number
  name: string
  phone: string
  avatar: string | null
  rating: number | null
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
  id: number
  name: string
  phone: string
  avatar: string | null
  accountStatus: AccountStatus
  studentStatus: StudentStatus
  isStudent: boolean
  studentCardImage: string | null
  totalBookings: number
  createDate: string
}

export interface CustomerAdminSummary {
  total: number
  active: number
  approvedStudents: number
  pendingStudents: number
}

export interface CustomerAdminListQuery {
  page?: number
  limit?: number
  name?: string
  phone?: string
  accountStatus?: AccountStatus
  studentStatus?: StudentStatus
}

export interface CreateDriverResult {
  driver: {
    id: number
    name: string
    phone: string
    avatar: string | null
    accountStatus: AccountStatus
    loyaltyPoints: number
    createDate: string
  }
  vehicle: DriverVehicleSummary
}

export interface DriverStatusUpdateResult {
  id: number
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
}

export interface UpdateProfileDto {
  name?: string
  avatar?: string
}

export interface CreateVehicleDto {
  model: string
  plate: string
  seatsTotal: number
}

export interface UpdateVehicleDto {
  model?: string
  plate?: string
}

export interface CreateTripDto {
  routeId: number
  departAt: string
  type: TripType
  totalSeats: number
  tripCost?: number
  driverId?: number
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
  pickupDistrict: string
  pickupWard: string
  pickupAddress: string
  dropoffPhone: string
  bookingType: BookingType
  numberOfPassengers: number
  estimatedDepartAt: string // ISO datetime - when customer wants to depart
}

export interface AssignBookingDto {
  tripId: number
}

export interface AdminBookingListQuery {
  page?: number
  limit?: number
  date?: string
  routeId?: number
  customer?: string
  status?: BookingStatus
}

export interface AdminBookingSummary {
  totalToday: number
  confirmedToday: number
  pendingToday: number
}

export interface CreateDriverDto {
  name: string
  phone: string
  password: string
  avatar?: string
  vehicleModel: string
  vehiclePlate: string
  vehicleSeats: number
  citizenId: string
  dateOfBirth: string
  contractNumber?: string
}

export interface UpdateDriverDto {
  name?: string
  avatar?: string
  rating?: number
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
