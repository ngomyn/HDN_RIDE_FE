import { defineStore } from "pinia";
import { apiClient } from "@/utils/apiClient";
import type { TripSearchQuery } from "@/types/api";
import type { TripStatusRecord, TripExecutionStatus } from "@/types/models";

type FetchTripsParams = TripSearchQuery;

export const useTripStore = defineStore("trips", {
  state: () => ({
    records: [] as TripStatusRecord[],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
    },
    filters: {
      route: "",
      type: "",
      startDate: "",
      endDate: "",
      seatFrom: "",
      seatTo: "",
      tripCostFrom: "",
      tripCostTo: "",
      driver: "",
      admin: "",
      status: "" as string,
    },
    searchText: "",
    loading: false,
    error: null as string | null,
  }),
  getters: {
    filtered(): TripStatusRecord[] {
      return this.records.filter((trip) => {
        let matches = true;

        if (this.filters.route && trip.route !== this.filters.route)
          matches = false;
        if (this.filters.driver && trip.driver !== this.filters.driver)
          matches = false;
        if (this.filters.admin && trip.createdBy !== this.filters.admin)
          matches = false;
        if (this.filters.status && trip.status !== this.filters.status)
          matches = false;

        if (this.filters.startDate) {
          const start = new Date(this.filters.startDate);
          const tripDate = new Date(trip.date);
          if (tripDate < start) matches = false;
        }

        if (this.filters.endDate) {
          const end = new Date(this.filters.endDate);
          const tripDate = new Date(trip.date);
          end.setHours(23, 59, 59, 999);
          if (tripDate > end) matches = false;
        }

        return matches;
      });
    },
  },
  actions: {
    async fetchTrips(params: FetchTripsParams = { page: 1, limit: 10 }) {
      try {
        this.loading = true;
        this.error = null;
        const query = {
          page: 1,
          limit: 10,
          ...params,
        };

        const response = await apiClient.searchTrips(query);
        if (response.data) {
          this.records = (response.data.items ?? []) as any;
          this.pagination.page = response.data.page ?? query.page;
          this.pagination.limit = response.data.limit ?? query.limit;
          this.pagination.total = response.data.total ?? this.records.length;
        } else {
          this.records = [];
          this.pagination.page = query.page;
          this.pagination.limit = query.limit;
          this.pagination.total = 0;
        }
      } catch (err: any) {
        this.error = err.message || "Tải danh sách chuyến thất bại";
      } finally {
        this.loading = false;
      }
    },
    async updateTripStatus(id: string, newStatus: TripExecutionStatus) {
      try {
        this.loading = true;
        this.error = null;
        await apiClient.updateTrip(id, { status: newStatus });
        const trip = this.records.find((t) => t.id === id);
        if (trip) {
          trip.status = newStatus;
        }
      } catch (err: any) {
        this.error = err.message || "Cập nhật trạng thái thất bại";
      } finally {
        this.loading = false;
      }
    },
    async deleteTrip(id: string) {
      try {
        this.loading = true;
        this.error = null;
        await apiClient.deleteTrip(id);
        this.records = this.records.filter((t) => t.id !== id);
        this.pagination.total = Math.max(0, this.pagination.total - 1);
      } catch (err: any) {
        this.error = err.message || "Xóa chuyến thất bại";
      } finally {
        this.loading = false;
      }
    },

    addLocalTrip(record: TripStatusRecord) {
      this.records = [record, ...this.records];
      this.pagination.total += 1;
    },
  },
});
