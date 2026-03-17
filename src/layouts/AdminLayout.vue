<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
import HeaderBar from '@/components/layout/HeaderBar.vue'
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col ml-[260px]">
      <!-- Header -->
      <HeaderBar />

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto pt-20 pb-6 px-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'AdminLayout',
}
</script>
