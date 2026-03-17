export type TripExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'CANCELED'

export type BookingStatus = 'CONFIRMED' | 'WAITING' | 'CANCELED'

export interface NotificationItem {
  id: number
  title: string
  message: string
  createdAt: string
  read: boolean
}

export interface AdminProfile {
  fullName: string
  role: string
  email: string
  phone: string
}

export interface DashboardMetric {
  id: string
  title: string
  value: number
  tone: 'gold' | 'green' | 'amber' | 'blue'
  format?: 'currency'
}

export interface RevenuePoint {
  dateLabel: string
  amount: number
}

export interface WeeklyBookingPoint {
  dayLabel: string
  total: number
}

export interface RouteRatio {
  route: string
  total: number
  color: string
}

export interface UpcomingTrip {
  id: number
  route: string
  time: string
  driver: string
  availableSeats: number
}

export interface TripStatusRecord {
  id: number
  route: string
  date: string
  time: string
  driver: string
  pickupWard: string
  price: number
  status: TripExecutionStatus
  createdBy: string
  availableSeats: number
}

export interface BookingStatusRecord {
  id: number
  route: string
  date: string
  time: string
  customerName: string
  phone: string
  seatCount: number
  pickupWard: string
  status: BookingStatus
  email: string
  note: string
}
