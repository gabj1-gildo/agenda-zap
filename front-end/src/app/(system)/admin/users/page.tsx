"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Users, Plus, ShieldCheck, Building2, Save, X, Phone, Edit } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { getBackendUrl } from "@/lib/api";

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "ATTENDANT",
    status: "ACTIVE",
    selectedTenantId: "",
    superAdminPin: "",
  });

  const role = (session?.user as any)?.role;
  const activeTenantId = (session as any)?.tenantId;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = (session as any)?.user?.accessToken;
      const res = await fetch(getBackendUrl('/api/admin/users'), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-id": activeTenantId || ""
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (e) {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantsList = async () => {
    try {
      const token = (session as any)?.user?.accessToken;
      const res = await fetch(getBackendUrl('/api/admin/tenants'), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-id": activeTenantId || ""
        }
      });
      const data = await res.json();
      if (data.success) {
        setTenantsList(data.data);
      }
    } catch (e) {
      console.error("Erro ao carregar lista de empresas", e);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUsers();
      if (role === "SUPERADMIN") {
        fetchTenantsList();
      }
    }
  }, [session, activeTenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEditing = !!editingId;
      const method = isEditing ? "PUT" : "POST";
      
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        superAdminPin: formData.superAdminPin,
      };

      if (isEditing) {
        payload.id = editingId;
      }
      
      if (role === "SUPERADMIN") {
        if (formData.role !== "SUPERADMIN" && !formData.selectedTenantId) {
          toast.error("Obrigatório vincular o usuário a uma empresa.");
          setSaving(false);
          return;
        }
        payload.tenantIds = formData.selectedTenantId ? [formData.selectedTenantId] : [];
      } else if (!isEditing) {
        payload.tenantIds = [activeTenantId];
      }

      const token = (session as any)?.user?.accessToken;
      const res = await fetch(getBackendUrl('/api/admin/users'), {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-tenant-id": activeTenantId || ""
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Usuário ${isEditing ? "atualizado" : "criado"} com sucesso!`);
        closeModal();
        fetchUsers();
      } else {
        toast.error(data.message || `Erro ao ${isEditing ? "atualizar" : "criar"} usuário`);
      }
    } catch (e) {
      toast.error("Erro interno no servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePassword = async (userId: string) => {
    if (!confirm("Tem certeza que deseja gerar uma nova senha para este usuário? A senha será enviada por e-mail.")) return;
    
    try {
      const token = (session as any)?.user?.accessToken;
      const res = await fetch(getBackendUrl(`/api/admin/users/${userId}/random-password`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-id": activeTenantId || ""
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Nova senha gerada e enviada por e-mail.");
      } else {
        toast.error(data.message || "Erro ao gerar senha");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    }
  };

  const openModal = (user?: any) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        status: user.status,
        selectedTenantId: user.tenants?.[0]?.id || "", // Load existing tenant
        superAdminPin: "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", email: "", phone: "", role: "USER", status: "ACTIVE", selectedTenantId: "", superAdminPin: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", email: "", phone: "", role: "USER", status: "ACTIVE", selectedTenantId: "", superAdminPin: "" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {role === "SUPERADMIN" ? "Administrador da Plataforma" : "Empresa"}
          </p>
          <h1 className="font-display font-extrabold text-4xl text-foreground flex items-center gap-3">
            <Users className="w-8 h-8" style={{ color: "var(--primary)" }} />
            Gestão de Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "SUPERADMIN" 
              ? "Gerencie todos os acessos e permissões globais." 
              : "Gerencie os membros da sua empresa."}
          </p>
        </div>
        
        <button
          onClick={() => openModal()}
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      <div style={{ borderColor: "var(--border)" }} className="bg-card border rounded-2xl overflow-hidden">
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-display font-extrabold text-lg text-foreground">Contas de acesso</h2>
          <span className="font-mono-custom text-xs text-muted-foreground">{users.length} cadastrados</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Nenhum usuário encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione o primeiro membro clicando em "Novo Usuário".</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0"><table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Usuário</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Telefone</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Função</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Empresas</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Status</th>
                <th className="text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-foreground text-sm">{u.name || "Sem nome"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{u.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 font-mono-custom text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      {formatPhone(u.phone) || "Não informado"}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase ${
                      u.role === 'SUPERADMIN' 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-primary/10 dark:bg-white/10 text-foreground dark:text-white border border-primary/20 dark:border-white/20'
                    }`}>
                      {u.role === 'SUPERADMIN' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {u.tenants?.length > 0 ? (
                        u.tenants.map((t: any) => (
                          <span key={t.id} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20">
                            <Building2 className="w-3 h-3" />
                            {t.name}
                          </span>
                        ))
                      ) : u.role === 'SUPERADMIN' ? (
                        <span className="text-muted-foreground text-xs font-semibold">Acesso Global</span>
                      ) : (
                        <span className="text-red-500 text-xs font-semibold">Sem empresa (Acesso Bloqueado)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.status === 'ACTIVE' ? (
                      <span className="stamp stamp-paid text-[9px] px-2 py-0.5">ATIVO</span>
                    ) : u.status === 'INACTIVE' ? (
                      <span className="stamp stamp-late text-[9px] px-2 py-0.5">INATIVO</span>
                    ) : (
                      <span className="stamp stamp-pending text-[9px] px-2 py-0.5">BLOQUEADO</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                    {role === "SUPERADMIN" && (
                      <button
                        onClick={() => handleGeneratePassword(u.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                        title="Gerar e enviar nova senha aleatória"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Resetar Senha
                      </button>
                    )}
                    <button 
                      onClick={() => openModal(u)}
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div 
            style={{ borderColor: "var(--border)" }} 
            className="bg-card w-full max-w-lg rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={closeModal}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h2 className="font-display font-extrabold text-2xl text-foreground">
                {editingId ? "Editar Usuário" : "Criar Novo Usuário"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Preencha os dados do membro da equipe.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nome</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all"
                  style={{ borderColor: "var(--border)" }}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all"
                    style={{ borderColor: "var(--border)" }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Telefone</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
                    placeholder="+55 (11) 9 9999-9999"
                    maxLength={21}
                    className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              {!editingId && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-3.5 rounded-xl flex gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block mb-0.5 font-bold">Segurança Aprimorada</strong>
                    Uma senha temporária criptografada será gerada automaticamente e enviada para o e-mail do usuário. Ele deverá definir uma nova senha segura no primeiro acesso.
                  </div>
                </div>
              )}

              {role === "SUPERADMIN" && formData.role !== "SUPERADMIN" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Vincular a uma Empresa (Obrigatório)</label>
                  <select 
                    value={formData.selectedTenantId}
                    onChange={e => setFormData({...formData, selectedTenantId: e.target.value})}
                    className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all"
                    style={{ borderColor: "var(--border)" }}
                    required
                  >
                    <option value="" disabled>Selecione uma empresa</option>
                    {tenantsList.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nível de Acesso</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {role === "SUPERADMIN" && <option value="SUPERADMIN">Super Admin</option>}
                    <option value="ADMIN">Admin de Empresa</option>
                    <option value="ATTENDANT">Atendente</option>
                    {role === "SUPERADMIN" && <option value="NO_ACCESS">Sem Acesso</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                    <option value="BLOCKED">Bloqueado</option>
                  </select>
                </div>
              </div>

              {role === "SUPERADMIN" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                    PIN de Segurança (Super Admin)
                  </label>
                  <input 
                    type="password" 
                    maxLength={6}
                    value={formData.superAdminPin}
                    onChange={e => setFormData({...formData, superAdminPin: e.target.value})}
                    placeholder="******"
                    className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all font-mono-custom tracking-widest"
                    style={{ borderColor: "var(--border)" }}
                    required
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : (editingId ? "Salvar Alterações" : "Salvar Usuário")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
