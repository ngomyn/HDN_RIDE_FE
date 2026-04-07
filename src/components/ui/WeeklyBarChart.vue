<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { WeeklyBookingPoint } from '@/types/models'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  data: WeeklyBookingPoint[]
}

const props = defineProps<Props>()

const chartData = computed(() => ({
  labels: props.data.map((p) => p.dayLabel),
  datasets: [
    {
      label: 'Đặt chỗ',
      data: props.data.map((p) => p.total),
      backgroundColor: 'rgba(242, 178, 51, 0.85)',
      hoverBackgroundColor: '#F2B233',
      borderRadius: 6,
      borderSkipped: false,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.raw} đặt chỗ`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6B7280', font: { size: 12 } },
    },
    y: {
      grid: { color: '#F3F4F6' },
      ticks: { color: '#6B7280', font: { size: 12 }, precision: 0 },
      beginAtZero: true,
    },
  },
}
</script>

<template>
  <div class="h-56">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script lang="ts">
export default { name: 'WeeklyBarChart' }
</script>
