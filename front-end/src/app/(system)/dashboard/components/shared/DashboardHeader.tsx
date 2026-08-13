import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  role?: string;
  userName?: string;
  dateRange: string;
  setDateRange: (val: string) => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({ role, userName, dateRange, setDateRange, isRefreshing }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isRefreshing ? "animate-spin" : "animate-pulse"}`}></span> 
            {isRefreshing ? "Atualizando" : "Dashboard Ao vivo"}
          </span>
        </p>
      
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
