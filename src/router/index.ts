import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/api'

type AppRouteRole = Role

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    allowedRoles?: AppRouteRole[]
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'MANAGER'] as Role[] },
  },
  {
    path: '/trips',
    name: 'trips',
    component: () => import('@/pages/TripManagementPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'MANAGER'] as Role[] },
  },
  {
    path: '/bookings',
    name: 'bookings',
    component: () => import('@/pages/BookingManagementPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'MANAGER'] as Role[] },
  },
  {
    path: '/drivers',
    name: 'drivers',
    component: () => import('@/pages/DriverManagementPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'MANAGER'] as Role[] },
  },
  {
    path: '/customers',
    name: 'customers',
    component: () => import('@/pages/CustomerManagementPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'MANAGER'] as Role[] },
  },
  {
    path: '/student-verifications',
    name: 'student-verifications',
    component: () => import('@/pages/StudentVerificationPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'MANAGER'] as Role[] },
  },
  {
    path: '/revenue',
    name: 'revenue',
    component: () => import('@/pages/RevenueManagementPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['MANAGER'] as Role[] },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['MANAGER'] as Role[] },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next(authStore.homeRoute)
  } else if (to.meta.requiresAuth && !authStore.userRole) {
    authStore.logout()
    next('/login')
  } else if (to.meta.requiresAuth && !authStore.canAccess(to.meta.allowedRoles)) {
    next(authStore.homeRoute)
  } else {
    next()
  }
})

export default router
