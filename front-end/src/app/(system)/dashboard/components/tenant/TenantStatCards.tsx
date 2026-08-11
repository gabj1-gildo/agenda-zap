import { Activity, CheckCircle2, Clock, Ban, DollarSign, Users, BrainCircuit, TrendingUp } from "lucide-react";
import { DashboardMetrics } from "../../types/dashboard.types";

interface Props {
  metrics: DashboardMetrics;
  role?: string;
}

export function TenantStatCards({ metrics, role }: Props) {
  if (role === "ATTENDANT") {
    return (
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
    );
  }

  return (
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
  );
}
