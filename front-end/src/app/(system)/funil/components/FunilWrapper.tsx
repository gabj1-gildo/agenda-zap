"use client";

import { useState, useMemo } from "react";
import { useFunil } from "../hooks/useFunil";
import { FunilHeader } from "./FunilHeader";
import { FunilBoard } from "./FunilBoard";
import { StageKey } from "../types/funil";
import { CheckCircle2, Zap, TrendingUp, Filter, User } from "lucide-react";
import { NewLeadModal } from "./NewLeadModal";
import { FunilDistribution } from "./FunilDistribution";

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
    <div className="flex flex-col h-[calc(100vh-60px)] min-h-0 bg-[#faf9f6]">
      <div className="p-4 flex-1 flex flex-col min-h-0 max-w-[1600px] w-full mx-auto">
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

        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Ativos no Funil</p>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Conversão</p>
              <p className="text-xl font-bold text-foreground">{stats.conversion}%</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Em Atendimento</p>
              <p className="text-xl font-bold text-foreground">{stats.inAttendance}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 relative z-10">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Finalizados</p>
              <p className="text-xl font-bold text-foreground">{stats.finalizados}</p>
            </div>
          </div>
        </div>

        {/* DISTRIBUTION BAR */}
        <FunilDistribution board={board} total={stats.total} />

        {/* BOARD */}
        <div className="flex-1 min-h-0">
          <FunilBoard 
            board={filteredBoard}
            showCompleted={showCompleted}
            onMoveLead={moveLeadOptimistic}
            onClickCard={(id) => { window.location.href = `/chats?clientId=${id}`; }}
          />
        </div>
      </div>

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
