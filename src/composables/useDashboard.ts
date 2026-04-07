import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'

/**
 * Composable for dashboard data fetching
 * Usage: const { metrics, loading } = useDashboard()
 */
export function useDashboard() {
  const dashboardStore = useDashboardStore()

  // Auto-fetch on component mount
  onMounted(async () => {
    if (!dashboardStore.isLoaded) {
      await dashboardStore.fetchDashboardData()
    }
  })

  // Use storeToRefs to maintain reactivity when destructuring
  const { metrics, revenue7Days, weeklyBookings, routeRatio, upcomingTrips, loading, error, isLoaded } =
    storeToRefs(dashboardStore)

  return {
    // State (reactive refs)
    metrics,
    revenue7Days,
    weeklyBookings,
    routeRatio,
    upcomingTrips,
    loading,
    error,
    isLoaded,

    // Actions
    refresh: dashboardStore.fetchDashboardData,
    refreshSection: dashboardStore.refreshSection,
  }
}
