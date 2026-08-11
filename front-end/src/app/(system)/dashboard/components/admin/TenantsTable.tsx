import { Building2, Wifi, WifiOff, ChevronRight } from "lucide-react";
import { Tenant } from "../../types/dashboard.types";
import { formatPhone } from "@/lib/utils";

interface Props {
  tenants: Tenant[];
  activeTenantId?: string;
  onShowModal: () => void;
}

export function TenantsTable({ tenants, activeTenantId, onShowModal }: Props) {
  return (
    <div style={{ borderColor: "var(--border)" }} className="bg-card border rounded-2xl overflow-hidden">
      <div
        className="px-5 py-4 flex items-center justify-between border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="font-display font-extrabold text-lg text-foreground">Empresas cadastradas</h2>
        <span className="font-mono-custom text-xs text-muted-foreground">{tenants.length} total</span>
      </div>

      {tenants.length === 0 ? (
        <div className="p-12 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">Nenhuma empresa ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Crie a primeira empresa usando o botão acima.</p>
          <button
            onClick={onShowModal}
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
  );
}
