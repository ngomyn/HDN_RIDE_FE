import { apiClient } from '@/utils/apiClient'

/**
 * Legacy /districts API wrapper.
 * Backend paths keep the old prefix for compatibility, but the catalog is ward-based.
 */
export const locationCatalogAPI = {
  /**
   * Get all ward catalog entries (Đà Nẵng + Huế)
   */
  getAllWards: async () => {
    return apiClient.getAllDistricts()
  },

  /**
   * Get Đà Nẵng ward names
   */
  getDaNangWards: async () => {
    return apiClient.getDistrictsByCity('danang')
  },

  /**
   * Get Huế ward names
   */
  getHueWards: async () => {
    return apiClient.getDistrictsByCity('hue')
  },

  /**
   * Get ward names by legacy district code.
   */
  getWardsByLegacyDistrictCode: async (districtCode: number) => {
    return apiClient.getDistrictWards(districtCode)
  },
}

export const districtAPI = {
  getAllDistricts: locationCatalogAPI.getAllWards,
  getDaNangDistricts: locationCatalogAPI.getDaNangWards,
  getHueDistricts: locationCatalogAPI.getHueWards,
  getDistrictWards: locationCatalogAPI.getWardsByLegacyDistrictCode,
}

export default locationCatalogAPI
