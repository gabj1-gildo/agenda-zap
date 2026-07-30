"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Building2, Wifi, WifiOff, ChevronRight, X, Smartphone, TrendingUp, DollarSign, Database, Activity, CheckCircle2, Clock, Ban, Users, BrainCircuit, CalendarIcon } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { formatPhone } from "@/lib/utils";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";

type Tenant = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  evolutionInstanceStatus: string | null;
  createdAt: string;
};

function CreateTenantModal({ onClose, onCreated, token }: { onClose: () => void; onCreated: (t: Tenant) => void; token?: string }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getBackendUrl('/api/tenants'), {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Empresa criada com sucesso!");
        onCreated(data.data);
        onClose();
      } else {
        toast.error(data.message || "Erro ao criar empresa");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div
        style={{ borderColor: "var(--border)" }}
        className="bg-card rounded-3xl border shadow-2xl w-full max-w-md p-8 relative"
      >
        <button
          onClick={onClose}
          style={{ color: "var(--muted-foreground)" }}
          className="absolute top-5 right-5 hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          >
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-foreground">Nova Empresa</h2>
          <p className="text-sm text-muted-foreground mt-1">Crie o acesso para uma nova empresa na plataforma.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {[
            { key: "name", label: "Nome da empresa", placeholder: "Ex: Bela Hair Studio", type: "text" },
            { key: "email", label: "Email de acesso", placeholder: "empresa@email.com", type: "email" },
            { key: "password", label: "Senha inicial", placeholder: "Mínimo 6 caracteres", type: "password" },
            { key: "phone", label: "Telefone (opcional)", placeholder: "+55 11 9xxxx-xxxx", type: "tel" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                {label}
              </label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: key === "phone" ? formatPhone(e.target.value) : e.target.value })}
                placeholder={key === "phone" ? "+55 (11) 9 9999-9999" : placeholder}
                maxLength={key === "phone" ? 21 : undefined}
                required={key !== "phone"}
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            className="w-full py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
          >
            {loading ? "Criando..." : "Criar Empresa"}
          </button>
        </form>
      </div>
    </div>
  );
}

