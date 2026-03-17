import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dashboardAPI from '@/services/dashboardAPI'
import type {
  DashboardMetric,
  RevenuePoint,
  WeeklyBookingPoint,
  RouteRatio,
  UpcomingTrip,
} from '@/types/models'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const metrics = ref<DashboardMetric[]>([])
  const revenue7Days = ref<RevenuePoint[]>([])
  const weeklyBookings = ref<WeeklyBookingPoint[]>([])
  const routeRatio = ref<RouteRatio[]>([])
  const upcomingTrips = ref<UpcomingTrip[]>([])

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isLoaded = computed(
    () =>
      metrics.value.length > 0 &&
      revenue7Days.value.length > 0 &&
      weeklyBookings.value.length > 0 &&
      routeRatio.value.length > 0 &&
      upcomingTrips.value.length > 0
  )

  // Actions
  const fetchMetrics = async () => {
    try {
      const result = await dashboardAPI.getMetrics()
      if (result.success && result.data) {
        metrics.value = result.data.metrics
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch metrics'
      console.error('Error fetching metrics:', err)
    }
  }

  const fetchRevenue7Days = async () => {
    try {
      const result = await dashboardAPI.getRevenue7Days()
      if (result.success && result.data) {
        revenue7Days.value = result.data
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch revenue data'
      console.error('Error fetching revenue:', err)
    }
  }

  const fetchWeeklyBookings = async () => {
    try {
      const result = await dashboardAPI.getWeeklyBookings()
      if (result.success && result.data) {
        weeklyBookings.value = result.data
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch weekly bookings'
      console.error('Error fetching weekly bookings:', err)
    }
  }

  const fetchRouteRatio = async () => {
    try {
      const result = await dashboardAPI.getRouteRatio()
      if (result.success && result.data) {
        routeRatio.value = result.data
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch route ratio'
      console.error('Error fetching route ratio:', err)
    }
  }

  const fetchUpcomingTrips = async () => {
    try {
      const result = await dashboardAPI.getUpcomingTrips()
      if (result.success && result.data) {
        upcomingTrips.value = result.data
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch upcoming trips'
      console.error('Error fetching upcoming trips:', err)
    }
  }

  /**
   * Fetch all dashboard data in parallel
   */
  const fetchDashboardData = async () => {
    loading.value = true
    error.value = null

    try {
      await Promise.all([
        fetchMetrics(),
        fetchRevenue7Days(),
        fetchWeeklyBookings(),
        fetchRouteRatio(),
        fetchUpcomingTrips(),
      ])
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch dashboard data'
      console.error('Error fetching dashboard data:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh a specific data section
   */
  const refreshSection = async (section: 'metrics' | 'revenue' | 'bookings' | 'routes' | 'trips') => {
    try {
      switch (section) {
        case 'metrics':
          await fetchMetrics()
          break
        case 'revenue':
          await fetchRevenue7Days()
          break
        case 'bookings':
          await fetchWeeklyBookings()
          break
        case 'routes':
          await fetchRouteRatio()
          break
        case 'trips':
          await fetchUpcomingTrips()
          break
      }
    } catch (err: any) {
      error.value = err.message || `Failed to refresh ${section}`
      console.error(`Error refreshing ${section}:`, err)
    }
  }

  return {
    // State
    metrics,
    revenue7Days,
    weeklyBookings,
    routeRatio,
    upcomingTrips,
    loading,
    error,

    // Computed
    isLoaded,

    // Actions
    fetchDashboardData,
    fetchMetrics,
    fetchRevenue7Days,
    fetchWeeklyBookings,
    fetchRouteRatio,
    fetchUpcomingTrips,
    refreshSection,
  }
})
