"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { authFetcher } from "@/lib/swr-config";

export function useProfessionals(tenantId?: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  return useSWR<any>(
    tenantId && token ? [`/api/settings/professionals`, token, { "tenant-id": tenantId }] : null,
    authFetcher
  );
}

export function useRooms(tenantId?: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  return useSWR<any>(
    tenantId && token ? [`/api/settings/rooms`, token, { "tenant-id": tenantId }] : null,
    authFetcher
  );
}

export function useServices(tenantId?: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  return useSWR<any>(
    tenantId && token ? [`/api/settings/services`, token, { "tenant-id": tenantId }] : null,
    authFetcher
  );
}

export function useBadges(tenantId?: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  return useSWR<any>(
    tenantId && token ? [`/api/tenants/${tenantId}/badges`, token] : null,
    authFetcher
  );
}