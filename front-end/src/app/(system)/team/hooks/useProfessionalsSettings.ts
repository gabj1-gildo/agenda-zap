import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";

export function useProfessionalsSettings(tenantId: string) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [maxProfessionals, setMaxProfessionals] = useState<number>(5);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!tenantId) return;
    loadAllData();
  }, [tenantId]);

  const loadAllData = async () => {
    try {
      const hdrs = { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
      const [profRes, svcRes, teamRes, tenantRes] = await Promise.all([
        fetch(getBackendUrl('/api/settings/professionals'), { headers: hdrs }),
        fetch(getBackendUrl('/api/settings/services'), { headers: hdrs }),
        fetch(getBackendUrl('/api/settings/team'), { headers: hdrs }),
        fetch(getBackendUrl('/api/settings/tenant'), { headers: hdrs })
      ]);
      const profData = await profRes.json();
      const svcData = await svcRes.json();
      const teamData = await teamRes.json();
      const tenantData = await tenantRes.json();
      
      if (profData.success) setProfessionals(profData.data);
      if (svcData.success) setServices(svcData.data);
      if (teamData.success) setTeam(teamData.data);
      if (tenantData.success) setMaxProfessionals(tenantData.data?.maxUsers ?? 5);
    } catch (e) {
      toast.error("Erro de conexão ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

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
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Profissional atualizado com sucesso");
          setProfessionals(professionals.map(p => p.id === editingId ? data.data : p));
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(getBackendUrl('/api/settings/professionals'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Profissional cadastrado com sucesso");
          setProfessionals([data.data, ...professionals]);
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
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profissional excluído");
        setProfessionals(professionals.filter(p => p.id !== deleteId));
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
