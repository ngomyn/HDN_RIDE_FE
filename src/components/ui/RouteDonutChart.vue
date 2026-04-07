<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { RouteRatio } from '@/types/models'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  data: RouteRatio[]
}

const props = defineProps<Props>()

const total = computed(() => props.data.reduce((sum, r) => sum + r.total, 0))

const chartData = computed(() => ({
  labels: props.data.map((r) => r.route),
  datasets: [
    {
      data: props.data.map((r) => r.total),
      backgroundColor: props.data.map((r) => r.color),
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: '#374151',
        font: { size: 12 },
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 10,
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} chuyến`,
      },
    },
  },
}
</script>

<template>
  <div class="relative h-56">
    <Doughnut :data="chartData" :options="chartOptions" />
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style="padding-bottom: 28px">
      <span class="text-2xl font-bold text-gray-800">{{ total }}</span>
      <span class="text-xs text-gray-500">chuyến</span>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'RouteDonutChart' }
</script>
