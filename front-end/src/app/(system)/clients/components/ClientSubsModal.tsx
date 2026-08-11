import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";

interface ClientSubsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: any | null;
  tenantId: string;
  token: string;
  availablePlans: any[];
}

export function ClientSubsModal({ isOpen, onOpenChange, client, tenantId, token, availablePlans }: ClientSubsModalProps) {
  const [clientSubs, setClientSubs] = useState<any[]>([]);
  const [selectedPlanToAssign, setSelectedPlanToAssign] = useState("");
  const [assigningPlan, setAssigningPlan] = useState(false);

  const loadSubs = async (clientId: string) => {
    try {
      const res = await fetch(getBackendUrl(`/api/dashboard/clients/${clientId}/subscriptions`), {
        headers: { "tenant-id": tenantId, Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setClientSubs(data.data);
      }
    } catch (e) {
      toast.error("Erro ao carregar assinaturas.");
    }
  };

  useEffect(() => {
    if (isOpen && client) {
      loadSubs(client.id);
    } else {
      setClientSubs([]);
      setSelectedPlanToAssign("");
    }
  }, [isOpen, client]);

  const handleAssignPlan = async () => {
    if (!selectedPlanToAssign) return toast.error("Selecione um plano.");
    if (!client) return;

    setAssigningPlan(true);
    try {
      const res = await fetch(getBackendUrl(`/api/dashboard/clients/${client.id}/subscriptions`), {
        method: "POST",
        headers: { "Content-Type": "application/json", "tenant-id": tenantId, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: selectedPlanToAssign })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Plano vinculado com sucesso!");
        loadSubs(client.id); // Reload subs
        setSelectedPlanToAssign("");
      } else {
        toast.error(data.error || "Erro ao vincular plano.");
      }
    } catch (e) {
      toast.error("Erro na conexão.");
    } finally {
      setAssigningPlan(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateString));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assinaturas de {client?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Assinaturas Vigentes</Label>
            {clientSubs.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Início</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientSubs.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.plan?.name}</TableCell>
                        <TableCell>
                          <Badge className={sub.status === "ACTIVE" ? "bg-green-600" : "bg-gray-500"}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(sub.startDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-md text-center">Nenhuma assinatura ativa encontrada para este cliente.</p>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>Vincular a um Novo Plano (Manual)</Label>
            <div className="flex gap-2">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={selectedPlanToAssign} 
                onChange={(e) => setSelectedPlanToAssign(e.target.value)}
              >
                <option value="">Selecione um plano...</option>
                {availablePlans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name} - R$ {Number(plan.price).toFixed(2)}</option>
                ))}
              </select>
              <Button onClick={handleAssignPlan} disabled={assigningPlan || !selectedPlanToAssign}>
                {assigningPlan ? "Vinculando..." : "Vincular"}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
