import { useState } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import useSWR from "swr";
import { useSession } from "next-auth/react";

export function useServicesSettings(tenantId: string) {
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

  const { data: services = [], mutate: mutateServices, isLoading: loading } = useSWR(
    tenantId ? getBackendUrl('/api/settings/services') : null,
    fetcher
  );

  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationMinutes: "30",
    isActive: true
  });

  const formatCurrency = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (!v) return "";
    v = (Number(v) / 100).toFixed(2);
    return v.replace(".", ",");
  };

  const minsToTime = (mins: string | number) => {
    const m = Number(mins) || 0;
    const hrs = Math.floor(m / 60).toString().padStart(2, "0");
    const remMins = (m % 60).toString().padStart(2, "0");
    return `${hrs}:${remMins}`;
  };

  const timeToMins = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(":");
    return (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", price: "", durationMinutes: "30", isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (svc: any) => {
    setEditingId(svc.id);
    const formattedPrice = formatCurrency((Number(svc.price) * 100).toFixed(0));
    setFormData({
      name: svc.name,
      description: svc.description || "",
      price: formattedPrice,
      durationMinutes: svc.durationMinutes.toString(),
      isActive: svc.isActive
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const parsedPrice = parseFloat(formData.price.replace(/\./g, "").replace(",", "."));
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parsedPrice,
        durationMinutes: parseInt(formData.durationMinutes) || 30,
        isActive: formData.isActive
      };

      if (editingId) {
        const res = await fetch(getBackendUrl('/api/settings/services'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: editingId, ...payload })
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Serviço atualizado com sucesso");
          mutateServices();
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(getBackendUrl('/api/settings/services'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Serviço cadastrado com sucesso");
          mutateServices();
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
      const res = await fetch(getBackendUrl(`/api/settings/services?id=${deleteId}`), {
        method: 'DELETE',
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Serviço excluído");
        mutateServices();
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
    services,
    loading,
    saving,
    showModal,
    setShowModal,
    editingId,
    deleteId,
    setDeleteId,
    formData,
    setFormData,
    formatCurrency,
    minsToTime,
    timeToMins,
    handleOpenNew,
    handleOpenEdit,
    handleSave,
    confirmDelete
  };
}
