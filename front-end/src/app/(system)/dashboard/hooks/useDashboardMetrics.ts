"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { DashboardMetrics } from "../types/dashboard.types";
import { getBackendUrl } from "@/lib/api";
import { useSession } from "next-auth/react";

function getDateRangeStrings(range: string) {
  let start = new Date();
  const end = new Date();

  if (range === "Hoje") {
    start.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    start.setDate(start.getDate() - 7);
  } else if (range === "30d") {
    start.setDate(start.getDate() - 30);
  } else if (range === "Mes") {
    start = new Date(start.getFullYear(), start.getMonth(), 1);
  } else if (range === "Sempre") {
    start = new Date(0); // Desde o início
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function useDashboardMetrics(tenantId: string, initialMetrics: DashboardMetrics) {
  const [dateRange, setDateRange] = useState("Hoje"); // As agreed, default to "Hoje"
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  // The fetcher for SWR uses the standard REST endpoint
  const fetcher = async ([url, jwt]: [string, string]) => {
    if (!jwt) throw new Error("No token");
    const res = await fetch(getBackendUrl(url), {
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    const data = await res.json();
    if (data.success) {
      return data.data as DashboardMetrics;
    }
    throw new Error("Failed to fetch metrics");
  };

  const { startDate, endDate } = getDateRangeStrings(dateRange);
  const url = `/api/dashboard/metrics?tenantId=${tenantId}&startDate=${startDate}&endDate=${endDate}`;

  // useSWR will use the initialMetrics on the first render, avoiding any loading state.
  // It will poll every 30s.
  const { data, isValidating } = useSWR(
    token ? [url, token] : null,
    fetcher,
    {
      fallbackData: initialMetrics,
      refreshInterval: 30000, 
      revalidateOnFocus: true
    }
  );

  return {
    dateRange,
    setDateRange,
    metrics: data || initialMetrics,
    isRefreshing: isValidating
  };
}
