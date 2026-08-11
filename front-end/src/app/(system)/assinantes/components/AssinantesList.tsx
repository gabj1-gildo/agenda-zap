import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Phone } from "lucide-react";

interface AssinantesListProps {
  plans: any[];
  isLoading: boolean;
}

export function AssinantesList({ plans, isLoading }: AssinantesListProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border p-12 text-center text-muted-foreground flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <UserCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">Nenhum plano cadastrado</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            Crie planos na aba <strong>Serviços → Planos</strong> e os clientes que assinarem aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {plans.map((plan: any) => (
        <Card key={plan.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.price ? `R$ ${Number(plan.price).toFixed(2).replace('.', ',')}` : 'Gratuito'}
                  {plan.interval ? ` / ${plan.interval === 'MONTHLY' ? 'mês' : plan.interval === 'YEARLY' ? 'ano' : plan.interval}` : ''}
                </CardDescription>
              </div>
              <Badge variant="outline">{(plan.subscribers || []).length} assinantes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {(plan.subscribers || []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhum assinante ainda.</p>
            ) : (
              <div className="divide-y">
                {(plan.subscribers || []).map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-sm">{sub.name || sub.phone}</p>
                      {sub.name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {sub.phone}
                        </p>
                      )}
                    </div>
                    <Badge variant={sub.subscriptionStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                      {sub.subscriptionStatus === 'ACTIVE' ? 'Ativo' : sub.subscriptionStatus || 'Indefinido'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
