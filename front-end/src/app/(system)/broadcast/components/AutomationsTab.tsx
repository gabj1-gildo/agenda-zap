import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Clock, CalendarDays, Loader2, PlayCircle, PauseCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NewAutomationModal } from "./NewAutomationModal";

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Automation {
  id: string;
  clientId: string;
  clientName: string | null;
  clientPhone: string | null;
  automationType: string;
  messageTemplate: string;
  dayOfWeek: number;
  time: string;
  nextRunAt: string;
  isActive: boolean;
  createdAt: string;
}

export function AutomationsTab({ tenantId, token }: { tenantId: string; token?: string }) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAutomations = async () => {
    try {
      const res = await fetch(getBackendUrl('/api/automations'), {
        headers: {
          'tenant-id': tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setAutomations(data.data);
      }
    } catch (error) {
      toast.error("Erro ao carregar automações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) fetchAutomations();
  }, [tenantId]);

  const toggleAutomation = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(getBackendUrl(`/api/automations/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !currentStatus } : a));
        toast.success(currentStatus ? "Automação pausada" : "Automação ativada");
      } else {
        toast.error("Erro ao atualizar status");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm("Remover esta automação permanentemente?")) return;
    try {
      const res = await fetch(getBackendUrl(`/api/automations/${id}`), {
        method: 'DELETE',
        headers: {
          'tenant-id': tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setAutomations(prev => prev.filter(a => a.id !== id));
        toast.success("Automação removida");
      } else {
        toast.error("Erro ao remover");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center text-muted-foreground"><Loader2 className="animate-spin w-6 h-6" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-5 rounded-2xl border shadow-sm">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Regras de Automação
          </h3>
          <p className="text-sm text-muted-foreground">Envie mensagens recorrentes automaticamente para clientes específicos.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {automations.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed rounded-2xl bg-muted/20">
          <p className="text-muted-foreground">Você ainda não tem nenhuma regra de automação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map(auto => (
            <Card key={auto.id} className="p-5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={auto.isActive ? "default" : "secondary"}>
                    {auto.isActive ? "Ativo" : "Pausado"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => toggleAutomation(auto.id, auto.isActive)}
                    >
                      {auto.isActive ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteAutomation(auto.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <h4 className="font-semibold">{auto.clientName || "Cliente Desconhecido"}</h4>
                <p className="text-xs text-muted-foreground mb-4">{auto.clientPhone}</p>

                <div className="flex items-center gap-2 text-sm text-foreground/80 mb-1">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span>Toda(o) <b>{DAYS_OF_WEEK[auto.dayOfWeek]}</b> às <b>{auto.time}</b></span>
                </div>
                
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                  <p className="text-xs text-muted-foreground line-clamp-3">"{auto.messageTemplate}"</p>
                </div>
              </div>
              
              <div className="mt-4 text-[10px] text-muted-foreground text-right uppercase tracking-wider font-semibold">
                Próximo: {new Date(auto.nextRunAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <NewAutomationModal 
          tenantId={tenantId} 
          token={token} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            fetchAutomations();
          }} 
        />
      )}
    </div>
  );
}
