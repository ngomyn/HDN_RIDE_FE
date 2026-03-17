<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const router = useRouter()
const isLoginPage = computed(() => router.currentRoute.value.path === '/login')
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
