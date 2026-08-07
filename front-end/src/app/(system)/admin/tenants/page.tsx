"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Building2, Plus, Edit, Phone, CreditCard, Save, X, Users, Trash, RefreshCw } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function TenantsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Confirmação de Ações de Lixeira
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePin, setDeletePin] = useState("");
  const [restoreId, setRestoreId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    maxUsers: 1,
    activePlan: "FREE",
    paymentStatus: "ACTIVE",
    customMaxWhatsAppInstances: "",
    superAdminPin: "",
  });

  const role = (session?.user as any)?.role;

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const token = (session as any)?.user?.accessToken;
      const res = await fetch(getBackendUrl(`/api/admin/tenants?status=${activeTab}`), {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      } else {
        toast.error("Você não tem permissão para ver isso.");
      }
    } catch (e) {
      toast.error("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && role === "SUPERADMIN") {
      fetchTenants();
    }
  }, [session, role, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const payload: any = {
        name: formData.name,
        phone: formData.phone,
        maxUsers: Number(formData.maxUsers),
        activePlan: formData.activePlan,
        paymentStatus: formData.paymentStatus,
        customMaxWhatsAppInstances: formData.customMaxWhatsAppInstances ? Number(formData.customMaxWhatsAppInstances) : null,
        superAdminPin: formData.superAdminPin,
      };

      if (editingId) {
        payload.id = editingId;
      }

      const token = (session as any)?.user?.accessToken;
      const res = await fetch(getBackendUrl('/api/admin/tenants'), {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Empresa ${editingId ? "atualizada" : "criada"} com sucesso!`);
        closeModal();
        fetchTenants();
      } else {
        toast.error(data.message || `Erro ao ${editingId ? "atualizar" : "criar"} empresa`);
      }
    } catch (e) {
      toast.error("Erro interno no servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreId) return;
    setSaving(true);
    try {
      const token = (session as any)?.user?.accessToken;
      const res = await fetch(getBackendUrl('/api/admin/tenants'), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: restoreId,
          restore: true,
          // Senha master usada para restaurar
          superAdminPin: "AdminSeguro2026!", 
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Empresa restaurada com sucesso!");
        fetchTenants();
      } else {
        toast.error(data.message || "Erro ao restaurar empresa");
      }
    } catch (e) {
      toast.error("Erro interno no servidor");
    } finally {
      setSaving(false);
      setRestoreId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !deletePin) {
      toast.error("O PIN é obrigatório para excluir.");
      return;
    }
    setSaving(true);
    try {
      const token = (session as any)?.user?.accessToken;
      const res = await fetch(getBackendUrl(`/api/admin/tenants?id=${deleteId}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "superadmin-pin": deletePin
        }
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Empresa movida para a lixeira.");
        fetchTenants();
      } else {
        toast.error(data.message || "Erro ao excluir empresa");
      }
    } catch (e) {
      toast.error("Erro interno no servidor");
    } finally {
      setSaving(false);
      setDeleteId(null);
      setDeletePin("");
    }
  };

  const openModal = (tenant?: any) => {
    if (tenant) {
      setEditingId(tenant.id);
      setFormData({
        name: tenant.name,
        phone: tenant.phone || "",
        maxUsers: tenant.maxUsers,
        activePlan: tenant.activePlan || "FREE",
        paymentStatus: tenant.paymentStatus || "ACTIVE",
        customMaxWhatsAppInstances: tenant.customMaxWhatsAppInstances?.toString() || "",
        superAdminPin: "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", phone: "", maxUsers: 1, activePlan: "FREE", paymentStatus: "ACTIVE", customMaxWhatsAppInstances: "", superAdminPin: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", phone: "", maxUsers: 1, activePlan: "FREE", paymentStatus: "ACTIVE", customMaxWhatsAppInstances: "", superAdminPin: "" });
  };

  if (role !== "SUPERADMIN") {
    return (
      <div className="p-8 text-center text-muted-foreground animate-in fade-in">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Administrador da Plataforma
          </p>
          <h1 className="font-display font-extrabold text-4xl text-foreground flex items-center gap-3">
            <Building2 className="w-8 h-8" style={{ color: "var(--primary)" }} />
            Gestão de Empresas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os planos, limites de usuários e detalhes comerciais das empresas assinantes.
          </p>
        </div>
        
        <button
          onClick={() => openModal()}
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      <div style={{ borderColor: "var(--border)" }} className="bg-card border rounded-2xl overflow-hidden">
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          <button 
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest text-center transition-colors ${activeTab === 'active' ? 'text-foreground border-b-2 border-primary bg-muted/20' : 'text-muted-foreground hover:bg-muted/10'}`}
          >
            Ativas
          </button>
          <button 
            onClick={() => setActiveTab("deleted")}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest text-center transition-colors ${activeTab === 'deleted' ? 'text-foreground border-b-2 border-primary bg-muted/20' : 'text-muted-foreground hover:bg-muted/10'}`}
          >
            Lixeira
          </button>
        </div>
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{ borderColor: "var(--border)", background: "var(--background)" }}
        >
          <h2 className="font-display font-extrabold text-lg text-foreground">{activeTab === 'active' ? 'Empresas Ativas' : 'Empresas na Lixeira (30 dias)'}</h2>
          <span className="font-mono-custom text-xs text-muted-foreground">{tenants.length} encontradas</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando empresas...</div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Nenhuma empresa encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione a primeira empresa clicando no botão acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0"><table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Nome Comercial</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Contato</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Limite de Usuários</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Plano</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Pagamento</th>
                <th className="text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-foreground text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono-custom">ID: {t.id.slice(0,8)}...</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 font-mono-custom text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      {formatPhone(t.phone) || "Não informado"}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 font-mono-custom text-sm font-semibold text-foreground">
                      {t.maxUsers} <Users className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase ${
                      t.activePlan === 'ENTERPRISE' ? 'bg-primary/10 text-primary border border-primary/20' :
                      t.activePlan === 'PRO' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' :
                      'bg-primary/10 dark:bg-white/10 text-foreground dark:text-white border border-primary/20 dark:border-white/20'
                    }`}>
                      <Building2 className="w-3 h-3" />
                      {t.activePlan || 'FREE'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {t.paymentStatus === 'ACTIVE' ? (
                      <span className="stamp stamp-paid text-[9px] px-2 py-0.5">ATIVO</span>
                    ) : t.paymentStatus === 'OVERDUE' ? (
                      <span className="stamp stamp-late text-[9px] px-2 py-0.5">ATRASADO</span>
                    ) : (
                      <span className="stamp stamp-pending text-[9px] px-2 py-0.5">SUSPENSO</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                    {activeTab === 'active' ? (
                      <>
                        <button 
                          onClick={() => openModal(t)}
                          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Gerenciar
                        </button>
                        <button 
                          onClick={() => setDeleteId(t.id)}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Mover para Lixeira"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setRestoreId(t.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-green-500/30 text-green-600 rounded-lg hover:bg-green-500/10 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Restaurar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      {/* Modal Confirmar Exclusão com PIN */}
      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Mover para Lixeira"
        description="Esta empresa perderá acesso ao sistema, mas poderá ser restaurada na aba Lixeira."
        onConfirm={handleDelete}
        confirmText={saving ? "Excluindo..." : "Excluir Empresa"}
      >
        <div className="mt-4">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
            PIN de Segurança
          </label>
          <input 
            type="password" 
            maxLength={6}
            value={deletePin}
            onChange={e => setDeletePin(e.target.value)}
            placeholder="******"
            className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all font-mono-custom tracking-widest"
            style={{ borderColor: "var(--border)" }}
            required
          />
        </div>
      </ConfirmModal>

      {/* Modal Confirmar Restauração */}
      <ConfirmModal
        open={!!restoreId}
        onOpenChange={(o) => !o && setRestoreId(null)}
        title="Restaurar Empresa"
        description="Tem certeza que deseja restaurar esta empresa? Seus usuários voltarão a ter acesso ao sistema."
        onConfirm={handleRestore}
        confirmText={saving ? "Restaurando..." : "Restaurar Empresa"}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div 
            style={{ borderColor: "var(--border)" }} 
            className="bg-card w-full max-w-lg rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <button 
              onClick={closeModal}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h2 className="font-display font-extrabold text-2xl text-foreground">
                {editingId ? "Editar Empresa" : "Criar Empresa"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Gerencie os dados e limites desta conta.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nome da Empresa</label>
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
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Telefone Comercial</label>
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
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Limite de Usuários</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.maxUsers}
                    onChange={e => setFormData({...formData, maxUsers: parseInt(e.target.value) || 1})}
                    className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all font-mono-custom"
                    style={{ borderColor: "var(--border)" }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Plano</label>
                  <select 
                    value={formData.activePlan}
                    onChange={e => setFormData({...formData, activePlan: e.target.value})}
                    className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Pagamento</label>
                  <select 
                    value={formData.paymentStatus}
                    onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                    className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="ACTIVE">Em dia (Ativo)</option>
                    <option value="OVERDUE">Atrasado</option>
                    <option value="SUSPENDED">Suspenso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                  Limite Personalizado de Instâncias do WhatsApp (Opcional)
                </label>
                <input 
                  type="number"
                  min="1"
                  value={formData.customMaxWhatsAppInstances || ""}
                  onChange={e => setFormData({...formData, customMaxWhatsAppInstances: e.target.value})}
                  placeholder="Deixe em branco para usar o limite do plano"
                  className="w-full bg-[var(--background)] dark:bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all font-mono-custom"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

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

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : (editingId ? "Salvar Alterações" : "Salvar Empresa")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
