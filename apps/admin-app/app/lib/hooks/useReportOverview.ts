"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchReportOverview,
  type ReportOverviewFilters,
} from "../api/dashboard.api";

export type { ReportOverviewFilters };

export function useReportOverview(filters: ReportOverviewFilters) {
  return useQuery({
    queryKey: ["reports", "overview", filters],
    queryFn: () => fetchReportOverview(filters),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
