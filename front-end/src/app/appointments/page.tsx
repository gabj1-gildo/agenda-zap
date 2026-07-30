export const dynamic = "force-dynamic";

import { ExportButton } from "@/components/ExportButton";
import { getBackendUrl } from "@/lib/api";
import { Countdown } from "@/components/Countdown";
import { AppointmentActions } from "@/components/AppointmentActions";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getAppointments(tenantId: string, token: string) {
  try {
    const res = await fetch(getBackendUrl(`/api/dashboard/appointments?tenantId=${tenantId}`), {
      cache: "no-store",
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  PAGO:      { label: "Confirmado",      cls: "stamp stamp-paid"      },
  PENDENTE:  { label: "Aguardando Pagto",  cls: "stamp stamp-pending"   },
  CANCELADO: { label: "Cancelado (Falta de Pagto)", cls: "stamp stamp-late line-through opacity-80"      },
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session?.user as any)?.tenantId;

  if (!token || !tenantId) return <div>Acesso negado.</div>;

  const appointments = await getAppointments(tenantId, token);
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams.tab || "todos";
  const searchTerm = (resolvedSearchParams.search || "").toLowerCase();

  const filtered = appointments.filter((apt: any) => {
    const matchSearch =
      apt.client?.name?.toLowerCase().includes(searchTerm) ||
      apt.serviceName?.toLowerCase().includes(searchTerm);
    if (currentTab === "todos" && apt.status === "CANCELADO") return false;
    if (currentTab === "pendentes" && apt.status !== "PENDENTE") return false;
    if (currentTab === "confirmados" && apt.status !== "PAGO") return false;
    if (currentTab === "cancelados" && apt.status !== "CANCELADO") return false;
    return matchSearch;
  });

  const countPending = appointments.filter((a: any) => a.status === "PENDENTE").length;
  const countConfirmed = appointments.filter((a: any) => a.status === "PAGO").length;
  const countCanceled = appointments.filter((a: any) => a.status === "CANCELADO").length;
  const countTodos = appointments.length - countCanceled;

  const tabs = [
    { key: "todos",      label: "Todos",      count: countTodos },
    { key: "pendentes",  label: "Aguardando Pagto",  count: countPending },
    { key: "confirmados",label: "Confirmados",count: countConfirmed },
    { key: "cancelados", label: "Cancelados", count: countCanceled },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Agenda
          </p>
          <h1 className="font-display font-extrabold text-4xl text-foreground">
            Agendamentos
          </h1>
        </div>
        <ExportButton data={filtered} />
      </div>

      {/* Stat mini cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Válido",value: countTodos,          color: "var(--foreground)" },
          { label: "Aguardando",  value: countPending,        color: "var(--warning)" },
          { label: "Confirmados", value: countConfirmed,      color: "var(--success)"      },
          { label: "Cancelados",  value: countCanceled,       color: "var(--destructive)"        },
        ].map((s) => (
          <div
            key={s.label}
            style={{ borderColor: "var(--border)" }}
            className="bg-card border rounded-2xl p-4 hover-scale"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {s.label}
            </div>
            <div
              className="stat-value mt-2"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
          className="flex rounded-xl p-1 gap-1"
        >
          {tabs.map((t) => (
            <a
              key={t.key}
              href={`?tab=${t.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentTab === t.key
                  ? "bg-ink text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 font-mono-custom text-[10px] opacity-60">
                  {t.count}
                </span>
              )}
            </a>
          ))}
        </div>

        <form action="/appointments" method="GET" className="relative">
          <input type="hidden" name="tab" value={currentTab} />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            name="search"
            type="text"
            placeholder="Buscar cliente ou serviço..."
            defaultValue={searchTerm}
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
            className="pl-9 pr-4 py-2 text-sm border rounded-xl w-64 outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </form>
      </div>

      {/* Table */}
      <div
        style={{ borderColor: "var(--border)" }}
        className="bg-card rounded-2xl border overflow-hidden"
      >
        <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0"><table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
              {["Data e Hora", "Cliente", "Serviço", "Valor", "Status", "Ações"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((apt: any) => {
                const cfg = statusConfig[apt.status] ?? { label: apt.status, cls: "stamp" };
                return (
                  <tr
                    key={apt.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono-custom text-xs text-muted-foreground">
                      {formatDate(apt.date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{ background: "var(--muted-foreground)", color: "#fff" }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        >
                          {(apt.client?.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {apt.client?.name || "Desconhecido"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {apt.serviceName || apt.service || "—"}
                    </td>
                    <td className="px-5 py-3.5 font-mono-custom text-sm font-bold text-foreground">
                      {apt.price ? `R$ ${Number(apt.price).toFixed(2).replace(".", ",")}` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cfg.cls}>{cfg.label}</span>
                      {apt.status === 'PENDENTE' && apt.expiresAt && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground">Expira: {formatDate(apt.expiresAt)}</span>
                          <Countdown expiresAt={apt.expiresAt} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <AppointmentActions appointmentId={apt.id} tenantId={tenantId} token={token} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-sm text-muted-foreground"
                >
                  Nenhum agendamento nesta visualização.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
