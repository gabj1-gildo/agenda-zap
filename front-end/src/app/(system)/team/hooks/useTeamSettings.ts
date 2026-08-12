import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";

export const MODULES = [
  { id: "agenda", label: "Agenda e Agendamentos" },
  { id: "chats", label: "Conversas (Inbox)" },
  { id: "clients", label: "Clientes" },
  { id: "funil", label: "Funil de Vendas" },
  { id: "payments", label: "Pagamentos e Cobranças" },
  { id: "broadcast", label: "Disparos em Massa" },
  { id: "settings", label: "Configurações (Admin)" }
];

export function useTeamSettings(tenantId: string) {
  const { data: session } = useSession();
  const [team, setTeam] = useState<any[]>([]);
  const [maxUsers, setMaxUsers] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);
  const [newUserRole, setNewUserRole] = useState("ATTENDANT");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const loadTeam = async () => {
    try {
      const headers = { 'tenant-id': tenantId, 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` };
      const [teamRes, tenantRes] = await Promise.all([
        fetch(getBackendUrl('/api/settings/team'), { headers }),
        fetch(getBackendUrl('/api/settings/tenant'), { headers })
      ]);
      const data = await teamRes.json();
      const tenantData = await tenantRes.json();
      if (data.success) setTeam(data.data);
      if (tenantData.success) setMaxUsers(tenantData.data?.maxUsers ?? 3);
    } catch (e) {
      toast.error("Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) loadTeam();
  }, [tenantId]);

  const handleAddUser = async () => {
    if (!newUserEmail) return toast.error("Preencha o e-mail");
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/settings/team'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
        },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
          permissions: newUserPermissions
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Usuário adicionado à equipe!");
        setNewUserEmail("");
        setNewUserPermissions([]);
        loadTeam();
      } else {
        toast.error(data.message || "Erro ao adicionar usuário");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const savePermissions = async (userId: string) => {
    try {
      const res = await fetch(getBackendUrl(`/api/settings/team/${userId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
        },
        body: JSON.stringify({ permissions: editingPermissions })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Permissões atualizadas!");
        setEditingUserId(null);
        loadTeam();
      } else {
        toast.error("Erro ao salvar permissões");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    }
  };

  const removeUser = async () => {
    if (!deleteUserId) return;
    try {
      const res = await fetch(getBackendUrl(`/api/settings/team/${deleteUserId}`), {
        method: 'DELETE',
        headers: {
          'tenant-id': tenantId,
          'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Usuário removido da equipe");
        loadTeam();
      } else {
        toast.error("Erro ao remover usuário");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    } finally {
      setDeleteUserId(null);
    }
  };

  return {
    team,
    maxUsers,
    loading,
    saving,
    newUserEmail,
    setNewUserEmail,
    newUserPermissions,
    setNewUserPermissions,
    newUserRole,
    setNewUserRole,
    editingUserId,
    setEditingUserId,
    editingPermissions,
    setEditingPermissions,
    deleteUserId,
    setDeleteUserId,
    handleAddUser,
    savePermissions,
    removeUser,
    session
  };
}
