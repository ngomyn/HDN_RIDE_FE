<template>
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.66667 5V10"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12.5 5V10"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M1.66667 10H18"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M15 15H17.5C17.5 15 17.9167 13.5833 18.1667 12.6667C18.25 12.3333 18.3333 12 18.3333 11.6667C18.3333 11.3333 18.25 11 18.1667 10.6667L17 6.5C16.75 5.66667 15.9167 5 15 5H3.33334C2.89131 5 2.46739 5.17559 2.15483 5.48816C1.84227 5.80072 1.66667 6.22464 1.66667 6.66667V15H4.16667"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M5.83334 16.6667C6.75381 16.6667 7.50001 15.9205 7.50001 15C7.50001 14.0795 6.75381 13.3333 5.83334 13.3333C4.91286 13.3333 4.16667 14.0795 4.16667 15C4.16667 15.9205 4.91286 16.6667 5.83334 16.6667Z"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M7.5 15H11.6667"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M13.3333 16.6667C14.2538 16.6667 15 15.9205 15 15C15 14.0795 14.2538 13.3333 13.3333 13.3333C12.4129 13.3333 11.6667 14.0795 11.6667 15C11.6667 15.9205 12.4129 16.6667 13.3333 16.6667Z"
      :stroke="active ? '#F2B233' : 'white'"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
<script setup lang="ts">
defineProps<{
  active?: boolean;
}>();
</script>
