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
    <div className="flex flex-col gap-6 mb-6 pt-2">
      {/* 1. TITLE ROW */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pipeline de leads</p>
        </div>
      </div>

      {/* 2. TOOLBAR ROW */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl w-[250px] outline-none focus:border-violet-500 transition-colors shadow-sm"
          />
        </div>

        <Button 
          variant={isFilterOpen ? "default" : "outline"} 
          className="rounded-xl border-border h-9 px-4 shadow-sm bg-card"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>

        <Button 
          variant="outline" 
          className="rounded-xl border-border h-9 px-4 shadow-sm bg-card"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>

        <Button className="rounded-xl bg-blue-500 hover:bg-blue-600 shadow-sm text-white h-9 px-4" onClick={onOpenNewLeadModal}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {isFilterOpen && (
        <div className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input 
              type="checkbox" 
              checked={filterOnline}
              onChange={(e) => setFilterOnline(e.target.checked)}
              className="rounded border-border text-blue-500 focus:ring-blue-500 w-4 h-4"
            />
            Apenas online
          </label>
        </div>
      )}
    </div>
  );
}
