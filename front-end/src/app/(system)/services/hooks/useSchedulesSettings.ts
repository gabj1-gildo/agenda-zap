import { useState } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import useSWR from "swr";
import { useSession } from "next-auth/react";

export function useSchedulesSettings(tenantId: string) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const fetcher = async (url: string) => {
    const headers = { 
      'tenant-id': tenantId, 
      ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) 
    };
    const res = await fetch(url, { headers });
    const data = await res.json();
    return data.success ? data.data : null;
  };

  const { data: schedules = [], mutate: mutateSchedules, isLoading: loading } = useSWR(
    (tenantId && token) ? getBackendUrl('/api/settings/schedules') : null,
    fetcher
  );

  const [saving, setSaving] = useState(false);

  const saveSchedules = async (currentSchedules: any[]) => {
    setSaving(true);
    try {
      await fetch(getBackendUrl('/api/settings/schedules'), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'tenant-id': tenantId, 
          ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) 
        },
        body: JSON.stringify({ schedules: currentSchedules })
      });
      toast.success("Horários salvos com sucesso!");
      mutateSchedules(currentSchedules, false);
    } catch (e) {
      toast.error("Erro ao salvar horários");
    } finally {
      setSaving(false);
    }
  };

  const minsToTime = (m: number) => {
    if (!m || isNaN(m)) return "00:00";
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const timeToMins = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  return {
    schedules,
    loading,
    saving,
    saveSchedules,
    minsToTime,
    timeToMins,
    mutateSchedules
  };
}
