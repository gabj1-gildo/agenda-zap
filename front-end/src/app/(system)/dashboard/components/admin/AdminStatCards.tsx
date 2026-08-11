import { Building2, TrendingUp, DollarSign, Database } from "lucide-react";
import { AdminMetrics, Tenant } from "../../types/dashboard.types";

interface Props {
  tenants: Tenant[];
  adminMetrics: AdminMetrics | null;
}

export function AdminStatCards({ tenants, adminMetrics }: Props) {
  const stats = [
    { label: "Empresas cadastradas", value: tenants.length.toString(), icon: Building2, colorClass: "bg-blue-500/10", textClass: "text-blue-600 dark:text-blue-400" },
    { label: "Faturamento (MRR)", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adminMetrics?.mrr || 0), icon: TrendingUp, colorClass: "bg-emerald-500/10", textClass: "text-emerald-600 dark:text-emerald-400" },
    { label: "Volume PIX", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adminMetrics?.pixVolume || 0), icon: DollarSign, colorClass: "bg-green-500/10", textClass: "text-green-600 dark:text-green-400" },
    { label: "Tokens IA Utilizados", value: (adminMetrics?.totalTokens || 0).toLocaleString('pt-BR'), icon: Database, colorClass: "bg-indigo-500/10", textClass: "text-indigo-600 dark:text-indigo-400" },
  ];

  return (
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
  );
}
