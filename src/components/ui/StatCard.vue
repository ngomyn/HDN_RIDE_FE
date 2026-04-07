<script setup lang="ts">
import Card from './Card.vue'

interface Props {
  title: string
  value: string | number
  icon?: string
  tone?: 'gold' | 'green' | 'amber' | 'blue'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'gold',
})

const toneClasses = {
  gold: 'text-brand-gold',
  green: 'text-status-success',
  amber: 'text-status-pending',
  blue: 'text-blue-500',
}

const toneBgClasses = {
  gold: 'bg-yellow-50',
  green: 'bg-green-50',
  amber: 'bg-orange-50',
  blue: 'bg-blue-50',
}
</script>

<template>
  <Card :class="props.class">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-gray-600 mb-1">{{ title }}</p>
        <p class="text-3xl font-bold text-gray-900">{{ value }}</p>
      </div>
      <div v-if="icon" :class="[toneBgClasses[tone], toneClasses[tone], 'w-12 h-12 rounded-lg flex items-center justify-center text-xl']">
        {{ icon }}
      </div>
    </div>
  </Card>
</template>

<script lang="ts">
export default {
  name: 'StatCard',
}
</script>
