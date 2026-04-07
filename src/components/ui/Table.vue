<script setup lang="ts">
interface Column {
  key: string
  label: string
  width?: string
  sortable?: boolean
  render?: (value: any, row: any) => string
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  class?: string
}

defineProps<Props>()
defineEmits<{
  'row-click': [row: any]
}>()
</script>

<template>
  <div :class="['overflow-x-auto border border-gray-200 rounded-lg', $props.class]">
    <table class="w-full bg-white">
      <thead>
        <tr class="bg-brand-brown text-white border-b border-gray-200">
          <th v-for="col of columns" :key="col.key" :style="{ width: col.width }" class="px-4 py-3 text-left text-sm font-semibold">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) of data"
          :key="idx"
          class="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="$emit('row-click', row)"
        >
          <td v-for="col of columns" :key="col.key" class="px-4 py-3 text-sm text-gray-800">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key] }}
            </slot>
          </td>
        </tr>
        <tr v-if="data.length === 0" class="hover:bg-white">
          <td :colspan="columns.length" class="px-4 py-8 text-center text-gray-500">
            {{ loading ? 'Dang tai...' : 'Khong co du lieu' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
