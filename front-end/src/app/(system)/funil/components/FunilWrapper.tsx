"use client";

import { useState, useMemo } from "react";
import { useFunil } from "../hooks/useFunil";
import { FunilHeader } from "./FunilHeader";
import { FunilBoard } from "./FunilBoard";
import { StageKey } from "../types/funil";
import { CheckCircle2, Zap } from "lucide-react";
import { NewLeadModal } from "./NewLeadModal";

interface FunilWrapperProps {
  tenantId: string;
  token: string;
}

export function FunilWrapper({ tenantId, token }: FunilWrapperProps) {
  const { board, stats, isLoading, isRefreshing, mutate, moveLeadOptimistic } = useFunil(tenantId);
  const [search, setSearch] = useState("");
  const [filterOnline, setFilterOnline] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  const filteredBoard = useMemo(() => {
    let result = { ...board };
    if (filterOnline) {
      for (const key of Object.keys(result) as StageKey[]) {
        result[key] = result[key].filter(c => c.status === 'online');
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      for (const key of Object.keys(result) as StageKey[]) {
        result[key] = result[key].filter(c =>
          (c.name || '').toLowerCase().includes(q) || c.phone.includes(q)
        );
      }
    }
    return result;
  }, [board, search, filterOnline]);

  const totalCards = useMemo(() => Object.values(board).reduce((a, b) => a + b.length, 0), [board]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground animate-pulse">Carregando funil de vendas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] min-h-0">
      <FunilHeader 
        search={search}
        setSearch={setSearch}
        filterOnline={filterOnline}
        setFilterOnline={setFilterOnline}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        isRefreshing={isRefreshing}
        onRefresh={() => mutate()}
        onOpenNewLeadModal={() => setIsNewLeadOpen(true)}
      />

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-6 bg-card border border-border px-4 py-2 rounded-xl text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Total</span>
            <span className="font-bold text-foreground">{stats.total} leads</span>
          </div>
          <div className="w-px h-8 bg-border/50"></div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Conversão</span>
            <span className="font-bold text-emerald-500 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {stats.conversion}%
            </span>
          </div>
          <div className="w-px h-8 bg-border/50"></div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Atendimento</span>
            <span className="font-bold text-blue-500">{stats.inAttendance} leads</span>
          </div>
        </div>

        <button 
          onClick={() => setShowCompleted(!showCompleted)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${showCompleted ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {showCompleted ? 'Ocultar Finalizados' : 'Exibir Finalizados'}
        </button>
      </div>

      <FunilBoard 
        board={filteredBoard}
        showCompleted={showCompleted}
        onMoveLead={moveLeadOptimistic}
        onClickCard={(id) => { window.location.href = `/chats?clientId=${id}`; }}
      />

      <NewLeadModal 
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        tenantId={tenantId}
        token={token}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
