import { toast } from "sonner";
import useSWR from "swr";
import { getBackendUrl } from "@/lib/api";
import { WhatsAppInstance } from "../types/settings.types";
import { useSession } from "next-auth/react";

export function useWhatsAppSettings(targetTenantId: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  
  const fetcher = async (url: string) => {
    if (!targetTenantId) return [];
    const headers: any = { 'tenant-id': targetTenantId };
    if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }
    const res = await fetch(url, { headers });
    const data = await res.json();
    return data.success ? data.data : [];
  };

  const { data: instances = [], mutate: mutateInstances, isLoading: loading } = useSWR(
    (targetTenantId && token) ? getBackendUrl('/api/settings/whatsapp') : null,
    fetcher
  );

  const removeInstance = async (id: string) => {
    if (!targetTenantId) return false;
    try {
      const headers: any = { 'tenant-id': targetTenantId };
      if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }
      
      const res = await fetch(getBackendUrl(`/api/settings/whatsapp/${id}`), {
        method: "DELETE",
        headers
      });
      
      if (res.ok) {
        mutateInstances((prev: any) => prev.filter((p: any) => p.id !== id), false);
        toast.success("WhatsApp desconectado!");
        return true;
      } else {
        toast.error("Falha ao desconectar.");
        return false;
      }
    } catch (e) {
      toast.error("Erro ao desconectar WhatsApp.");
      return false;
    }
  };

  return {
    instances,
    loading,
    mutateInstances,
    removeInstance
  };
}
