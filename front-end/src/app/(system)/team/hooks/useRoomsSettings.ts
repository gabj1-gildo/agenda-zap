import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";

export function useRoomsSettings(tenantId: string) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    capacity: "1",
    isActive: true
  });

  useEffect(() => {
    if (!tenantId) return;
    loadRooms();
  }, [tenantId]);

  const loadRooms = async () => {
    try {
      const res = await fetch(getBackendUrl('/api/settings/rooms'), {
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      } else {
        toast.error("Erro ao carregar salas");
      }
    } catch (e) {
      toast.error("Erro de conexão ao carregar salas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: "", capacity: "1", isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (room: any) => {
    setEditingId(room.id);
    setFormData({
      name: room.name,
      capacity: room.capacity?.toString() || "1",
      isActive: room.isActive
    });
    setShowModal(true);
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
        capacity: parseInt(formData.capacity) || 1,
        isActive: formData.isActive
      };

      if (editingId) {
        const res = await fetch(getBackendUrl(`/api/settings/rooms/${editingId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Sala atualizada com sucesso");
          setRooms(rooms.map(r => r.id === editingId ? data.data : r));
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(getBackendUrl('/api/settings/rooms'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Sala cadastrada com sucesso");
          setRooms([data.data, ...rooms]);
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
      const res = await fetch(getBackendUrl(`/api/settings/rooms/${deleteId}`), {
        method: 'DELETE',
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sala excluída");
        setRooms(rooms.filter(r => r.id !== deleteId));
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
    rooms,
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
