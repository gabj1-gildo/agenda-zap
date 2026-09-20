import type { SWRConfiguration } from "swr";
import { getBackendUrl } from "@/lib/api";

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
  errorRetryCount: 1,
  dedupingInterval: 2000,
};

type AuthFetcherArgs = [url: string, token: string, extraHeaders?: Record<string, string>];

export async function authFetcher([url, token, extraHeaders]: AuthFetcherArgs) {
  const res = await fetch(getBackendUrl(url), {
    headers: { Authorization: `Bearer ${token}`, ...(extraHeaders || {}) },
  });
  const json = await res.json();
  if (json.success) return json.data;
  throw new Error("Falha ao buscar dados");
}