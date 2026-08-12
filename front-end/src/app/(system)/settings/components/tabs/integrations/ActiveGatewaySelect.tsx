import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { PaymentKey } from "../../../types/settings.types";

interface ActiveGatewaySelectProps {
  keys: PaymentKey[];
  onToggleKey: (id: string, isActive: boolean) => void;
}

export function ActiveGatewaySelect({ keys, onToggleKey }: ActiveGatewaySelectProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Gateway Ativo</CardTitle>
        <CardDescription>Selecione qual das suas integrações processará os pagamentos online.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {keys.length === 0 ? (
          <p className="text-muted-foreground text-sm">Você ainda não conectou nenhum gateway na aba de Integrações.</p>
        ) : (
          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id} className={`flex items-center justify-between p-4 border rounded-md ${k.isActive ? 'border-primary bg-primary/5' : ''}`}>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {k.name}
                    {k.isActive && <Badge className="bg-primary">Ativa</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">{k.gateway}</div>
                </div>
                <div className="flex items-center gap-2">
                  {!k.isActive && (
                    <Button variant="outline" size="sm" onClick={() => onToggleKey(k.id, true)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Usar este
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
