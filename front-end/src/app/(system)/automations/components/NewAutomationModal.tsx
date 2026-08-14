import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Client {
  id: string;
  name: string;
  phone: string;
}

export function NewAutomationModal({ tenantId, token, onClose, onSuccess }: { tenantId: string, token?: string, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState("CLIENT");
  const [targetValue, setTargetValue] = useState("");
  const [clientId, setClientId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [time, setTime] = useState("09:00");
  const [messageTemplate, setMessageTemplate] = useState("");

  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  useEffect(() => {
    // Fetch clients
    const fetchClients = async () => {
      try {
        const res = await fetch(getBackendUrl('/api/clients'), {
          headers: {
            'tenant-id': tenantId,
            ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {})
          }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setClients(data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar clientes", error);
      }
    };

    // Fetch plans
    const fetchPlans = async () => {
      try {
        const res = await fetch(getBackendUrl(`/api/tenant-plans?tenantId=${tenantId}`), {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setAvailablePlans(data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar planos", error);
      }
    };

    fetchClients();
    fetchPlans();
  }, [tenantId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Digite um nome para a regra");
    if (targetType === "CLIENT" && !clientId) return toast.error("Selecione um cliente");
    if (targetType === "PLAN" && !targetValue) return toast.error("Selecione um plano");
    if (!messageTemplate.trim()) return toast.error("Digite uma mensagem");
    if (!time) return toast.error("Selecione o horário");

    setLoading(true);
    try {
      const res = await fetch(getBackendUrl('/api/automations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name,
          targetType,
          targetValue: targetType === "PLAN" ? targetValue : null,
          clientId: targetType === "CLIENT" ? clientId : null,
          dayOfWeek: Number(dayOfWeek),
          time,
          messageTemplate
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Automação criada com sucesso!");
        onSuccess();
      } else {
        toast.error(data.error || "Erro ao criar automação");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    setMessageTemplate(prev => prev + variable);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Automação Recorrente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nome da Regra</Label>
            <Input 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Cobrança Plano Pro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Público-Alvo</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={targetType}
              onChange={e => {
                setTargetType(e.target.value);
                setClientId("");
                setTargetValue("");
              }}
              required
            >
              <option value="CLIENT">Um Cliente Específico</option>
              <option value="PLAN">Assinantes de um Plano Específico</option>
              <option value="ALL">Todos os Clientes</option>
            </select>
          </div>

          {targetType === "CLIENT" && (
            <div className="space-y-2">
              <Label>Selecionar Cliente</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                required
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name || 'Sem nome'} ({c.phone})</option>
                ))}
              </select>
            </div>
          )}

          {targetType === "PLAN" && (
            <div className="space-y-2">
              <Label>Selecionar Plano</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
                required
              >
                <option value="">Selecione um plano...</option>
                {availablePlans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={dayOfWeek}
                onChange={e => setDayOfWeek(Number(e.target.value))}
              >
                <option value={0}>Domingo</option>
                <option value={1}>Segunda-feira</option>
                <option value={2}>Terça-feira</option>
                <option value={3}>Quarta-feira</option>
                <option value={4}>Quinta-feira</option>
                <option value={5}>Sexta-feira</option>
                <option value={6}>Sábado</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Horário de Envio</Label>
              <Input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Mensagem</Label>
              <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => insertVariable('{nome}')}>
                +{`{nome}`}
              </Button>
            </div>
            <Textarea 
              className="min-h-[100px] resize-none"
              placeholder="Ex: Olá {nome}, não esqueça de..."
              value={messageTemplate}
              onChange={e => setMessageTemplate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end pt-4 gap-2 border-t">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar Regra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
