<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import type { RevenuePoint } from '@/types/models'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  data: RevenuePoint[]
}

const props = defineProps<Props>()

const chartData = computed(() => ({
  labels: props.data.map((p) => p.dateLabel),
  datasets: [
    {
      label: 'Doanh thu',
      data: props.data.map((p) => p.amount),
      borderColor: '#F2B233',
      backgroundColor: 'rgba(242, 178, 51, 0.12)',
      pointBackgroundColor: '#F2B233',
      pointBorderColor: '#fff',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
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
        label: (ctx: any) =>
          ' ' + new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ctx.raw),
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
      ticks: {
        color: '#6B7280',
        font: { size: 12 },
        callback: (value: any) =>
          new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(value),
      },
    },
  },
}
</script>

<template>
  <div class="h-56">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script lang="ts">
export default { name: 'RevenueLineChart' }
</script>
