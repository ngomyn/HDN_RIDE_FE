import { defineStore } from 'pinia'
import { districtAPI } from '@/services/districtAPI'

interface DistrictCacheEntry {
  daNang: string[]
  hue: string[]
  timestamp: number
}

const CACHE_KEY = 'hdn-districts-cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export const useDistrictStore = defineStore('districts', {
  state: () => ({
    daNangDistricts: [] as string[],
    hueDistricts: [] as string[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    allDistricts(): string[] {
      return [...this.daNangDistricts, ...this.hueDistricts]
    },
  },

  actions: {
    async fetchDistricts() {
      // Check localStorage cache first
      const cached = this.getCache()
      if (cached) {
        this.daNangDistricts = cached.daNang
        this.hueDistricts = cached.hue
        return
      }

      try {
        this.loading = true
        this.error = null

        const [daNangRes, hueRes] = await Promise.all([
          districtAPI.getDaNangDistricts(),
          districtAPI.getHueDistricts(),
        ])

        if (daNangRes.data) {
          this.daNangDistricts = daNangRes.data
        }

        if (hueRes.data) {
          this.hueDistricts = hueRes.data
        }

        // Save to localStorage
        this.saveCache({
          daNang: this.daNangDistricts,
          hue: this.hueDistricts,
          timestamp: Date.now(),
        })
      } catch (err: any) {
        this.error = err.message || 'Tải danh sách quận/huyện thất bại'
      } finally {
        this.loading = false
      }
    },

    getCache(): DistrictCacheEntry | null {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (!cached) return null

        const entry = JSON.parse(cached) as DistrictCacheEntry
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

    saveCache(entry: DistrictCacheEntry): void {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
      } catch (err) {
        console.error('Failed to save district cache:', err)
      }
    },

    clearCache(): void {
      localStorage.removeItem(CACHE_KEY)
      this.daNangDistricts = []
      this.hueDistricts = []
    },
  },
})
