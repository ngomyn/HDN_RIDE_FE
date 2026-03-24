<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {})

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  'Cho khoi hanh': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Cho khoi hanh' },
  'Dang chay': { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Dang chay' },
  'Hoan thanh': { bg: 'bg-green-50', text: 'text-green-700', label: 'Hoan thanh' },
  'Đã Hủy': { bg: 'bg-red-50', text: 'text-red-700', label: 'Đã Hủy' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Cho gan chuyen' },
  ASSIGNED: { bg: 'bg-sky-50', text: 'text-sky-700', label: 'Da gan chuyen' },
  CONFIRMED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Da xac nhan' },
  ONGOING: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Dang thuc hien' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Hoan thanh' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Da huy' },

  // Backward-compatibility fallbacks for legacy literals.
  CANCELED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Đã Hủy' },
  WAITING: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Cho xac nhan' },
}

const config = computed(() => statusConfig[props.status] || { bg: 'bg-gray-50', text: 'text-gray-700', label: props.status })
</script>

<template>
  <span :class="['inline-block px-3 py-1.5 rounded-full text-xs font-medium', config.bg, config.text, $props.class]">
    {{ config.label }}
  </span>
</template>
