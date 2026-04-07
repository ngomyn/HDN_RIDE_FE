<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
  options: Array<{ label: string; value: string }> | string[]
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Chon tuy chon',
})

const normalizedOptions = computed(() => {
  return props.options.map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  )
})
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    <label v-if="label" class="text-sm font-medium text-brand-brown">{{ label }}</label>
    <select
      :value="modelValue"
      :disabled="disabled"
      :class="[
        'px-4 py-2 border rounded-lg text-base transition-all duration-200 appearance-none bg-white',
        'focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold focus:ring-opacity-30',
        error ? 'border-status-danger' : 'border-gray-300',
        disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : '',
        $props.class,
      ]"
      @change="(e) => $emit('update:modelValue', (e.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="(opt, i) of normalizedOptions" :key="i" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="text-xs text-status-danger">{{ error }}</p>
  </div>
</template>

<script lang="ts">
export default {
  name: 'SelectInput',
}
</script>
