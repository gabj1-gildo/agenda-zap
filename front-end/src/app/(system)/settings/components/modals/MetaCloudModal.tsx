import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/api";
import { TenantConfig } from "../../types/settings.types";

interface MetaCloudModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantConfig;
  updateTenantLocal: (updates: Partial<TenantConfig>) => void;
  onSave: () => void;
}

export function MetaCloudModal({ open, onOpenChange, tenant, updateTenantLocal, onSave }: MetaCloudModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Meta Cloud API</DialogTitle>
          <DialogDescription>
            Insira as credenciais do seu aplicativo Meta for Developers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Meta Token Permanente</Label>
            <Input 
              type="password"
              value={tenant?.whatsappMetaToken || ''} 
              onChange={e => updateTenantLocal({ whatsappMetaToken: e.target.value })} 
              placeholder="EAAI..." 
            />
          </div>
          <div className="space-y-2">
            <Label>Phone Number ID (ID do Número de Telefone)</Label>
            <Input 
              value={tenant?.whatsappMetaPhoneNumberId || ''} 
              onChange={e => updateTenantLocal({ whatsappMetaPhoneNumberId: e.target.value })} 
              placeholder="1234567890" 
            />
          </div>
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-semibold mb-1">Passo adicional obrigatório:</p>
            Após salvar o token, certifique-se de configurar a Webhook na Meta Business apontando para esta exata URL: <br />
            <code className="bg-background border px-1.5 py-0.5 rounded select-all mt-1 inline-block">{getBackendUrl('/api/webhooks/whatsapp-meta')}</code>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>Salvar Conexão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
