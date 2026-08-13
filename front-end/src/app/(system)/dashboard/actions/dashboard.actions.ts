"use server";

import { getBackendUrl } from "@/lib/api";
import { DashboardMetrics, AdminMetrics, Tenant } from "../types/dashboard.types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function fetchDashboardMetrics(
  tenantId: string, 
  startDate: string, 
  endDate: string
): Promise<DashboardMetrics | null> {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  if (!token) return null;

  try {
    const res = await fetch(
      getBackendUrl(`/api/dashboard/metrics?tenantId=${tenantId}&startDate=${startDate}&endDate=${endDate}`),
      {
        headers: { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` },
        cache: "no-store", // force dynamic
      }
    );
    const data = await res.json();
    if (data.success) {
      return data.data as DashboardMetrics;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch dashboard metrics:", error);
    return null;
  }
}

export async function fetchAdminMetrics(): Promise<AdminMetrics | null> {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  if (!token) return null;

  try {
    const res = await fetch(getBackendUrl('/api/admin/metrics'), {
      headers: { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    if (data.data) {
      return data.data as AdminMetrics;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch admin metrics:", error);
    return null;
  }
}

export async function fetchTenants(): Promise<Tenant[]> {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  if (!token) return [];

  try {
    const res = await fetch(getBackendUrl('/api/tenants'), {
      headers: { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) {
      return data.data as Tenant[];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch tenants:", error);
    return [];
  }
}
