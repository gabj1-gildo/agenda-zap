import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { WhatsAppInstance } from "../types/settings.types";
import { useSession } from "next-auth/react";

export function useWhatsAppSettings(targetTenantId: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInstances = useCallback(async () => {
    if (!targetTenantId) {
      setLoading(false);
      return;
    }
    try {
      const headers: any = { 'tenant-id': targetTenantId };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(getBackendUrl('/api/settings/whatsapp'), { headers });
      const data = await res.json();
      
      if (data.success) {
        setInstances(data.data);
      }
    } catch (err) {
      toast.error("Erro ao carregar instâncias do WhatsApp");
    } finally {
      setLoading(false);
    }
  }, [targetTenantId, token]);

  const removeInstance = async (id: string) => {
    if (!targetTenantId) return false;
    try {
      const headers: any = { 'tenant-id': targetTenantId };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(getBackendUrl(`/api/settings/whatsapp/${id}`), {
        method: "DELETE",
        headers
      });
      
      if (res.ok) {
        setInstances(prev => prev.filter(p => p.id !== id));
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
    loadInstances,
    removeInstance
  };
}
