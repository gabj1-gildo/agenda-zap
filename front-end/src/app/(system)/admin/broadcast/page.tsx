"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  Megaphone, Send, Filter, Building2, Users, FileText, Plus, Trash2, 
  CheckCircle, RefreshCw, BookmarkPlus, Layers, ShieldAlert 
} from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminBroadcastPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const [sending, setSending] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);

  // Formulário de Disparo
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"ALL" | "TENANTS" | "USERS" | "SPECIFIC_TENANTS">("ALL");
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>(["FREE", "PRO", "ENTERPRISE"]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>(["ACTIVE", "OVERDUE", "SUSPENDED"]);
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "DELETED" | "ALL">("ACTIVE");

  // Dados auxiliares (Lista de Empresas e Templates)
  const [allTenants, setAllTenants] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [tenantSearch, setTenantSearch] = useState("");

  // Modais
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Carregar empresas e templates salvos ao abrir a página
  useEffect(() => {
    if (!token) return;

    const loadInitialData = async () => {
      setLoadingTenants(true);
      try {
        const [resTenants, resTemplates] = await Promise.all([
          fetch(getBackendUrl("/api/admin/tenants?status=all"), {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(getBackendUrl("/api/admin/broadcast-templates"), {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const jsonTenants = await resTenants.json();
        const jsonTemplates = await resTemplates.json();

        if (jsonTenants.success) setAllTenants(jsonTenants.data || []);
        if (jsonTemplates.success) setTemplates(jsonTemplates.data || []);
      } catch (e) {
        toast.error("Erro ao carregar dados auxiliares");
      } finally {
        setLoadingTenants(false);
      }
    };

    loadInitialData();
  }, [token]);

  // Recalcular estimativa de destinatários quando os filtros mudarem
  const estimateRecipients = async () => {
    if (!token) return;
    setEstimating(true);
    try {
      const res = await fetch(getBackendUrl("/api/admin/broadcast-whatsapp"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          target,
          tenantIds: selectedTenantIds,
          plans: selectedPlans,
          paymentStatus: selectedPaymentStatuses,
          statusFilter,
          estimateOnly: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setEstimatedCount(data.count);
      }
    } catch (e) {
      console.error("Erro ao estimar destinatários", e);
    } finally {
      setEstimating(false);
    }
  };

  useEffect(() => {
    estimateRecipients();
  }, [target, selectedTenantIds, selectedPlans, selectedPaymentStatuses, statusFilter]);

  // Handler de Envio
  const executeBroadcast = async () => {
    if (!token) return;
    setSending(true);
    try {
      const res = await fetch(getBackendUrl("/api/admin/broadcast-whatsapp"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message,
          target,
          tenantIds: selectedTenantIds,
          plans: selectedPlans,
          paymentStatus: selectedPaymentStatuses,
          statusFilter
        })
      });

      const json = await res.json();

      if (res.ok && json.success) {
        toast.success(json.message || "Disparo concluído!");
        setMessage("");
      } else {
        toast.error(json.message || "Erro ao realizar disparo");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setSending(false);
      setShowConfirm(false);
    }
  };

  // Gerenciamento de Templates
  const handleSaveTemplate = async () => {
    if (!newTemplateTitle.trim() || !message.trim()) {
      return toast.error("Preencha o título e a mensagem antes de salvar o template.");
    }
    setSavingTemplate(true);
    try {
      const res = await fetch(getBackendUrl("/api/admin/broadcast-templates"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTemplateTitle, content: message })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Template de disparo salvo com sucesso!");
        setTemplates(prev => [data.data, ...prev]);
        setNewTemplateTitle("");
        setShowTemplateModal(false);
      } else {
        toast.error(data.message || "Erro ao salvar template.");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const res = await fetch(getBackendUrl(`/api/admin/broadcast-templates?id=${templateId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Template excluído!");
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      } else {
        toast.error(data.message || "Erro ao excluir template.");
      }
    } catch (e) {
      toast.error("Erro ao excluir template.");
    }
  };

  // Handlers para Filtros de Checkbox
  const togglePlan = (plan: string) => {
    setSelectedPlans(prev => 
      prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]
    );
  };

  const togglePaymentStatus = (status: string) => {
    setSelectedPaymentStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenantIds(prev => 
      prev.includes(tenantId) ? prev.filter(id => id !== tenantId) : [...prev, tenantId]
    );
  };

  const filteredTenantsList = allTenants.filter(t => 
    t.name?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.id?.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Modal de Confirmação */}
      <ConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmar Disparo de Mensagens"
        description={`Você está prestes a enviar este disparo para aproximadamente ${estimatedCount ?? 0} destinatário(s). Deseja continuar?`}
        onConfirm={executeBroadcast}
        confirmText={sending ? "Enviando..." : "Disparar Agora"}
      />

      {/* Grid Principal: Formulário + Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Coluna da Esquerda (2 Terços): Mensagem e Templates */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  Nova Mensagem de Disparo
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Redija o conteúdo ou selecione um template do sistema.
                </p>
              </div>

              {/* Seletor de Templates Rápidos */}
              {templates.length > 0 && (
                <div className="w-full sm:w-auto">
                  <select
                    onChange={(e) => {
                      const selected = templates.find(t => t.id === e.target.value);
                      if (selected) setMessage(selected.content);
                    }}
                    defaultValue=""
                    className="w-full border border-border rounded-xl px-3 py-1.5 text-xs bg-background text-foreground font-medium"
                  >
                    <option value="" disabled>Carregar Template Salvo...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Campo da Mensagem */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo da Mensagem</Label>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  disabled={!message.trim()}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 disabled:opacity-40"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" /> Salvar como Template
                </button>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite a mensagem para envio em massa..."
                required
                rows={8}
                className="w-full border border-border rounded-xl p-4 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-y font-sans"
              />
              <p className="text-[11px] text-muted-foreground">
                Dica: O WhatsApp enviará o texto exatamente com as quebras de linha formatadas acima.
              </p>
            </div>

            {/* Estimativa de Destinatários & Botão de Envio */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold text-primary w-full sm:w-auto justify-center">
                <Users className="w-4 h-4" />
                <span>
                  {estimating ? "Calculando..." : `${estimatedCount ?? 0} destinatário(s) selecionados`}
                </span>
                <button 
                  type="button" 
                  onClick={estimateRecipients}
                  className="p-1 hover:bg-primary/20 rounded-md transition-colors"
                  title="Atualizar estimativa"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${estimating ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <Button
                onClick={() => setShowConfirm(true)}
                disabled={sending || !message.trim() || estimatedCount === 0}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                {sending ? "Disparando..." : "Disparar Mensagem"}
              </Button>
            </div>

          </div>

          {/* Gerenciador de Templates do Sistema */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Templates de Disparo do Sistema
            </h3>
            
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum template salvo ainda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((tmpl) => (
                  <div key={tmpl.id} className="p-3.5 bg-muted/20 border border-border rounded-xl flex flex-col justify-between gap-3 group">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{tmpl.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{tmpl.content}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                      <button
                        onClick={() => setMessage(tmpl.content)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Usar Template
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tmpl.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-600 ml-2"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Coluna da Direita (1 Terço): Filtros Avançados */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6 sticky top-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Filtros de Destinatários
              </h3>
            </div>

            {/* 1. Alvo do Envio */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Público Alvo</Label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as any)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="ALL">Todas as Empresas e Usuários</option>
                <option value="TENANTS">Apenas Telefones das Empresas</option>
                <option value="USERS">Apenas Telefones dos Usuários</option>
                <option value="SPECIFIC_TENANTS">Empresas Específicas</option>
              </select>
            </div>

            {/* Seletor de Empresas Específicas (Exibido quando SPECIFIC_TENANTS está selecionado ou para filtrar) */}
            {target === 'SPECIFIC_TENANTS' && (
              <div className="space-y-2 border-t border-border pt-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selecione as Empresas</Label>
                <Input
                  placeholder="Buscar empresa..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="text-xs h-8"
                />
                <div className="max-h-40 overflow-y-auto border border-border rounded-xl p-2 space-y-1.5 bg-background">
                  {filteredTenantsList.map(t => (
                    <label key={t.id} className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer hover:bg-muted p-1 rounded-md">
                      <Checkbox
                        checked={selectedTenantIds.includes(t.id)}
                        onCheckedChange={() => toggleTenantSelection(t.id)}
                      />
                      <span className="truncate">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Filtro por Plano */}
            <div className="space-y-2 border-t border-border pt-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Planos das Empresas</Label>
              <div className="space-y-2">
                {["FREE", "PRO", "ENTERPRISE"].map(plan => (
                  <label key={plan} className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <Checkbox
                      checked={selectedPlans.includes(plan)}
                      onCheckedChange={() => togglePlan(plan)}
                    />
                    <span>Plano {plan}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Filtro por Situação de Pagamento */}
            <div className="space-y-2 border-t border-border pt-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Situação de Pagamento</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <Checkbox
                    checked={selectedPaymentStatuses.includes("ACTIVE")}
                    onCheckedChange={() => togglePaymentStatus("ACTIVE")}
                  />
                  <span>Em Dia (Ativo)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <Checkbox
                    checked={selectedPaymentStatuses.includes("OVERDUE")}
                    onCheckedChange={() => togglePaymentStatus("OVERDUE")}
                  />
                  <span>Atrasado</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <Checkbox
                    checked={selectedPaymentStatuses.includes("SUSPENDED")}
                    onCheckedChange={() => togglePaymentStatus("SUSPENDED")}
                  />
                  <span>Suspenso</span>
                </label>
              </div>
            </div>

            {/* 4. Filtro por Status da Empresa */}
            <div className="space-y-2 border-t border-border pt-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status da Conta</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="ACTIVE">Empresas Ativas</option>
                <option value="DELETED">Inativas / Na Lixeira</option>
                <option value="ALL">Todas (Ativas e Inativas)</option>
              </select>
            </div>

          </div>
        </div>

      </div>

      {/* Modal para Salvar Novo Template */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar Template de Disparo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título do Template</Label>
              <Input
                placeholder="Ex: Aviso de Manutenção, Promoção de Novo Plano..."
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo</Label>
              <p className="text-xs font-mono bg-muted/40 p-3 rounded-xl line-clamp-3 text-muted-foreground">{message}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
              {savingTemplate ? "Salvando..." : "Salvar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
