import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { PaymentKey } from "../types/settings.types";
import { useSession } from "next-auth/react";

export function useIntegrationsSettings(targetTenantId: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  
  const [keys, setKeys] = useState<PaymentKey[]>([]);
  const [loading, setLoading] = useState(true);

  const loadKeys = useCallback(async () => {
    if (!targetTenantId) {
      setLoading(false);
      return;
    }
    try {
      const headers: any = { 'tenant-id': targetTenantId };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(getBackendUrl('/api/settings/payment-keys'), { headers });
      const data = await res.json();
      
      if (data.success) {
        setKeys(data.data);
      }
    } catch (err) {
      toast.error("Erro ao carregar chaves de pagamento");
    } finally {
      setLoading(false);
    }
  }, [targetTenantId, token]);

  const addKey = async (newKey: Partial<PaymentKey>) => {
    if (!targetTenantId) return false;
    try {
      const res = await fetch(getBackendUrl('/api/settings/payment-keys'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'tenant-id': targetTenantId, 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newKey)
      });
      const data = await res.json();
      if (data.success) {
        setKeys(prev => [data.data, ...prev]);
        toast.success("Chave adicionada!");
        return true;
      }
      return false;
    } catch (e) {
      toast.error("Erro ao adicionar chave");
      return false;
    }
  };

  const toggleKey = async (id: string, isActive: boolean) => {
    if (!targetTenantId) return;
    try {
      await fetch(getBackendUrl(`/api/settings/payment-keys/${id}`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'tenant-id': targetTenantId, 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ isActive })
      });
      setKeys(prev => prev.map(k => ({ ...k, isActive: k.id === id ? isActive : false })));
      toast.success(isActive ? "Chave ativada!" : "Chave desativada!");
    } catch (e) {
      toast.error("Erro ao alterar chave");
    }
  };

  const deleteKey = async (id: string) => {
    if (!targetTenantId) return false;
    try {
      await fetch(getBackendUrl(`/api/settings/payment-keys/${id}`), { 
        method: 'DELETE',
        headers: { 
          'tenant-id': targetTenantId, 
          'Authorization': `Bearer ${token}` 
        }
      });
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success("Chave excluída!");
      return true;
    } catch (e) {
      toast.error("Erro ao excluir chave");
      return false;
    }
  };

  return {
    keys,
    loading,
    loadKeys,
    addKey,
    toggleKey,
    deleteKey
  };
}
