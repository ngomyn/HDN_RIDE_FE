import type { TripType } from "@/types/api";

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDateDisplay = (isoDate: string): string => {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("vi-VN").format(date);
};

export const getRouteBadgeClass = (routerCode: number | undefined): string => {
  if (routerCode === 1) return "bg-[#F2B233]/10 text-[#F2B233]";
  if (routerCode === 2) return "bg-[#4A2A12]/10 text-[#4A2A12]";
  return "bg-gray-100 text-gray-500";
};

export const getTripTypeText = (type: TripType): string => {
  return type === "PRIVATE" ? "Bao xe" : "Ghép xe";
};

export const getTripTypeBadgeClass = (type: TripType): string => {
  return type === "PRIVATE"
    ? "bg-violet-100 text-violet-700"
    : "bg-sky-100 text-sky-700";
};
