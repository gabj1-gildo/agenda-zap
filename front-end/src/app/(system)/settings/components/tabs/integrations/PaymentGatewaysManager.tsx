import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash } from "lucide-react";
import { PaymentKey } from "../../../types/settings.types";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";

interface PaymentGatewaysManagerProps {
  tenantId: string;
  keys: PaymentKey[];
  onAddKey: (newKey: Partial<PaymentKey>) => Promise<boolean>;
  onDeleteKey: (id: string) => void;
}

export function PaymentGatewaysManager({ tenantId, keys, onAddKey, onDeleteKey }: PaymentGatewaysManagerProps) {
  const [newKey, setNewKey] = useState({ 
    name: '', gateway: 'MERCADOPAGO', token: '', pixExpirationTime: '00:30', 
    acceptsPix: true, acceptsCreditCard: true, acceptsBoleto: false 
  });

  const handleAddKey = async () => {
    if (!newKey.name || !newKey.token) return toast.error("Preencha nome e token");
    const success = await onAddKey(newKey);
    if (success) {
      setNewKey({ name: '', gateway: 'MERCADOPAGO', token: '', pixExpirationTime: '00:30', acceptsPix: true, acceptsCreditCard: true, acceptsBoleto: false });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateways de Pagamento</CardTitle>
        <CardDescription>Conecte ou cadastre chaves de API de processadores de pagamento.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 items-end bg-muted/50 p-4 rounded-md border border-border/50">
          <div className="flex-1 space-y-1">
            <Label>Nome (ex: MP Matriz)</Label>
            <Input value={newKey.name} onChange={e => setNewKey({...newKey, name: e.target.value})} className="bg-background" />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Gateway</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={newKey.gateway} onChange={e => setNewKey({...newKey, gateway: e.target.value})}>
              <option value="MERCADOPAGO">Mercado Pago</option>
              <option value="ABACATEPAY">AbacatePay</option>
              <option value="ASAAS">Asaas</option>
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <Label>Tempo PIX (hh:mm)</Label>
            <Input value={newKey.pixExpirationTime} onChange={e => setNewKey({...newKey, pixExpirationTime: e.target.value})} placeholder="00:30" className="bg-background" />
          </div>
          
          {newKey.gateway === 'MERCADOPAGO' ? (
            <div className="flex-[2]">
              <Button 
                className="w-full bg-[#009EE3] hover:bg-[#009EE3]/90 text-white" 
                onClick={() => window.location.href = getBackendUrl(`/api/mercadopago/auth?tenantId=${tenantId}&pixExpirationTime=${newKey.pixExpirationTime}`)}
              >
                Conectar com Mercado Pago
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-[2] space-y-1">
                <Label>Token (Access Token)</Label>
                <Input value={newKey.token} onChange={e => setNewKey({...newKey, token: e.target.value})} type="password" className="bg-background" />
              </div>
              <Button onClick={handleAddKey}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-md border border-border/50">
          <div className="text-sm font-semibold">Métodos Aceitos:</div>
          <div className="flex items-center space-x-2">
            <Checkbox id="acceptPix" checked={newKey.acceptsPix} onCheckedChange={(c) => setNewKey({...newKey, acceptsPix: !!c})} />
            <Label htmlFor="acceptPix">Pix</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="acceptCard" checked={newKey.acceptsCreditCard} onCheckedChange={(c) => setNewKey({...newKey, acceptsCreditCard: !!c})} />
            <Label htmlFor="acceptCard">Cartão</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="acceptBoleto" checked={newKey.acceptsBoleto} onCheckedChange={(c) => setNewKey({...newKey, acceptsBoleto: !!c})} />
            <Label htmlFor="acceptBoleto">Boleto</Label>
          </div>
        </div>

        <div className="space-y-3">
          {keys.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma integração configurada.</p>
          ) : (
            keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {k.name}
                    {k.isActive && <Badge className="bg-primary">Em uso</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">{k.gateway} - Conectado (Expira em: {k.pixExpirationTime || '00:30'})</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="destructive" size="icon" onClick={() => onDeleteKey(k.id)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
