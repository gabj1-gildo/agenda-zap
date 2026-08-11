"use client";

import useSWR from "swr";
import { getBackendUrl } from "@/lib/api";
import { useSession } from "next-auth/react";

export function useClients(tenantId: string) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const fetcher = async ([url, jwt]: [string, string]) => {
    if (!jwt) throw new Error("No token");
    const res = await fetch(getBackendUrl(url), {
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    const json = await res.json();
    return json.data || [];
  };

  const url = `/api/dashboard/clients?tenantId=${tenantId}`;

  const { data, error, isValidating, mutate } = useSWR(
    token ? [url, token] : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
    }
  );

  return {
    clients: data || [],
    isLoading: !data && !error,
    isRefreshing: isValidating,
    error,
    mutate,
  };
}
