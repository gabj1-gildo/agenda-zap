import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  role?: string;
  userName?: string;
  dateRange: string;
  setDateRange: (val: string) => void;
  isRefreshing?: boolean;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatEyebrowDate() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export function DashboardHeader({ userName, dateRange, setDateRange, isRefreshing }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{formatEyebrowDate()}</p>
        <h1 className="text-2xl sm:text-[27px] font-bold tracking-tight leading-tight text-foreground">
          {getGreeting()}, {userName?.split(" ")[0] || ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe o ritmo da sua operação hoje.</p>
        <span
          className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-full text-[11px] font-bold"
          style={{ background: "var(--sage-muted)", color: "var(--sage)" }}
        >
          <span className={`w-2 h-2 rounded-full ${isRefreshing ? "animate-spin" : "animate-pulse"}`} style={{ background: "var(--sage)" }} />
          {isRefreshing ? "Atualizando" : "Ao vivo"}
        </span>
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
  );
}
