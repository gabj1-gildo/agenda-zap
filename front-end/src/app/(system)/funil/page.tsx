"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Smartphone, Clock, User, CheckCircle2, MoreHorizontal, ArrowRight, MessageSquare } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { getBackendUrl } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const STAGES = [
  { id: 'espera', label: 'Espera', color: 'var(--info)', bgColor: 'rgba(59, 130, 246, 0.1)' },
  { id: 'atendimento_ia', label: 'Atendimento IA', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  { id: 'atendimento_humano', label: 'Atend. Humano', color: 'var(--warning)', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { id: 'aguardando_pagamento', label: 'Aguard. Pagto', color: 'var(--primary)', bgColor: 'rgba(16, 185, 129, 0.1)' },
  { id: 'finalizado', label: 'Finalizado', color: 'var(--success)', bgColor: 'rgba(34, 197, 94, 0.1)' },
  { id: 'perdido', label: 'Perdido', color: 'var(--destructive)', bgColor: 'rgba(239, 68, 68, 0.1)' }
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
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium animate-pulse">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!activeTenantId) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="bg-muted/50 p-8 rounded-2xl border flex flex-col items-center gap-3 text-center max-w-sm">
          <User className="w-12 h-12 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-bold">Nenhuma empresa</h2>
          <p className="text-sm text-muted-foreground">Selecione uma empresa no topo para visualizar o funil de vendas.</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData("clientId", clientId);
    setDraggedItem(clientId);
    // Needed for Firefox to show a drag image properly
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

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const clientId = e.dataTransfer.getData("clientId");
    if (!clientId) return;

    // Achar cliente atual
    const client = metrics.kanban.find(c => c.id === clientId);
    if (!client || client.funnelStage === stageId) return;

    // Atualização otimista
    const updatedClients = metrics.kanban.map((c: any) => 
      c.id === clientId ? { ...c, funnelStage: stageId } : c
    );
    setMetrics(prev => ({ ...prev, kanban: updatedClients }));

    // Persistência
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    try {
      const res = await fetch(getBackendUrl('/api/dashboard/clients/stage'), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ clientId, funnelStage: stageId, tenantId: activeTenantId })
      });
      
      if (!res.ok) {
        throw new Error("Falha ao salvar");
      }
      toast.success("Estágio atualizado");
    } catch (err) {
      console.error("Error updating stage:", err);
      toast.error("Erro ao mover cliente");
      // Reverter se falhar
      setMetrics(prev => ({ 
        ...prev, 
        kanban: prev.kanban.map(c => c.id === clientId ? client : c) 
      }));
    }
  };

  // Normalizar estágios para bater com os definidos
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
    <div className="h-[calc(100vh-100px)] flex flex-col p-6 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              <MoreHorizontal className="w-5 h-5" />
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Kanban</p>
          </div>
          <h1 className="font-display font-extrabold text-4xl text-foreground tracking-tight">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Acompanhe a jornada dos seus clientes em tempo real. Arraste os cartões para atualizar o status do atendimento manualmente.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 snap-x">
        <div className="flex gap-4 h-full min-w-max px-1">
          {STAGES.map(col => {
            const colClients = normalizedKanban.filter((c: any) => c.normalizedStage === col.id);
            const isDragOver = dragOverCol === col.id;

            return (
              <div 
                key={col.id} 
                className="w-[320px] flex-shrink-0 snap-center flex flex-col h-full bg-card/50 backdrop-blur-xl border rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
                style={{
                  borderColor: isDragOver ? col.color : 'var(--border)',
                  boxShadow: isDragOver ? `0 0 0 2px ${col.color}40` : 'none',
                  transform: isDragOver ? 'scale(1.01)' : 'scale(1)'
                }}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
              >
                {/* Header da Coluna */}
                <div 
                  className="px-4 py-3 flex items-center justify-between border-b relative overflow-hidden shrink-0"
                  style={{ backgroundColor: col.bgColor }}
                >
                  <div 
                    className="absolute top-0 left-0 w-full h-[3px]"
                    style={{ backgroundColor: col.color }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-[13px] font-bold uppercase tracking-wider text-foreground">
                      {col.label}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-border/50 px-2.5 font-mono text-xs font-bold">
                    {colClients.length}
                  </Badge>
                </div>

                {/* Área de Drop / Lista de Cards */}
                <div 
                  className={`flex-1 overflow-y-auto p-3 flex flex-col gap-3 transition-colors duration-200 ${isDragOver ? 'bg-muted/30' : 'bg-transparent'}`}
                >
                  {colClients.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 opacity-70 border-2 border-dashed border-muted/50 rounded-xl m-2">
                      <ArrowRight className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-xs font-medium uppercase tracking-widest">Soltar aqui</span>
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
                            bg-card border rounded-xl p-4 shadow-sm cursor-grab active:cursor-grabbing 
                            hover:border-primary/50 hover:shadow-md transition-all duration-200
                            ${isDragging ? 'opacity-40 scale-95 shadow-none ring-2 ring-primary border-transparent' : 'opacity-100'}
                          `}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <Avatar className="w-9 h-9 border ring-2 ring-background shadow-sm">
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                                  {(client.name || client.whatsappName || 'C').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="overflow-hidden">
                                <h3 className="font-semibold text-sm text-foreground truncate max-w-[180px]">
                                  {client.name || client.whatsappName || 'Cliente sem nome'}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-mono-custom mt-0.5">
                                  <Smartphone className="w-3 h-3" />
                                  {formatPhone(client.phone)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Rodapé do Card */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{new Date(client.updatedAt || client.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                            </div>
                            
                            {client.lastMessage && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded-md">
                                <MessageSquare className="w-3 h-3" />
                                <span>Resp</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
