import { defineStore } from 'pinia'
import { apiClient } from '@/utils/apiClient'
import type { PriceConfig, CreatePriceConfigDto, UpdatePriceConfigDto } from '@/types/api'

export const usePricingStore = defineStore('pricing', {
  state: () => ({
    configs: [] as PriceConfig[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    configsByRoute(): Record<number, PriceConfig[]> {
      const map: Record<number, PriceConfig[]> = {}
      this.configs.forEach((c) => {
        if (!map[c.routeId]) map[c.routeId] = []
        map[c.routeId].push(c)
      })
      return map
    },
  },

  actions: {
    async fetchConfigs(routeIds?: number | number[]) {
      this.loading = true
      this.error = null
      try {
        const normalizedRouteIds = Array.isArray(routeIds)
          ? Array.from(new Set(routeIds.filter((routeId) => typeof routeId === 'number')))
          : typeof routeIds === 'number'
            ? [routeIds]
            : []

        if (normalizedRouteIds.length === 0) {
          this.configs = []
          return
        }

        const responses = await Promise.all(normalizedRouteIds.map((routeId) => apiClient.getPricingConfigs(routeId)))
        this.configs = responses.flatMap((res) => res.data ?? [])
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Không thể tải cấu hình giá'
      } finally {
        this.loading = false
      }
    },

    async addConfig(dto: CreatePriceConfigDto) {
      this.loading = true
      this.error = null
      try {
        const res = await apiClient.createPricingConfig(dto)
        if (res.data) this.configs.push(res.data)
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Không thể tạo cấu hình giá'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateConfig(id: number, dto: UpdatePriceConfigDto) {
      this.loading = true
      this.error = null
      try {
        const res = await apiClient.updatePricingConfig(id, dto)
        const idx = this.configs.findIndex((c) => c.id === id)
        if (idx !== -1 && res.data) this.configs.splice(idx, 1, res.data)
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Không thể cập nhật cấu hình giá'
        throw err
      } finally {
        this.loading = false
      }
    },

    async removeConfig(id: number) {
      this.loading = true
      this.error = null
      try {
        await apiClient.deletePricingConfig(id)
        this.configs = this.configs.filter((c) => c.id !== id)
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Không thể xóa cấu hình giá'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
