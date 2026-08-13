import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import useSWR from "swr";

export function useProfessionalsSettings(tenantId: string) {
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

  const { data: professionals = [], mutate: mutateProfessionals, isLoading: professionalsLoading } = useSWR(
    (tenantId && token) ? getBackendUrl('/api/settings/professionals') : null,
    fetcher
  );

  const { data: services = [], isLoading: servicesLoading } = useSWR(
    tenantId ? getBackendUrl('/api/settings/services') : null,
    fetcher
  );

  const { data: team = [], isLoading: teamLoading } = useSWR(
    tenantId ? getBackendUrl('/api/settings/team') : null,
    fetcher
  );

  const { data: tenantData, isLoading: tenantLoading } = useSWR(
    tenantId ? getBackendUrl('/api/settings/tenant') : null,
    fetcher
  );

  const maxProfessionals = tenantData?.maxUsers ?? 5;
  const loading = professionalsLoading || servicesLoading || teamLoading || tenantLoading;

  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    userId: "",
    serviceIds: [] as string[],
    isActive: true
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", userId: "", serviceIds: [], isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (prof: any) => {
    setEditingId(prof.id);
    setFormData({
      name: prof.name,
      description: prof.description || "",
      userId: prof.userId || "",
      serviceIds: prof.serviceIds || [],
      isActive: prof.isActive
    });
    setShowModal(true);
  };

  const handleServiceToggle = (svcId: string) => {
    setFormData(prev => {
      const isSelected = prev.serviceIds.includes(svcId);
      return {
        ...prev,
        serviceIds: isSelected 
          ? prev.serviceIds.filter(id => id !== svcId)
          : [...prev.serviceIds, svcId]
      };
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        userId: formData.userId || null,
        serviceIds: formData.serviceIds,
        isActive: formData.isActive
      };

      if (editingId) {
        const res = await fetch(getBackendUrl(`/api/settings/professionals/${editingId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Profissional atualizado com sucesso");
          mutateProfessionals();
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(getBackendUrl('/api/settings/professionals'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Profissional cadastrado com sucesso");
          mutateProfessionals();
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
      const res = await fetch(getBackendUrl(`/api/settings/professionals/${deleteId}`), {
        method: 'DELETE',
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profissional excluído");
        mutateProfessionals();
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
    professionals,
    services,
    team,
    maxProfessionals,
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
    handleServiceToggle,
    handleSave,
    confirmDelete
  };
}
