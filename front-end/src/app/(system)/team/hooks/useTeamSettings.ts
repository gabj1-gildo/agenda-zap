import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import useSWR from "swr";

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
  
  const fetcher = async (url: string) => {
    const headers = { 
      'tenant-id': tenantId, 
      'Authorization': `Bearer ${(session?.user as any)?.accessToken}` 
    };
    const res = await fetch(url, { headers });
    const data = await res.json();
    return data.success ? data.data : null;
  };

  const { data: team = [], mutate: mutateTeam, isLoading: teamLoading } = useSWR(
    (tenantId && token) ? getBackendUrl('/api/settings/team') : null,
    fetcher
  );

  const { data: tenantData, isLoading: tenantLoading } = useSWR(
    tenantId ? getBackendUrl('/api/settings/tenant') : null,
    fetcher
  );

  const maxUsers = tenantData?.maxUsers ?? 3;
  const loading = teamLoading || tenantLoading;

  const [saving, setSaving] = useState(false);
  
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);
  const [newUserRole, setNewUserRole] = useState("ATTENDANT");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

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
        mutateTeam();
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
        mutateTeam();
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
        mutateTeam();
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
