"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Smartphone } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { getBackendUrl } from "@/lib/api";

export default function FunilPage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState({ kanban: [] as any[] });
  const [loading, setLoading] = useState(true);

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
    return <div className="p-8 text-center text-sm text-muted-foreground">Carregando painel...</div>;
  }

  if (!activeTenantId) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Selecione uma empresa para ver o funil.</div>;
  }

  const columns = [
    { id: 'espera', label: 'Espera', color: 'var(--info)' },
    { id: 'atendimento_ia', label: 'Atendimento IA', color: '#8B5CF6' },
    { id: 'atendimento_humano', label: 'Atend. Humano', color: 'var(--warning)' },
    { id: 'aguardando_pagamento', label: 'Aguard. Pagto', color: 'var(--primary)' },
    { id: 'finalizado', label: 'Finalizado', color: 'var(--success)' },
    { id: 'perdido', label: 'Perdido', color: 'var(--destructive)' }
  ];
  const validStages = columns.map(c => c.id);

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData("clientId", clientId);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData("clientId");
    if (!clientId) return;

    // Optimistic update
    const updatedClients = metrics.kanban.map((c: any) => 
      c.id === clientId ? { ...c, funnelStage: stageId } : c
    );
    setMetrics(prev => ({ ...prev, kanban: updatedClients }));

    // API Call
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    fetch(getBackendUrl('/api/dashboard/clients/stage'), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ clientId, funnelStage: stageId, tenantId: activeTenantId })
    }).catch(err => console.error("Error updating stage:", err));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Funil</p>
        <h1 className="font-display font-extrabold text-4xl text-foreground">Funil de Vendas</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seus clientes (Classificação feita via IA).</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {columns.map(col => {
          const colClients = metrics.kanban?.filter((c: any) => {
            let stage = (c.funnelStage || 'espera').toLowerCase();
            if (stage === 'lead') stage = 'espera';
            if (stage === 'em atendimento') stage = 'atendimento_ia';
            if (stage === 'aguardando pagamento') stage = 'aguardando_pagamento';
            if (stage === 'concluido') stage = 'finalizado';
            if (stage === 'expirado') stage = 'perdido';
            
            if (!validStages.includes(stage)) stage = 'espera';
            return stage === col.id;
          });

          return (
            <div 
              key={col.id} 
              className="min-w-[280px] w-[320px] flex-shrink-0 snap-center flex flex-col h-[600px]"
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={handleDragOver}
            >
              <div style={{ borderColor: "var(--border)", borderTop: `3px solid ${col.color}`, backgroundColor: `color-mix(in srgb, ${col.color} 12%, transparent)` }} className="border rounded-t-xl px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">{col.label}</span>
                <span style={{ background: "var(--background)" }} className="px-2 py-0.5 rounded-full text-xs font-mono-custom text-muted-foreground border">
                  {colClients.length}
                </span>
              </div>
              <div style={{ borderColor: "var(--border)" }} className="flex-1 bg-muted/10 border border-t-0 rounded-b-xl p-3 overflow-y-auto flex flex-col gap-3">
                {colClients.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground/60 mt-4">Vazio</div>
                ) : (
                  colClients.map((client: any) => (
                    <div 
                      key={client.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, client.id)}
                      style={{ borderColor: "var(--border)", background: "var(--card)", cursor: "grab" }} 
                      className="border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow active:cursor-grabbing"
                    >
                      <div className="font-semibold text-sm text-foreground truncate mb-1">
                        {client.name || client.whatsappName || 'Cliente sem nome'}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono-custom flex items-center gap-1.5">
                        <Smartphone className="w-3 h-3" />
                        {formatPhone(client.phone)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
