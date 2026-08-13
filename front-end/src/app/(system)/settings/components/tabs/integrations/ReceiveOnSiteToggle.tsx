import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ReceiveOnSiteToggleProps {
  acceptPaymentOnSite: boolean;
  originalAcceptPaymentOnSite: boolean;
  onToggle: (checked: boolean) => void;
  onSave: () => void;
}

export function ReceiveOnSiteToggle({ acceptPaymentOnSite, originalAcceptPaymentOnSite, onToggle, onSave }: ReceiveOnSiteToggleProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Opções de Pagamento</CardTitle>
        <CardDescription>Configurações gerais de recebimento.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="acceptOnSite" 
            checked={acceptPaymentOnSite} 
            onCheckedChange={(c) => onToggle(!!c)}
          />
          <Label htmlFor="acceptOnSite">Disponibilizar opção de receber no local (dinheiro/maquininha)</Label>
        </div>
        {acceptPaymentOnSite !== originalAcceptPaymentOnSite && (
          <Button className="mt-4" variant="outline" onClick={onSave}>Salvar Opção</Button>
        )}
      </CardContent>
    </Card>
  );
}
