<script setup lang="ts">
type BreadcrumbItem = string | { label: string; to?: string }

interface Props {
  items: BreadcrumbItem[]
}

defineProps<Props>()
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-1 text-sm">
      <li
        v-for="(item, index) in items"
        :key="`${item}-${index}`"
        class="flex items-center gap-1"
      >
        <span
          v-if="typeof item === 'string'"
          :class="
            index === items.length - 1
              ? 'font-medium text-[#4A2A12]'
              : 'text-gray-500'
          "
        >
          {{ item }}
        </span>
        <router-link
          v-else-if="item.to && index < items.length - 1"
          :to="item.to"
          class="text-gray-500 hover:text-[#4A2A12] transition-colors"
        >
          {{ item.label }}
        </router-link>
        <span
          v-else
          :class="
            index === items.length - 1
              ? 'font-medium text-[#4A2A12]'
              : 'text-gray-500'
          "
        >
          {{ item.label }}
        </span>
        <span v-if="index < items.length - 1" class="text-gray-400">/</span>
      </li>
    </ol>
  </nav>
</template>
