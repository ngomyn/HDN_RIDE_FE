import { apiClient } from '@/utils/apiClient'

/**
 * Dashboard API service
 * Provides methods to fetch dashboard data from backend
 * Uses main apiClient for consistent auth token handling
 */
export const dashboardAPI = {
  /**
   * Get KPI metrics for today
   * @returns {success, data: {metrics: [...]}}
   */
  getMetrics: async () => {
    return apiClient.getDashboardMetrics()
  },

  /**
   * Get revenue data for last 7 days
   * @returns {success, data: [{dateLabel, amount}, ...]}
   */
  getRevenue7Days: async () => {
    return apiClient.getDashboardRevenue7Days()
  },

  /**
   * Get weekly booking statistics
   * @returns {success, data: [{dayLabel, total}, ...]}
   */
  getWeeklyBookings: async () => {
    return apiClient.getDashboardWeeklyBookings()
  },

  /**
   * Get route distribution (pie chart data)
   * @returns {success, data: [{route, total, color}, ...]}
   */
  getRouteRatio: async () => {
    return apiClient.getDashboardRouteRatio()
  },

  /**
   * Get upcoming trips (next 5 trips)
   * @returns {success, data: [{id, route, time, driver, availableSeats}, ...]}
   */
  getUpcomingTrips: async () => {
    return apiClient.getDashboardUpcomingTrips()
  },
}

export default dashboardAPI
