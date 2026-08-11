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
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
          {role === "ATTENDANT" ? "Área de Trabalho" : "Visão Geral"}
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px]">
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isRefreshing ? "animate-spin" : "animate-pulse"}`}></span> 
            {isRefreshing ? "Atualizando" : "Ao vivo"}
          </span>
        </p>
        <h1 className="font-display font-extrabold text-4xl text-foreground">
          {role === "ATTENDANT" ? `Olá, ${(userName)?.split(' ')[0] || 'Atendente'}!` : "Painel"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {role === "ATTENDANT" ? "Acompanhe o resumo das suas operações no período." : "Acompanhe seus indicadores."}
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
  );
}
