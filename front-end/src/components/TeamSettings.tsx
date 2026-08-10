"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, UserPlus, Shield } from "lucide-react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";

const MODULES = [
  { id: "agenda", label: "Agenda e Agendamentos" },
  { id: "chats", label: "Conversas (Inbox)" },
  { id: "clients", label: "Clientes" },
  { id: "funil", label: "Funil de Vendas" },
  { id: "payments", label: "Pagamentos e Cobranças" },
  { id: "broadcast", label: "Disparos em Massa" },
  { id: "settings", label: "Configurações (Admin)" }
];

export function TeamSettings({ tenantId }: { tenantId: string }) {
  const { data: session } = useSession();
  const [team, setTeam] = useState<any[]>([]);
  const [maxUsers, setMaxUsers] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States for adding a new user
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);
  const [newUserRole, setNewUserRole] = useState("ATTENDANT");

  // States for editing
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

  const atLimit = team.length >= maxUsers;
  const usedPct = Math.min((team.length / maxUsers) * 100, 100);

  if (loading) return <div>Carregando equipe...</div>;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        title="Remover Usuário"
        description="Tem certeza que deseja remover este usuário da empresa? Ele perderá o acesso imediatamente."
        onConfirm={removeUser}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Membros da Equipe</CardTitle>
              <CardDescription>Gerencie quem tem acesso à sua empresa e quais módulos eles podem ver.</CardDescription>
            </div>
            {/* Limit counter */}
            <div className="flex flex-col items-end gap-1">
              <Badge variant={atLimit ? "destructive" : "outline"} className="text-xs">
                {team.length}/{maxUsers} perfis
              </Badge>
              <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 999 }}>
                <div style={{ width: `${usedPct}%`, height: '100%', background: atLimit ? '#ef4444' : '#f5a524', borderRadius: 999, transition: 'width .3s' }} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Nenhum membro na equipe ainda.</div>
          ) : (
            <div className="space-y-4">
              {team.map((member) => (
                <div key={member.id} className="border rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{member.name || "Usuário sem nome"} ({member.email})</p>
                      <p className="text-sm text-muted-foreground">Papel: {member.role === 'ADMIN' ? 'Dono/Admin' : 'Atendente'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role !== 'SUPERADMIN' && member.id !== (session?.user as any)?.id && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (editingUserId === member.id) {
                                savePermissions(member.id);
                              } else {
                                setEditingUserId(member.id);
                                setEditingPermissions(member.permissions || []);
                              }
                            }}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            {editingUserId === member.id ? "Salvar Permissões" : "Editar Acessos"}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setDeleteUserId(member.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {(editingUserId === member.id || (!editingUserId && member.permissions)) && (
                    <div className="bg-muted/30 p-3 rounded-lg border">
                      <p className="text-sm font-semibold mb-2">Módulos Permitidos:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {MODULES.map(mod => {
                          const isChecked = editingUserId === member.id 
                            ? editingPermissions.includes(mod.id)
                            : (member.permissions || []).includes(mod.id);
                          
                          return (
                            <div key={mod.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`${member.id}-${mod.id}`}
                                disabled={editingUserId !== member.id}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setEditingPermissions([...editingPermissions, mod.id]);
                                  } else {
                                    setEditingPermissions(editingPermissions.filter(p => p !== mod.id));
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`${member.id}-${mod.id}`} 
                                className="text-sm cursor-pointer"
                              >
                                {mod.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Membro</CardTitle>
          <CardDescription>
            Insira o e-mail do usuário. Se ele não tiver conta, a senha temporária será enviada (em breve).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-mail do Usuário</Label>
              <Input 
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Permissões Iniciais (Módulos de Acesso)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              {MODULES.map(mod => (
                <div key={`new-${mod.id}`} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`new-${mod.id}`}
                    checked={newUserPermissions.includes(mod.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewUserPermissions([...newUserPermissions, mod.id]);
                      } else {
                        setNewUserPermissions(newUserPermissions.filter(p => p !== mod.id));
                      }
                    }}
                  />
                  <Label htmlFor={`new-${mod.id}`} className="cursor-pointer">{mod.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleAddUser} disabled={saving || atLimit} className="w-full sm:w-auto">
            <UserPlus className="w-4 h-4 mr-2" />
            {atLimit ? `Limite atingido (${team.length}/${maxUsers})` : 'Convidar Membro'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
