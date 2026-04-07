<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoginPage = computed(() => router.currentRoute.value.path === '/login')

const { init: initNotifications } = useNotifications()
onMounted(() => {
  if (authStore.isAuthenticated) {
    authStore.fetchProfile()
  }
  initNotifications()
})
</script>

<template>
  <div v-if="isLoginPage">
    <router-view />
  </div>
  <div v-else>
    <AdminLayout>
      <router-view />
    </AdminLayout>
  </div>
</template>
