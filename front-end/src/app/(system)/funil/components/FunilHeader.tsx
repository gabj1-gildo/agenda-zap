import { Search, Plus, Filter, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FunilHeaderProps {
  search: string;
  setSearch: (val: string) => void;
  filterOnline: boolean;
  setFilterOnline: (val: boolean) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (val: boolean) => void;
  onOpenNewLeadModal: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function FunilHeader({ 
  search, setSearch, filterOnline, setFilterOnline, 
  isFilterOpen, setIsFilterOpen, onOpenNewLeadModal,
  isRefreshing, onRefresh
}: FunilHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pt-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white shrink-0">
          <SlidersHorizontal className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Funil de Vendas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Pipeline de conversão e atendimento</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar lead (nome ou telefone)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl w-[250px] outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <Button 
          variant={isFilterOpen ? "default" : "outline"} 
          className="rounded-xl border-border h-9 px-3"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>

        <Button 
          variant="outline" 
          className="rounded-xl border-border h-9 px-3"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>

        <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white h-9" onClick={onOpenNewLeadModal}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {isFilterOpen && (
        <div className="w-full bg-card border border-border rounded-xl p-4 mt-2 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input 
              type="checkbox" 
              checked={filterOnline}
              onChange={(e) => setFilterOnline(e.target.checked)}
              className="rounded border-border text-violet-600 focus:ring-violet-500 w-4 h-4"
            />
            Apenas online
          </label>
        </div>
      )}
    </div>
  );
}
