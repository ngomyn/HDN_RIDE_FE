import { apiClient } from '@/utils/apiClient'

/**
 * District API service
 * Provides methods to fetch district and ward data from backend
 */
export const districtAPI = {
  /**
   * Get all districts (Đà Nẵng + Huế)
   * @returns {success, data: [list of full district objects]}
   */
  getAllDistricts: async () => {
    return apiClient.getAllDistricts()
  },

  /**
   * Get Đà Nẵng districts
   * @returns {success, data: [list of district names]}
   */
  getDaNangDistricts: async () => {
    return apiClient.getDistrictsByCity('danang')
  },

  /**
   * Get Huế districts
   * @returns {success, data: [list of district names]}
   */
  getHueDistricts: async () => {
    return apiClient.getDistrictsByCity('hue')
  },

  /**
   * Get wards by district code
   * @returns {success, data: [ward names]}
   */
  getDistrictWards: async (districtCode: number) => {
    return apiClient.getDistrictWards(districtCode)
  },
}

export default districtAPI
