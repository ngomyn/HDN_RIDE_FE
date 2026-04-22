import { defineStore } from 'pinia'
import { locationCatalogAPI } from '@/services/districtAPI'

interface WardCatalogCacheEntry {
  daNang: string[]
  hue: string[]
  timestamp: number
}

const CACHE_KEY = 'hdn-districts-cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export const useLocationCatalogStore = defineStore('districts', {
  state: () => ({
    daNangWardNames: [] as string[],
    hueWardNames: [] as string[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    allWardNames(): string[] {
      return [...this.daNangWardNames, ...this.hueWardNames]
    },
  },

  actions: {
    async fetchWardNames() {
      // Check localStorage cache first
      const cached = this.getCache()
      if (cached) {
        this.daNangWardNames = cached.daNang
        this.hueWardNames = cached.hue
        return
      }

      try {
        this.loading = true
        this.error = null

        const [daNangRes, hueRes] = await Promise.all([
          locationCatalogAPI.getDaNangWards(),
          locationCatalogAPI.getHueWards(),
        ])

        if (daNangRes.data) {
          this.daNangWardNames = daNangRes.data
        }

        if (hueRes.data) {
          this.hueWardNames = hueRes.data
        }

        // Save to localStorage
        this.saveCache({
          daNang: this.daNangWardNames,
          hue: this.hueWardNames,
          timestamp: Date.now(),
        })
      } catch (err: any) {
        this.error = err.message || 'Tải danh sách phường/xã thất bại'
      } finally {
        this.loading = false
      }
    },

    getCache(): WardCatalogCacheEntry | null {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (!cached) return null

        const entry = JSON.parse(cached) as WardCatalogCacheEntry
        const isExpired = Date.now() - entry.timestamp > CACHE_DURATION
        if (isExpired) {
          localStorage.removeItem(CACHE_KEY)
          return null
        }

        return entry
      } catch {
        return null
      }
    },

    saveCache(entry: WardCatalogCacheEntry): void {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
      } catch (err) {
        console.error('Failed to save ward catalog cache:', err)
      }
    },

    clearCache(): void {
      localStorage.removeItem(CACHE_KEY)
      this.daNangWardNames = []
      this.hueWardNames = []
    },

    async fetchDistricts() {
      await this.fetchWardNames()
    },
  },
})

export const useDistrictStore = useLocationCatalogStore
