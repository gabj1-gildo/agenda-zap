import { useState } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import useSWR from "swr";
import { useSession } from "next-auth/react";

export function useExceptionsSettings(tenantId: string) {
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

  const { data: exceptions = [], mutate: mutateExceptions, isLoading: loading } = useSWR(
    (tenantId && token) ? getBackendUrl('/api/settings/schedule-exceptions') : null,
    fetcher
  );

  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: "",
    isClosed: true,
    customStartTime: "09:00",
    customEndTime: "18:00"
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ date: "", isClosed: true, customStartTime: "09:00", customEndTime: "18:00" });
    setShowModal(true);
  };

  const handleOpenEdit = (exc: any) => {
    setEditingId(exc.id);
    setFormData({
      date: exc.date.split('T')[0],
      isClosed: exc.isClosed,
      customStartTime: exc.customStartTime || "09:00",
      customEndTime: exc.customEndTime || "18:00"
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.date) return toast.error("A data é obrigatória");
    
    if (!formData.isClosed) {
      if (!formData.customStartTime || !formData.customEndTime) {
        return toast.error("Os horários de início e fim são obrigatórios quando não está fechado");
      }
      if (formData.customStartTime >= formData.customEndTime) {
        return toast.error("O horário de início deve ser menor que o horário de fim");
      }
    }

    setSaving(true);
    try {
      const payload = {
        date: formData.date,
        isClosed: formData.isClosed,
        customStartTime: formData.isClosed ? null : formData.customStartTime,
        customEndTime: formData.isClosed ? null : formData.customEndTime,
      };

      if (editingId) {
        const res = await fetch(getBackendUrl('/api/settings/schedule-exceptions'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: editingId, ...payload })
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Exceção atualizada com sucesso");
          mutateExceptions();
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(getBackendUrl('/api/settings/schedule-exceptions'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Exceção cadastrada com sucesso");
          mutateExceptions();
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao cadastrar");
        }
      }
    } catch (e) {
      toast.error("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(getBackendUrl(`/api/settings/schedule-exceptions?id=${deleteId}`), {
        method: 'DELETE',
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Exceção excluída");
        mutateExceptions();
      } else {
        toast.error(data.error || "Erro ao excluir");
      }
    } catch (e) {
      toast.error("Erro de conexão ao excluir");
    } finally {
      setDeleteId(null);
    }
  };

  return {
    exceptions,
    loading,
    saving,
    showModal,
    setShowModal,
    editingId,
    deleteId,
    setDeleteId,
    formData,
    setFormData,
    handleOpenNew,
    handleOpenEdit,
    handleSave,
    confirmDelete
  };
}
