import { AppointmentActions } from "@/components/AppointmentActions";
import { Countdown } from "@/components/Countdown";

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

export function AppointmentsTable({ appointments, tenantId, token, isLoading }: { appointments: any[], tenantId: string, token: string, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border overflow-hidden mt-6 p-12 text-center text-muted-foreground flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      style={{ borderColor: "var(--border)" }}
      className="bg-card rounded-2xl border overflow-hidden mt-6"
    >
      <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[700px] border-collapse">
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
            {appointments.length > 0 ? (
              appointments.map((apt: any) => {
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
                  Nenhum agendamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
