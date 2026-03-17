<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  error?: string
  disabled?: boolean
  min?: string
  max?: string
  class?: string
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    <label v-if="label" class="text-sm font-medium text-brand-brown">{{ label }}</label>
    <input
      :value="modelValue"
      type="date"
      :disabled="disabled"
      :min="min"
      :max="max"
      :class="[
        'px-4 py-2 border rounded-lg text-base transition-all duration-200',
        'focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold focus:ring-opacity-30',
        error ? 'border-status-danger' : 'border-gray-300',
        disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white',
        $props.class,
      ]"
      @change="(e) => $emit('update:modelValue', (e.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-xs text-status-danger">{{ error }}</p>
  </div>
</template>
