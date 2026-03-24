import type { BookingStatus } from '@/types/api'
import type { TripExecutionStatus } from '@/types/models'

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatDateDisplay = (isoDate: string): string => {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat('vi-VN').format(date)
}

export const tripStatusLabel: Record<TripExecutionStatus, string> = {
  PENDING: 'Cho khoi hanh',
  RUNNING: 'Dang chay',
  COMPLETED: 'Hoan thanh',
  CANCELED: 'Da huy',
}

export const bookingStatusLabel: Record<BookingStatus, string> = {
  PENDING: 'Cho gan chuyen',
  ASSIGNED: 'Da gan chuyen',
  CONFIRMED: 'Da xac nhan',
  ONGOING: 'Dang thuc hien',
  CANCELLED: 'Da huy',
  COMPLETED: 'Hoan thanh',
}
