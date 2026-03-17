// Enums
export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN'
export type TripType = 'SHARED' | 'PRIVATE'
export type TripStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type PaymentType = 'CASH' | 'MOMO' | 'ZALOPAY' | 'CARD'
export type SeatLockStatus = 'LOCKED' | 'CONSUMED' | 'EXPIRED' | 'RELEASED'

// Models
export interface User {
  id: number
  name: string
  phone: string
  role: Role
  avatar: string | null
  rating: number | null
  loyaltyPoints: number
  createdAt: string
}

export interface Vehicle {
  id: number
  driverId: number
  model: string
  plate: string
  seatsTotal: number
  createdAt: string
}

export interface Trip {
  id: number
  driverId: number | null
  driver?: Pick<User, 'id' | 'name' | 'rating'>
  fromPlace: string
  fromAddress: string
  toPlace: string
  toAddress: string
  departAt: string
  type: TripType
  totalSeats: number
  availableSeats: number
  tripCost: number | null
  status: TripStatus
  createdAt: string
}

export interface Booking {
  id: number
  userId: number
  tripId: number
  trip?: Pick<Trip, 'id' | 'fromPlace' | 'toPlace' | 'departAt'>
  seats: number[]
  totalPassengers: number
  status: BookingStatus
  paymentMethodId: number | null
  amount: number | null
  pickupWard: string | null
  pickupAddress: string | null
  pickupLat: number | null
  pickupLng: number | null
  dropoffAddress: string | null
  dropoffLat: number | null
  dropoffLng: number | null
  dropoffTime: string | null
  createdAt: string
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
  fromPlace: string
  fromAddress: string
  toPlace: string
  toAddress: string
  departAt: string
  type: TripType
  totalSeats: number
  vehicleId?: number
}

export interface UpdateTripDto {
  status?: TripStatus
  totalSeats?: number
}

export interface CreateBookingDto {
  tripId: number
  seats: number[]
  totalPassengers: number
  paymentMethod?: PaymentType
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
}

export interface AuthResponse {
  token: string
  user: Pick<User, 'id' | 'name' | 'phone' | 'role'>
}
