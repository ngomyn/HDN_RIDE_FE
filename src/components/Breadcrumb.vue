<script setup lang="ts">
interface Props {
  items: string[]
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
          :class="
            index === items.length - 1
              ? 'font-medium text-[#4A2A12]'
              : 'text-gray-500'
          "
        >
          {{ item }}
        </span>
        <span v-if="index < items.length - 1" class="text-gray-400">/</span>
      </li>
    </ol>
  </nav>
</template>
