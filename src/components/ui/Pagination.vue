<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  total: number
  pageSize?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
})

const emit = defineEmits<{
  'update:current': [page: number]
}>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const pages = computed(() => {
  const arr: (number | string)[] = []
  const max = Math.min(props.current + 2, totalPages.value)
  const min = Math.max(props.current - 2, 1)

  if (min > 1) {
    arr.push(1)
    if (min > 2) arr.push('...')
  }

  for (let i = min; i <= max; i++) {
    arr.push(i)
  }

  if (max < totalPages.value) {
    if (max < totalPages.value - 1) arr.push('...')
    arr.push(totalPages.value)
  }

  return arr
})
</script>

<template>
  <div :class="['flex items-center gap-1 justify-center', $props.class]">
    <button
      :disabled="current === 1"
      class="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      @click="$emit('update:current', current - 1)"
    >
      &larr;
    </button>

    <button
      v-for="(page, idx) of pages"
      :key="idx"
      :disabled="page === '...'"
      :class="[
        'px-3 py-2 rounded text-sm font-medium transition-colors',
        page === current ? 'bg-brand-gold text-brand-brown font-semibold' : 'border border-gray-300 hover:bg-gray-50',
        page === '...' ? 'cursor-not-allowed' : 'cursor-pointer',
      ]"
      @click="typeof page === 'number' && $emit('update:current', page)"
    >
      {{ page }}
    </button>

    <button
      :disabled="current === totalPages"
      class="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      @click="$emit('update:current', current + 1)"
    >
      &rarr;
    </button>
  </div>
</template>
