import { toast } from "sonner";
import useSWR from "swr";
import { getBackendUrl } from "@/lib/api";
import { PaymentKey } from "../types/settings.types";
import { useSession } from "next-auth/react";

export function useIntegrationsSettings(targetTenantId: string | null) {
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

  const { data: keys = [], mutate: mutateKeys, isLoading: loading } = useSWR(
    targetTenantId ? getBackendUrl('/api/settings/payment-keys') : null,
    fetcher
  );

  const addKey = async (newKey: Partial<PaymentKey>) => {
    if (!targetTenantId) return false;
    try {
      const res = await fetch(getBackendUrl('/api/settings/payment-keys'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'tenant-id': targetTenantId, 
          'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newKey)
      });
      const data = await res.json();
      if (data.success) {
        mutateKeys((prev: any) => [data.data, ...prev], false);
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
          'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ isActive })
      });
      mutateKeys((prev: any) => prev.map((k: any) => ({ ...k, isActive: k.id === id ? isActive : false })), false);
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
          'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` 
        }
      });
      mutateKeys((prev: any) => prev.filter((k: any) => k.id !== id), false);
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
    mutateKeys,
    addKey,
    toggleKey,
    deleteKey
  };
}
