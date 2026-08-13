import { useState, useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { useSession } from "next-auth/react";

export const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#f43f5e', '#f5a524', '#22c55e',
  '#14b8a6', '#ec4899', '#f97316', '#06b6d4', '#64748b',
];

export function useTagsSettings(tenantId: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const headers = useCallback(() => {
    const h: any = {};
    if (tenantId) h['tenant-id'] = tenantId;
    if (token) { h['Authorization'] = `Bearer ${token}`; h['x-authorization'] = `Bearer ${token}`; }
    return h;
  }, [tenantId, token]);

  const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: headers() });
    const data = await res.json();
    return data.success ? data.data : [];
  };

  const { data: tags = [], mutate, isLoading: loading } = useSWR(
    tenantId ? getBackendUrl('/api/tags') : null,
    fetcher
  );

  const [saving, setSaving] = useState(false);

  const createTag = async (name: string, color: string) => {
    if (!name.trim()) { toast.error("Nome da tag é obrigatório"); return false; }
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/tags'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ name: name.trim(), color })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tag criada!");
        mutate();
        return true;
      } else {
        toast.error(data.error || "Erro ao criar tag");
        return false;
      }
    } catch {
      toast.error("Erro de conexão");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateTag = async (id: string, name: string, color: string) => {
    if (!name.trim()) { toast.error("Nome é obrigatório"); return false; }
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl(`/api/tags/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ name: name.trim(), color })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tag atualizada!");
        mutate();
        return true;
      } else {
        toast.error(data.error || "Erro ao atualizar tag");
        return false;
      }
    } catch {
      toast.error("Erro de conexão");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const res = await fetch(getBackendUrl(`/api/tags/${id}`), {
        method: 'DELETE',
        headers: headers()
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tag removida!");
        mutate();
        return true;
      } else {
        toast.error(data.error || "Erro ao remover tag");
        return false;
      }
    } catch {
      toast.error("Erro de conexão");
      return false;
    }
  };

  return {
    tags,
    loading,
    saving,
    createTag,
    updateTag,
    deleteTag
  };
}