function TenantDashboardContent({ tenantId, token, role, userName }: { tenantId: string, token?: string, role?: string, userName?: string }) {
  const [metrics, setMetrics] = useState({ 
    faturamento: 0, 
    appointmentsCount: 0,
    atendimentosPagos: 0,
    atendimentosPendentes: 0,
    atendimentosCancelados: 0,
    novosClientes: 0,
    tokensUsados: 0,
    ticketMedio: 0,
    taxaConversao: 0,
    conversasAtivas: 0,
    chartData: [] as any[],
    kanbanClients: [] as any[] 
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("Mes");

  useEffect(() => {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let start = new Date();
    let end = new Date();

    if (dateRange === "Hoje") {
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === "7d") {
      start.setDate(start.getDate() - 7);
    } else if (dateRange === "30d") {
      start.setDate(start.getDate() - 30);
    } else if (dateRange === "Mes") {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
    } else if (dateRange === "Sempre") {
      start = new Date(0); // Desde o início
    }

    const startDateStr = start.toISOString();
    const endDateStr = end.toISOString();

    const fetchMetrics = () => {
      fetch(getBackendUrl(`/api/dashboard/metrics?tenantId=${tenantId}&startDate=${startDateStr}&endDate=${endDateStr}`), { headers })
        .then(res => res.json())
        .then(d => {
          if (d.success) setMetrics(d.data);
        })
        .finally(() => setLoading(false));
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [tenantId, token, dateRange]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
            {role === "ATTENDANT" ? "Área de Trabalho" : "Visão Geral"}
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Ao vivo
            </span>
          </p>
          <h1 className="font-display font-extrabold text-4xl text-foreground">
            {role === "ATTENDANT" ? `Olá, ${(userName)?.split(' ')[0] || 'Atendente'}!` : "Painel"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "ATTENDANT" ? "Acompanhe o resumo das suas operações de hoje." : "Acompanhe seus indicadores."}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-muted/40 p-1.5 rounded-2xl border" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 pl-3 pr-1 text-sm font-bold text-muted-foreground">
            <CalendarIcon className="w-4 h-4" />
            Visualizar:
          </div>
          <Select value={dateRange} onValueChange={(val) => val && setDateRange(val)}>
            <SelectTrigger className="w-[170px] bg-card border-none shadow-sm rounded-xl font-bold text-foreground">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hoje">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="Mes">Este Mês</SelectItem>
              <SelectItem value="Sempre">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando painel...</div>
      ) : (
        <>
          {role === "ATTENDANT" ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div style={{ borderColor: "var(--border)" }} className="bg-blue-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <Activity className="w-24 h-24 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3 relative z-10">
                  <Activity className="w-3 h-3" /> Atendimentos Totais
                </div>
                <div className="stat-value text-foreground text-3xl relative z-10">{metrics.appointmentsCount}</div>
              </div>
              <div style={{ borderColor: "var(--border)" }} className="bg-green-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <CheckCircle2 className="w-24 h-24 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-3 relative z-10">
                  <CheckCircle2 className="w-3 h-3" /> Agend. Pagos
                </div>
                <div className="stat-value text-foreground text-3xl relative z-10">{metrics.atendimentosPagos}</div>
              </div>
              <div style={{ borderColor: "var(--border)" }} className="bg-primary/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <Clock className="w-24 h-24 text-amber-600 dark:text-primary" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-primary mb-3 relative z-10">
                  <Clock className="w-3 h-3" /> Agend. Pendentes
                </div>
                <div className="stat-value text-foreground text-3xl relative z-10">{metrics.atendimentosPendentes}</div>
              </div>
              <div style={{ borderColor: "var(--border)" }} className="bg-red-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <Ban className="w-24 h-24 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-3 relative z-10">
                  <Ban className="w-3 h-3" /> Agend. Cancelados
                </div>
                <div className="stat-value text-foreground text-3xl relative z-10">{metrics.atendimentosCancelados}</div>
              </div>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {role !== "ATTENDANT" && (
              <div style={{ borderColor: "var(--border)" }} className="col-span-2 lg:col-span-1 bg-emerald-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <DollarSign className="w-24 h-24 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 relative z-10">
                  <DollarSign className="w-3 h-3" /> Faturamento
                </div>
                <div className="stat-value text-foreground text-3xl relative z-10">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.faturamento)}
                </div>
              </div>
            )}
            <div style={{ borderColor: "var(--border)" }} className="bg-green-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <CheckCircle2 className="w-24 h-24 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-3 relative z-10">
                <CheckCircle2 className="w-3 h-3" /> Agendamentos Pagos
              </div>
              <div className="stat-value text-foreground text-3xl relative z-10">{metrics.atendimentosPagos}</div>
            </div>
            <div style={{ borderColor: "var(--border)" }} className="bg-primary/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <Clock className="w-24 h-24 text-amber-600 dark:text-primary" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-primary mb-3 relative z-10">
                <Clock className="w-3 h-3" /> Agendamentos Pendentes
              </div>
              <div className="stat-value text-foreground text-3xl relative z-10">{metrics.atendimentosPendentes}</div>
            </div>
            <div style={{ borderColor: "var(--border)" }} className="bg-red-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <Ban className="w-24 h-24 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-3 relative z-10">
                <Ban className="w-3 h-3" /> Agendamentos Cancelados
              </div>
              <div className="stat-value text-foreground text-3xl relative z-10">{metrics.atendimentosCancelados}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div style={{ borderColor: "var(--border)" }} className="bg-blue-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <Activity className="w-24 h-24 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3 relative z-10">
                <Activity className="w-3 h-3" /> Atendimentos Totais
              </div>
              <div className="stat-value text-foreground text-3xl relative z-10">{metrics.appointmentsCount}</div>
            </div>
            
            {role !== "ATTENDANT" && (
              <>
                <div style={{ borderColor: "var(--border)" }} className="bg-purple-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                    <Users className="w-24 h-24 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 relative z-10">
                    <Users className="w-3 h-3" /> Novos Clientes
                  </div>
                  <div className="stat-value text-foreground text-3xl relative z-10">{metrics.novosClientes}</div>
                </div>

                <div style={{ borderColor: "var(--border)" }} className="bg-indigo-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                    <BrainCircuit className="w-24 h-24 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 relative z-10">
                    <BrainCircuit className="w-3 h-3" /> IA Tokens Gastos
                  </div>
                  <div className="stat-value text-foreground text-3xl relative z-10">{metrics.tokensUsados.toLocaleString('pt-BR')}</div>
                </div>

                <div style={{ borderColor: "var(--border)" }} className="bg-emerald-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                    <DollarSign className="w-24 h-24 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 relative z-10">
                    <DollarSign className="w-3 h-3" /> Ticket Médio
                  </div>
                  <div className="stat-value text-foreground text-3xl relative z-10">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.ticketMedio || 0)}</div>
                </div>

                <div style={{ borderColor: "var(--border)" }} className="bg-purple-500/10 border rounded-2xl p-6 hover-scale relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                    <TrendingUp className="w-24 h-24 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 relative z-10">
                    <TrendingUp className="w-3 h-3" /> Conversão
                  </div>
                  <div className="stat-value text-foreground text-3xl relative z-10">{(metrics.taxaConversao || 0).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1 relative z-10">De {metrics.conversasAtivas} conversas ativas</div>
                </div>
              </>
            )}
          </div>
            </>
          )}

          {/* Gráfico */}
          <div style={{ borderColor: "var(--border)" }} className="bg-card border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-display font-extrabold text-lg text-foreground">Evolução no Período</h2>
            </div>
            
            {metrics.chartData && metrics.chartData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={10}>
                  <BarChart data={metrics.chartData}>
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    {role !== "ATTENDANT" && <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} dx={-10} />}
                    <YAxis yAxisId="right" orientation={role !== "ATTENDANT" ? "left" : "right"} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dx={role !== "ATTENDANT" ? -10 : 10} />
                    <Tooltip 
                      cursor={false}
                      shared={false}
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    {role !== "ATTENDANT" && <Bar yAxisId="left" name="Faturamento (R$)" dataKey="faturamento" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />}
                    <Bar yAxisId="right" name="Qtd. Atendimentos" dataKey="atendimentos" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] w-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                <Activity className="w-8 h-8 mb-2 opacity-20" />
                Nenhum dado registrado neste período.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [adminMetrics, setAdminMetrics] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const role = (session?.user as any)?.role;
  const activeTenantId = (session as any)?.tenantId;

  const token = (session?.user as any)?.accessToken;

  useEffect(() => {
    if (!token) return;

    const headers: any = { 'Authorization': `Bearer ${token}` };

    fetch(getBackendUrl('/api/tenants'), { headers })
      .then((r) => r.json())
      .then((d) => { if (d.success) setTenants(d.data); })
      .finally(() => setLoading(false));

    if (role === "SUPERADMIN" && !activeTenantId) {
      fetch(getBackendUrl('/api/admin/metrics'), { headers })
        .then(r => r.json())
        .then(d => { if(d.data) setAdminMetrics(d.data); });
    }
  }, [token, role, activeTenantId]);

  if (role === "ADMIN" || role === "ATTENDANT" || (role === "SUPERADMIN" && activeTenantId)) {
    const userName = (session?.user as any)?.name;
    return <TenantDashboardContent tenantId={activeTenantId} token={token} role={role} userName={userName} />;
  }

  const stats = [
    { label: "Empresas cadastradas", value: tenants.length.toString(), icon: Building2, colorClass: "bg-blue-500/10", textClass: "text-blue-600 dark:text-blue-400" },
    { label: "Faturamento (MRR)", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adminMetrics?.mrr || 0), icon: TrendingUp, colorClass: "bg-emerald-500/10", textClass: "text-emerald-600 dark:text-emerald-400" },
    { label: "Volume PIX", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adminMetrics?.pixVolume || 0), icon: DollarSign, colorClass: "bg-green-500/10", textClass: "text-green-600 dark:text-green-400" },
    { label: "Tokens IA Utilizados", value: (adminMetrics?.totalTokens || 0).toLocaleString('pt-BR'), icon: Database, colorClass: "bg-indigo-500/10", textClass: "text-indigo-600 dark:text-indigo-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">

      {showModal && (
        <CreateTenantModal
          onClose={() => setShowModal(false)}
          onCreated={(t) => setTenants((prev) => [t, ...prev])}
          token={token}
        />
      )}



      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Administrador da Plataforma
          </p>
          <h1 className="font-display font-extrabold text-4xl text-foreground">Painel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todas as empresas cadastradas na plataforma.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {/* Stats */}
      {!activeTenantId && (
        <div
          style={{ borderColor: "var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" }}
          className="border rounded-2xl p-4 flex items-center gap-3"
        >
          <span style={{ color: "var(--warning)" }} className="text-sm font-semibold">
            ⚠ Selecione uma empresa no topo para habilitar Agenda, Conversas e Pagamentos.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            style={{ borderColor: "var(--border)" }}
            className={`border rounded-2xl p-5 hover-scale relative overflow-hidden ${s.colorClass}`}
          >
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <s.icon className="w-24 h-24" />
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 ${s.textClass}`}>
              <s.icon className="w-3 h-3" />
              {s.label}
            </div>
            <div className="stat-value text-foreground relative z-10">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tokens Chart */}
      <div style={{ borderColor: "var(--border)" }} className="bg-card border rounded-2xl p-6 hover-scale">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display font-extrabold text-lg text-foreground">Consumo de Tokens por Empresa</h2>
        </div>
        
        {adminMetrics?.chartData && adminMetrics.chartData.length > 0 ? (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminMetrics.chartData}>
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} dx={-10} />
                <Tooltip 
                  cursor={{fill: 'var(--muted)', opacity: 0.4}} 
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Bar name="Tokens" dataKey="tokens" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] w-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            <Database className="w-8 h-8 mb-2 opacity-20" />
            Nenhum dado de token registrado ainda.
          </div>
        )}
      </div>

      {/* Tenants table */}
      <div style={{ borderColor: "var(--border)" }} className="bg-card border rounded-2xl overflow-hidden">
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-display font-extrabold text-lg text-foreground">Empresas cadastradas</h2>
          <span className="font-mono-custom text-xs text-muted-foreground">{tenants.length} total</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Nenhuma empresa ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Crie a primeira empresa usando o botão acima.</p>
            <button
              onClick={() => setShowModal(true)}
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              + Criar primeira empresa
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                {["Empresa", "Email", "WhatsApp", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const connected = t.evolutionInstanceStatus === "OPEN";
                const isSelected = activeTenantId === t.id;
                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isSelected ? "rgba(255,180,0,0.04)" : undefined,
                    }}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{ background: "var(--muted-foreground)", color: "#fff" }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                        >
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{t.name}</div>
                          {isSelected && (
                            <span
                              style={{ color: "var(--warning)" }}
                              className="text-[10px] font-bold"
                            >
                              ● Selecionada
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{t.email || "—"}</td>
                    <td className="px-5 py-3.5 font-mono-custom text-sm text-muted-foreground">
                      {formatPhone(t.phone) || <span className="text-muted-foreground/50">Não configurado</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        style={
                          connected
                            ? { color: "var(--success)", background: "var(--success-bg)" }
                            : { color: "var(--muted-foreground)", background: "var(--muted)" }
                        }
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      >
                        {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {connected ? "Conectado" : t.evolutionInstanceStatus || "Desconectado"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">

                      <a
                        href={`/settings?tenant=${t.id}`}
                        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors"
                      >
                        Gerenciar <ChevronRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
