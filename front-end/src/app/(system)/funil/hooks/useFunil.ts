"use client";

import useSWR from "swr";
import { getBackendUrl } from "@/lib/api";
import { useSession } from "next-auth/react";
import { Board, emptyBoard, StageKey, DBStage } from "../types/funil";

export function useFunil(tenantId: string) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const fetcher = async ([url, jwt]: [string, string]) => {
    if (!jwt) throw new Error("No token");
    const res = await fetch(getBackendUrl(url), {
      headers: { 'tenant-id': tenantId, 'Authorization': `Bearer ${jwt}` },
    });
    const json = await res.json();
    return json.data || { board: emptyBoard, stats: { total: 0, conversion: 0, inAttendance: 0, finalizados: 0 } };
  };

  const url = `/api/funil`;

  const { data, error, isValidating, mutate } = useSWR(
    token && tenantId ? [url, token] : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
    }
  );

  const moveLeadOptimistic = async (draggedId: string, from: StageKey, to: StageKey, toDbKey: DBStage) => {
    if (!data) return;

    // Optimistic update
    mutate((prevData: any) => {
      if (!prevData) return prevData;
      const newBoard = { ...prevData.board };
      
      const idx = newBoard[from].findIndex((c: any) => c.id === draggedId);
      if (idx === -1) return prevData;
      
      const [card] = newBoard[from].splice(idx, 1);
      card.funnelStage = toDbKey;
      newBoard[to] = [...newBoard[to], card];
      
      return { ...prevData, board: newBoard };
    }, false);

    // Call API
    try {
      const res = await fetch(getBackendUrl(`/api/funil/${draggedId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ funnelStage: toDbKey })
      });
      if (!res.ok) {
        mutate(); // revert on fail
      }
    } catch {
      mutate(); // revert on fail
    }
  };

  return {
    board: (data?.board as Board) || emptyBoard,
    stats: data?.stats || { total: 0, conversion: 0, inAttendance: 0, finalizados: 0 },
    isLoading: !data && !error,
    isRefreshing: isValidating,
    error,
    mutate,
    moveLeadOptimistic
  };
}
