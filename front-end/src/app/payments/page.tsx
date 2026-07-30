import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ChargeButton } from "@/components/ChargeButton";
import { getBackendUrl } from "@/lib/api";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getPaymentHistory(tenantId?: string) {
  if (!tenantId) return [];
  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";
    const res = await fetch(getBackendUrl(`/api/payments/history?tenantId=${tenantId}`), {
      headers: { cookie, "tenant-id": tenantId },
      cache: "no-store",
    });
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  Pago:      { label: "Pago",      cls: "stamp stamp-paid"    },
  Pendente:  { label: "Pendente",  cls: "stamp stamp-pending" },
  Cancelado: { label: "Cancelado", cls: "stamp stamp-late"    },
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session as any)?.tenantId;

  const transactions = await getPaymentHistory(tenantId);

  const totalRevenue = transactions
    .filter((t: any) => t.status === "Pago")
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0);

  const pendingRevenue = transactions
    .filter((t: any) => t.status === "Pendente")
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0);

  const late = transactions.filter((t: any) => t.status === "Cancelado").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Financeiro
        </p>
        <h1 className="font-display font-extrabold text-4xl text-foreground">
          Pagamentos
        </h1>
      </div>



      {/* Summary cards */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: "Pendente",           value: `R$ ${pendingRevenue.toFixed(2).replace(".", ",")}`, color: "var(--warning)" },
          { label: "Recebido este mês",  value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`,   color: "var(--success)"      },
          { label: "Total de cobranças", value: transactions.length.toString(),                       color: "var(--foreground)" },
        ].map((s) => (
          <div
            key={s.label}
            style={{ borderColor: "var(--border)" }}
            className="flex-1 min-w-[160px] bg-card border rounded-2xl p-5 hover-scale"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              {s.label}
            </div>
            <div className="stat-value" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{ borderColor: "var(--border)" }}
        className="bg-card rounded-2xl border overflow-hidden"
      >
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-display font-extrabold text-lg text-foreground">
            Histórico de cobranças
          </h2>
          <span className="font-mono-custom text-xs text-muted-foreground">
            {transactions.length} registros
          </span>
        </div>

        <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0"><table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
              {["Cliente / Serviço", "Data", "ID Transação", "Valor", "Status", ""].map((h) => (
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
            {transactions.length > 0 ? (
              transactions.map((t: any) => {
                const cfg = statusConfig[t.status] ?? { label: t.status, cls: "stamp" };
                return (
                  <tr
                    key={t.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{ background: "var(--muted-foreground)", color: "#fff" }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        >
                          {(t.clientName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{t.clientName}</div>
                          <div className="text-xs text-muted-foreground">{t.service}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono-custom text-xs text-muted-foreground">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-5 py-3.5 font-mono-custom text-xs text-muted-foreground">
                      {t.paymentId || "—"}
                    </td>
                    <td className="px-5 py-3.5 font-mono-custom text-sm font-bold text-foreground">
                      R$ {Number(t.amount).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cfg.cls}>{cfg.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ChargeButton appointmentId={t.id} status={t.status} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-16 text-sm text-muted-foreground">
                  Nenhuma transação registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
