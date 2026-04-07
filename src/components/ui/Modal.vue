<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeButton: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-4xl',
}

const handleBackdropClick = () => {
  if (props.closeButton) {
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black bg-opacity-50" @click="handleBackdropClick" />
        <div :class="['relative bg-white rounded-xl shadow-2xl', sizeClasses[size], 'max-h-[90vh] overflow-y-auto']">
          <div v-if="title || closeButton" class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-xl font-bold text-brand-brown">{{ title }}</h2>
            <button
              v-if="closeButton"
              class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              @click="$emit('update:modelValue', false)"
            >
              &times;
            </button>
          </div>
          <div class="p-6">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

<script lang="ts">
export default {
  name: 'Modal',
}
</script>
