"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Building2, Plus, Edit, Phone, Save, X, Users, Trash, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Input } from "@/components/ui/input";

export default function TenantsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone?.includes(searchQuery)
  );

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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'active' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Ativas ({activeTab === 'active' ? filteredTenants.length : '...'})
            </button>
            <button 
              onClick={() => setActiveTab("deleted")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'deleted' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Lixeira ({activeTab === 'deleted' ? filteredTenants.length : '...'})
            </button>
          </div>
        </div>

        <div className="flex flex-1 sm:max-w-xs items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
          <Input 
            type="text"
            placeholder="Buscar por nome ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border text-sm"
          />
        </div>

        <button
          onClick={() => openModal()}
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {/* Grid container: 4 cards por linha */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">Carregando empresas...</div>
      ) : filteredTenants.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-base font-semibold text-foreground">Nenhuma empresa encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">Tente ajustar a busca ou adicione uma nova empresa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTenants.map((t) => (
            <div 
              key={t.id} 
              className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-primary/40 relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase border ${
                      t.activePlan === 'ENTERPRISE' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      t.activePlan === 'PRO' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                    }`}>
                      {t.activePlan || 'FREE'}
                    </span>
                    {t.paymentStatus === 'ACTIVE' ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ATIVO
                      </span>
                    ) : t.paymentStatus === 'OVERDUE' ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> ATRASADO
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> SUSPENSO
                      </span>
                    )}
                  </div>
                </div>

                {/* Conteúdo Principal */}
                <div>
                  <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors" title={t.name}>
                    {t.name}
                  </h3>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    ID: {t.id.slice(0, 12)}...
                  </p>
                </div>

                {/* Detalhes de Contato & Limites */}
                <div className="space-y-2 pt-2 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      {formatPhone(t.phone) || "Sem telefone"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      Limite de Usuários:
                    </span>
                    <span className="font-bold font-mono text-foreground">{t.maxUsers}</span>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas do Rodapé */}
              <div className="pt-4 mt-4 border-t border-border flex items-center gap-2">
                {activeTab === 'active' ? (
                  <>
                    <button 
                      onClick={() => openModal(t)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 border border-border rounded-xl hover:bg-muted text-foreground transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      Gerenciar
                    </button>
                    <button 
                      onClick={() => setDeleteId(t.id)}
                      className="inline-flex items-center justify-center w-9 h-9 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors shrink-0"
                      title="Mover para Lixeira"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setRestoreId(t.id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 border border-emerald-500/30 text-emerald-600 rounded-xl hover:bg-emerald-500/10 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Restaurar Empresa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
            className="w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-mono tracking-widest border-border"
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

      {/* Modal Editar/Criar Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={closeModal}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h2 className="font-extrabold text-2xl text-foreground">
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
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
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
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Limite de Usuários</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.maxUsers}
                    onChange={e => setFormData({...formData, maxUsers: parseInt(e.target.value) || 1})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
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
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
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
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="ACTIVE">Em dia (Ativo)</option>
                    <option value="OVERDUE">Atrasado</option>
                    <option value="SUSPENDED">Suspenso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Limite Personalizado de Instâncias WhatsApp (Opcional)
                </label>
                <input 
                  type="number"
                  min="1"
                  value={formData.customMaxWhatsAppInstances || ""}
                  onChange={e => setFormData({...formData, customMaxWhatsAppInstances: e.target.value})}
                  placeholder="Deixe em branco para usar o limite do plano"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> PIN de Segurança (Super Admin)
                </label>
                <input 
                  type="password" 
                  maxLength={6}
                  value={formData.superAdminPin}
                  onChange={e => setFormData({...formData, superAdminPin: e.target.value})}
                  placeholder="******"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all font-mono tracking-widest"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm"
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
