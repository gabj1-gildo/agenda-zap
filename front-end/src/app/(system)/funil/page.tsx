"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Smartphone, Clock, User, CheckCircle2, MoreHorizontal, ArrowRight, MessageSquare, 
  BarChart3, Search, Bell, Settings, Moon, Plus, Target, Percent, Users, DollarSign, ChevronDown, Filter, Zap, Bot, Activity
} from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { getBackendUrl } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const STAGES = [
  { id: 'espera', label: 'ESPERA', color: '#3B82F6', subtitle: 'Aguardando primeiro contato' },
  { id: 'atendimento_ia', label: 'ATENDIMENTO IA', color: '#8B5CF6', subtitle: 'Em atendimento com IA' },
  { id: 'atendimento_humano', label: 'ATEND. HUMANO', color: '#F59E0B', subtitle: 'Atendimento com atendente' },
  { id: 'aguardando_pagamento', label: 'AGUARD. PAGTO', color: '#06B6D4', subtitle: 'Aguardando pagamento' },
  { id: 'finalizado', label: 'FINALIZADO', color: '#10B981', subtitle: 'Negócios concluídos' },
  { id: 'perdido', label: 'PERDIDO', color: '#F43F5E', subtitle: 'Negócios não concluídos' }
];

const VALID_STAGES = STAGES.map(s => s.id);

