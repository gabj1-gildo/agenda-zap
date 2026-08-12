import React from "react";
import { Filter, Zap, Search, X, SlidersHorizontal, RefreshCw, Plus } from "lucide-react";

interface FunilHeaderProps {
  stats: { total: number; conversion: number; inAttendance: number; finalizados: number };
  search: string;
  setSearch: (val: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (val: boolean) => void;
  filterOnline: boolean;
  setFilterOnline: (val: boolean) => void;
  onRefresh: () => void;
  onNewLead: () => void;
}

export function FunilHeader({
  stats,
  search,
  setSearch,
  isFilterOpen,
  setIsFilterOpen,
  filterOnline,
  setFilterOnline,
  onRefresh,
  onNewLead
}: FunilHeaderProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-[18px] mb-[20px] flex-wrap">
        <div className="flex items-center gap-[12px]">
          <div className="w-[42px] h-[42px] rounded-[12px] shrink-0 bg-gradient-to-br from-[var(--violet)] to-[#6d28d9] flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(139,92,246,.55)]">
            <Filter className="w-[20px] h-[20px] text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-[21px] tracking-[-.2px] m-0 leading-tight">Pipeline</h1>
            <p className="text-[12.5px] text-[var(--muted-foreground)] mt-[2px] m-0">Gerencie e converta seus leads</p>
          </div>
        </div>
        
        <div className="flex items-center gap-[10px]">
          <div className="relative w-[250px]">
            <Search className="absolute left-[11px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--muted-foreground)]" />
            <input 
              type="text" 
              placeholder="Buscar leads..." 
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-[13px] p-[9px_40px_9px_34px] rounded-[10px] outline-none transition-colors duration-150 focus:border-[var(--violet-line)] focus:bg-[var(--surface-3)] placeholder:text-[var(--muted-foreground)]"
            />
            <span className="absolute right-[9px] top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted-foreground)] border border-[var(--border)] rounded-[5px] p-[1px_5px] font-mono-custom">
              ⌘K
            </span>
          </div>
          <button className="w-[36px] h-[36px] rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted-foreground)] flex items-center justify-center cursor-pointer relative transition-all duration-150 shrink-0 hover:text-[var(--text)] hover:border-[var(--violet-line)] active:scale-95">
            <Zap className="w-[16px] h-[16px]" />
            <span className="absolute top-[6px] right-[6px] w-[6px] h-[6px] rounded-full bg-[#f43f5e] border-[1.5px] border-[var(--surface-2)]"></span>
          </button>
        </div>
      </div>

      <div className="flex gap-[12px] mb-[20px] flex-wrap items-stretch">
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-[14px_15px] flex items-center gap-[12px] min-w-[150px] transition-all duration-250 hover:-translate-y-[2px]">
          <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0 bg-[var(--violet-soft)] text-[var(--violet)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z"/></svg>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.6px] uppercase text-[var(--muted-foreground)] font-semibold">Ativos no funil</div>
            <div className="font-display font-bold text-[20px] m-[1px_0_2px] leading-tight">{stats.total}</div>
          </div>
        </div>
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-[14px_15px] flex items-center gap-[12px] min-w-[150px] transition-all duration-250 hover:-translate-y-[2px]">
          <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0 bg-[rgba(34,197,94,.14)] text-[#22c55e]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.6px] uppercase text-[var(--muted-foreground)] font-semibold">Conversão</div>
            <div className="font-display font-bold text-[20px] m-[1px_0_2px] leading-tight">{stats.conversion}%</div>
          </div>
        </div>
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-[14px_15px] flex items-center gap-[12px] min-w-[150px] transition-all duration-250 hover:-translate-y-[2px]">
          <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0 bg-[rgba(59,130,246,.14)] text-[#3b82f6]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.6px] uppercase text-[var(--muted-foreground)] font-semibold">Em atendimento</div>
            <div className="font-display font-bold text-[20px] m-[1px_0_2px] leading-tight">{stats.inAttendance}</div>
          </div>
        </div>
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-[14px_15px] flex items-center gap-[12px] min-w-[150px] transition-all duration-250 hover:-translate-y-[2px]">
          <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0 bg-[rgba(34,197,94,.10)] text-[#16a34a]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.6px] uppercase text-[var(--muted-foreground)] font-semibold">Finalizados</div>
            <div className="font-display font-bold text-[20px] m-[1px_0_2px] leading-tight">{stats.finalizados}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[8px] mb-[16px] flex-wrap">
        <div className="flex items-center gap-[8px] p-[9px_12px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] flex-1 min-w-[160px] max-w-[300px]">
          <Search className="w-[14px] h-[14px] text-[var(--muted-foreground)] shrink-0" />
          <input
            type="text"
            placeholder="Buscar leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-[13px] text-[var(--text)] flex-1 min-w-0"
          />
          {search && (
            <button onClick={() => setSearch('')} className="bg-transparent border-none cursor-pointer text-[var(--muted-foreground)] flex">
              <X className="w-[12px] h-[12px]" />
            </button>
          )}
        </div>

        <div className="relative">
          <button
            className={`flex items-center gap-[7px] text-[12.5px] font-semibold p-[10px_14px] rounded-[10px] border bg-[var(--surface)] cursor-pointer transition-all duration-150 whitespace-nowrap hover:bg-[var(--surface-2)] active:scale-97 ${filterOnline ? 'border-[var(--violet)] text-[var(--violet)]' : 'border-[var(--border)] text-[var(--text)]'}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <SlidersHorizontal className="w-[14px] h-[14px]" />
            Filtros {filterOnline && <span className="bg-[var(--violet)] text-white rounded-full w-[16px] h-[16px] text-[10px] flex items-center justify-center">1</span>}
          </button>
          {isFilterOpen && (
            <div className="absolute top-full left-0 mt-[8px] bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-[14px] z-20 min-w-[200px] shadow-[0_8px_24px_rgba(0,0,0,.15)]">
              <div className="text-[11px] font-bold text-[var(--muted-foreground)] mb-[10px] uppercase tracking-[1px]">Status</div>
              <label className="flex items-center gap-[8px] text-[12.5px] cursor-pointer mb-[8px]">
                <input type="checkbox" checked={filterOnline} onChange={e => setFilterOnline(e.target.checked)} />
                Online agora
              </label>
              <button
                onClick={() => { setFilterOnline(false); setIsFilterOpen(false); }}
                className="text-[11px] text-[var(--muted-foreground)] bg-transparent border-none cursor-pointer mt-[4px]"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        <button 
          className="flex items-center gap-[7px] text-[12.5px] font-semibold p-[10px_14px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] cursor-pointer transition-all duration-150 whitespace-nowrap hover:bg-[var(--surface-2)] active:scale-97" 
          onClick={onRefresh}
        >
          <RefreshCw className="w-[14px] h-[14px]" />
          Atualizar
        </button>

        <button
          onClick={onNewLead}
          className="flex items-center gap-[6px] p-[6px_14px] rounded-[10px] border-none bg-gradient-to-br from-[var(--amber)] to-[var(--violet)] text-white font-semibold text-[12.5px] cursor-pointer transition-all duration-150 shadow-[0_8px_20px_-8px_rgba(139,92,246,.5)] hover:brightness-110 active:scale-97"
        >
          <Plus className="w-[14px] h-[14px]" />
          Novo Lead
        </button>
      </div>
    </>
  );
}
