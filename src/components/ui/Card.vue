<script setup lang="ts">
interface Props {
  class?: string
}

withDefaults(defineProps<Props>(), {})
</script>

<template>
  <div :class="['bg-white rounded-lg border border-gray-200 shadow-soft p-6 hover:shadow-card transition-shadow', $props.class]">
    <slot />
  </div>
</template>

<script lang="ts">
export default {
  name: 'Card',
}
</script>