export default function FunilPage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState({ kanban: [] as any[] });
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const activeTenantId = (session as any)?.tenantId;
  const token = (session?.user as any)?.accessToken;

  useEffect(() => {
    if (!activeTenantId) {
      setLoading(false);
      return;
    }
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(getBackendUrl(`/api/dashboard/metrics?tenantId=${activeTenantId}`), { headers })
      .then(res => res.json())
      .then(d => {
        if (d.success) setMetrics(d.data);
      })
      .finally(() => setLoading(false));
  }, [activeTenantId, token]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium animate-pulse">Carregando funil...</p>
        </div>
      </div>
    );
  }

  if (!activeTenantId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F19]">
        <div className="bg-[#11131E] p-8 rounded-2xl border border-white/5 flex flex-col items-center gap-3 text-center max-w-sm">
          <User className="w-12 h-12 text-slate-500 opacity-50" />
          <h2 className="text-xl font-bold text-white">Nenhuma empresa</h2>
          <p className="text-sm text-slate-400">Selecione uma empresa no topo para visualizar o funil de vendas.</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData("clientId", clientId);
    setDraggedItem(clientId);
    if (e.target instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.target, 20, 20);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const clientId = e.dataTransfer.getData("clientId");
    if (!clientId) return;

    const client = metrics.kanban.find(c => c.id === clientId);
    if (!client || client.funnelStage === stageId) return;

    const updatedClients = metrics.kanban.map((c: any) => 
      c.id === clientId ? { ...c, funnelStage: stageId } : c
    );
    setMetrics(prev => ({ ...prev, kanban: updatedClients }));

    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    try {
      const res = await fetch(getBackendUrl('/api/dashboard/clients/stage'), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ clientId, funnelStage: stageId, tenantId: activeTenantId })
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      toast.success("Estágio atualizado");
    } catch (err) {
      console.error("Error updating stage:", err);
      toast.error("Erro ao mover cliente");
      setMetrics(prev => ({ 
        ...prev, 
        kanban: prev.kanban.map(c => c.id === clientId ? client : c) 
      }));
    }
  };

  const normalizedKanban = metrics.kanban?.map(c => {
    let stage = (c.funnelStage || 'espera').toLowerCase();
    if (stage === 'lead') stage = 'espera';
    if (stage === 'em atendimento') stage = 'atendimento_ia';
    if (stage === 'aguardando pagamento') stage = 'aguardando_pagamento';
    if (stage === 'concluido') stage = 'finalizado';
    if (stage === 'expirado') stage = 'perdido';
    if (!VALID_STAGES.includes(stage)) stage = 'espera';
    return { ...c, normalizedStage: stage };
  }) || [];

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-white p-4 lg:p-6 overflow-x-hidden font-sans">
      
      {/* Topbar / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center border border-[#8B5CF6]/30">
            <BarChart3 className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Funil de Vendas
            </h1>
            <p className="text-[13px] text-slate-400">Acompanhe seus clientes e aumente suas conversões com IA.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar clientes, conversas..." 
              className="w-64 bg-[#11131E] border border-white/10 rounded-lg pl-9 pr-12 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#8B5CF6]"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
              ⌘K
            </div>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#11131E] border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#11131E] border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition">
            <Settings className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#11131E] border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition">
            <Moon className="w-4 h-4" />
          </button>
          <Avatar className="w-9 h-9 border border-white/10 ml-1">
            <AvatarFallback className="bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] text-white text-xs">SA</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* KPIs & Actions */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
          {/* KPI 1 */}
          <div className="bg-[#11131E] rounded-2xl p-4 border border-white/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total no Funil</p>
              <div className="text-2xl font-bold text-white leading-none mb-1">{metrics.kanban.length || 32}</div>
              <p className="text-[11px] font-medium text-emerald-400">+12% este mês</p>
            </div>
          </div>
          {/* KPI 2 */}
          <div className="bg-[#11131E] rounded-2xl p-4 border border-white/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Conversão Geral</p>
              <div className="text-2xl font-bold text-white leading-none mb-1">24.5%</div>
              <p className="text-[11px] font-medium text-emerald-400">+8.3% este mês</p>
            </div>
          </div>
          {/* KPI 3 */}
          <div className="bg-[#11131E] rounded-2xl p-4 border border-white/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Em Atendimento</p>
              <div className="text-2xl font-bold text-white leading-none mb-1">8</div>
              <p className="text-[11px] font-medium text-emerald-400">+3 ativos agora</p>
            </div>
          </div>
          {/* KPI 4 */}
          <div className="bg-[#11131E] rounded-2xl p-4 border border-white/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Faturamento</p>
              <div className="text-2xl font-bold text-white leading-none mb-1">R$ 12.450</div>
              <p className="text-[11px] font-medium text-emerald-400">+18% este mês</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#11131E] border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition">
            <Filter className="w-4 h-4" /> Filtros <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#11131E] border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition">
            <Clock className="w-4 h-4" /> Este mês <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] transition text-sm font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]">
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 snap-x">
        <div className="flex gap-4 h-[calc(100vh-360px)] min-h-[500px] min-w-max">
          {STAGES.map(col => {
            const colClients = normalizedKanban.filter((c: any) => c.normalizedStage === col.id);
            const isDragOver = dragOverCol === col.id;

            return (
              <div 
                key={col.id} 
                className="w-[310px] flex-shrink-0 snap-center flex flex-col h-full bg-[#11131E] rounded-2xl border border-white/5 overflow-hidden transition-all duration-200"
                style={{
                  borderColor: isDragOver ? col.color : 'rgba(255,255,255,0.05)',
                  boxShadow: isDragOver ? `0 0 0 1px ${col.color}` : 'none',
                }}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverCol(null)}
              >
                {/* Header */}
                <div className="px-4 py-4 border-b border-white/5 shrink-0 relative">
                  <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: col.color }} />
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[13px] font-bold tracking-widest uppercase" style={{ color: col.color }}>
                      {col.label}
                    </span>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: col.color }}>
                      {colClients.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{col.subtitle}</p>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
                  {colClients.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600/50 opacity-70 border border-dashed border-white/5 rounded-xl m-2">
                      <ArrowRight className="w-6 h-6 mb-2 opacity-30" />
                      <span className="text-[10px] font-medium uppercase tracking-widest">Soltar aqui</span>
                    </div>
                  ) : (
                    colClients.map((client: any) => {
                      const isDragging = draggedItem === client.id;
                      
                      return (
                        <div 
                          key={client.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, client.id)}
                          onDragEnd={handleDragEnd}
                          className={`
                            bg-[#1A1D27] border border-white/5 rounded-xl p-4 cursor-grab active:cursor-grabbing 
                            hover:border-white/20 transition-all duration-200
                            ${isDragging ? 'opacity-40 scale-95 shadow-none' : 'opacity-100'}
                          `}
                        >
                          <div className="flex flex-col gap-1 mb-3">
                            <h3 className="font-bold text-[14px] text-white truncate">
                              {client.name || client.whatsappName || 'Cliente'}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                              <Smartphone className="w-3 h-3" />
                              {formatPhone(client.phone)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              {client.funnelStage === 'atendimento_ia' ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                                </span>
                              ) : (
                                <span className="text-slate-500 font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> 
                                  há {Math.floor(Math.random() * 5) + 1}h
                                </span>
                              )}
                            </div>
                            
                            {client.funnelStage === 'atendimento_ia' && (
                              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-[#8B5CF6]/20 text-[#8B5CF6] px-2 py-0.5 rounded-md">
                                <Bot className="w-3 h-3" /> IA
                              </div>
                            )}
                            {client.funnelStage === 'espera' && (
                              <div className="w-6 h-6 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                                <MessageSquare className="w-3 h-3 text-[#25D366]" />
                              </div>
                            )}
                            {client.funnelStage === 'atendimento_humano' && (
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-orange-500/20 text-orange-500 text-[10px]">AT</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Mock Finished Card example inside Finalizado column if empty */}
                  {col.id === 'finalizado' && colClients.length === 0 && (
                     <div className="bg-gradient-to-b from-[#10B981]/10 to-[#1A1D27] border border-[#10B981]/20 rounded-xl p-6 flex flex-col items-center justify-center text-center mt-2 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Zap className="w-16 h-16 text-[#10B981]" />
                       </div>
                       <div className="w-16 h-16 rounded-full bg-[#10B981]/20 flex items-center justify-center mb-4 ring-8 ring-[#10B981]/5">
                         <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                       </div>
                       <h3 className="font-bold text-[#10B981] text-lg mb-1">Parabéns!</h3>
                       <p className="text-xs text-slate-300 mb-3">8 negócios concluídos este mês</p>
                       <p className="text-[10px] text-emerald-400 font-bold">+25% vs mês anterior</p>
                     </div>
                  )}

                </div>
                
                {/* Footer Coluna */}
                <div className="p-3 border-t border-white/5 text-center">
                  <button className="text-[11px] text-slate-500 hover:text-white transition font-bold">
                    Ver todos ({colClients.length}) &gt;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Mock Insights (Static UI matching Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 pb-10">
        
        {/* Gráfico 1 */}
        <div className="bg-[#11131E] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Activity className="w-4 h-4 text-[#8B5CF6]" /> Análise do Funil
            </div>
            <button className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded">Este mês <ChevronDown className="w-3 h-3 inline" /></button>
          </div>
          {/* Fake Chart CSS-only */}
          <div className="h-[120px] w-full relative flex items-end">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,35 Q10,30 20,25 T40,15 T60,20 T80,5 T100,0 L100,40 L0,40 Z" fill="url(#lineGlow)" />
              <path d="M0,35 Q10,30 20,25 T40,15 T60,20 T80,5 T100,0" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 2px 4px rgba(139,92,246,0.5))' }} />
              <circle cx="20" cy="25" r="1.5" fill="#fff" />
              <circle cx="40" cy="15" r="1.5" fill="#fff" />
              <circle cx="60" cy="20" r="1.5" fill="#fff" />
              <circle cx="80" cy="5" r="1.5" fill="#fff" />
              <circle cx="100" cy="0" r="1.5" fill="#fff" />
            </svg>
            <div className="absolute inset-0 flex justify-between px-1 border-b border-white/5 pb-1">
              <div className="w-[1px] h-full bg-white/5"></div>
              <div className="w-[1px] h-full bg-white/5"></div>
              <div className="w-[1px] h-full bg-white/5"></div>
              <div className="w-[1px] h-full bg-white/5"></div>
              <div className="w-[1px] h-full bg-white/5"></div>
            </div>
          </div>
        </div>

        {/* Gráfico 2 */}
        <div className="bg-[#11131E] rounded-2xl p-5 border border-white/5">
          <div className="text-sm font-bold text-white mb-6">Taxa de Conversão por Etapa</div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] text-slate-400">Espera &rarr; IA</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-[#3B82F6] rounded-full w-[75%]" />
              </div>
              <span className="w-8 text-right text-[11px] font-bold text-white">75%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] text-slate-400">IA &rarr; Humano</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-[#8B5CF6] rounded-full w-[60%]" />
              </div>
              <span className="w-8 text-right text-[11px] font-bold text-white">60%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] text-slate-400">Humano &rarr; Pagto</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-[#F59E0B] rounded-full w-[80%]" />
              </div>
              <span className="w-8 text-right text-[11px] font-bold text-white">80%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] text-slate-400">Pagto &rarr; Finalizado</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-[#10B981] rounded-full w-[90%]" />
              </div>
              <span className="w-8 text-right text-[11px] font-bold text-white">90%</span>
            </div>
          </div>
        </div>

        {/* Gráfico 3 (IA Insights) */}
        <div className="bg-[#11131E] rounded-2xl p-5 border border-[#8B5CF6]/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#8B5CF6] mb-1">Insights da IA</h3>
              <p className="text-[11px] text-slate-400">Tenho 3 sugestões para otimizar suas conversões:</p>
            </div>
          </div>
          <ul className="flex flex-col gap-2 mb-4 ml-1">
            <li className="flex items-start gap-2 text-[11px] text-slate-300">
              <span className="w-1 h-1 rounded-full bg-slate-500 mt-1.5 shrink-0" />
              <span>Responda <strong className="text-white">2 clientes</strong> em espera há mais de 24h</span>
            </li>
            <li className="flex items-start gap-2 text-[11px] text-slate-300">
              <span className="w-1 h-1 rounded-full bg-slate-500 mt-1.5 shrink-0" />
              <span>Taxa de conversão IA &rarr; Humano pode melhorar</span>
            </li>
            <li className="flex items-start gap-2 text-[11px] text-slate-300">
              <span className="w-1 h-1 rounded-full bg-slate-500 mt-1.5 shrink-0" />
              <span>Melhor horário para contato: <strong className="text-white">14h às 16h</strong></span>
            </li>
          </ul>
          <button className="w-full text-center text-[11px] font-bold text-[#8B5CF6] hover:text-white transition bg-white/5 hover:bg-white/10 rounded-lg py-2 border border-white/5">
            Ver todas as sugestões &rarr;
          </button>
        </div>

      </div>

    </div>
  );
}
