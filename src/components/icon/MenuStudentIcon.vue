<template>
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Graduation cap -->
    <path
      d="M10 2L1.66667 6.66667L10 11.3333L18.3333 6.66667L10 2Z"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M5 9.16667V13.3333C5 13.3333 6.66667 15.8333 10 15.8333C13.3333 15.8333 15 13.3333 15 13.3333V9.16667"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M18.3333 6.66667V10.8333"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean
}>()
</script>
