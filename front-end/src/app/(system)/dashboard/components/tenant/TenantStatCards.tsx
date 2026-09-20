import { DashboardMetrics } from "../../types/dashboard.types";

interface Props {
  metrics: DashboardMetrics;
  role?: string;
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

type MetricDef = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  accent: string;
};

function MetricCard({ label, value, hint, accent }: Omit<MetricDef, "key">) {
  return (
    <div
      className="bg-card border rounded-xl p-4 sm:p-5 shadow-sm"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--muted-text)" }}>
        {label}
        {hint && (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
          >
            {hint}
          </span>
        )}
      </div>
      <div className="mt-1 text-[20px] sm:text-[22px] font-bold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

export function TenantStatCards({ metrics, role }: Props) {
  const sage = "var(--sage)";
  const clay = "var(--terracotta)";
  const ochre = "var(--yellow)";

  const cards: MetricDef[] =
    role === "ATTENDANT"
      ? [
          { key: "totais", label: "Atendimentos", value: String(metrics.appointmentsCount), accent: sage },
          { key: "pagos", label: "Pagos", value: String(metrics.atendimentosPagos), accent: sage },
          { key: "pendentes", label: "Pendentes", value: String(metrics.atendimentosPendentes), accent: ochre },
          { key: "cancelados", label: "Cancelados", value: String(metrics.atendimentosCancelados), accent: "var(--red)" },
        ]
      : [
          { key: "faturamento", label: "Faturamento", value: fmtBRL(metrics.faturamento), hint: "hoje", accent: sage },
          { key: "agendamentos", label: "Agendamentos", value: String(metrics.appointmentsCount), accent: sage },
          { key: "contatos", label: "Novos contatos", value: String(metrics.novosClientes), accent: clay },
          { key: "pendentes", label: "Pendentes", value: String(metrics.atendimentosPendentes), accent: ochre },
        ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => (
        <MetricCard key={c.key} label={c.label} value={c.value} hint={c.hint} accent={c.accent} />
      ))}
    </div>
  );
}
