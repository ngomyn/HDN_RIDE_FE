<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import HeaderBar from '@/components/layout/HeaderBar.vue'

const sidebarOpen = ref(true)
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#F5F5F5]">
    <Sidebar :is-open="sidebarOpen" @toggle="toggleSidebar" />

    <div
      :class="[
        'flex-1 flex flex-col overflow-hidden transition-all duration-300',
        sidebarOpen ? 'ml-[260px]' : 'ml-[80px]',
      ]"
    >
      <HeaderBar :sidebar-open="sidebarOpen" />

      <main class="flex-1 overflow-y-auto pt-20">
        <div class="min-h-full px-6 pb-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'AdminLayout',
}
</script>
