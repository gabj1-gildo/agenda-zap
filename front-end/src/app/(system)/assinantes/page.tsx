"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Phone } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { Suspense } from "react";

function AssinantesContent() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session as any)?.tenantId;
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    fetch(getBackendUrl('/api/planos'), {
      headers: { 'tenant-id': tenantId, 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setPlans(d.data || []); })
      .catch(() => toast.error("Erro ao carregar planos"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (!tenantId) return (
    <div className="p-8 text-center text-muted-foreground">Nenhuma empresa selecionada.</div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assinantes</h1>
        <p className="text-muted-foreground mt-2">Clientes que assinaram os planos da sua empresa.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">Nenhum plano cadastrado</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              Crie planos na aba <strong>Serviços → Planos</strong> e os clientes que assinarem aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        plans.map((plan: any) => (
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
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
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
        ))
      )}
    </div>
  );
}

export default function AssinantesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
      <AssinantesContent />
    </Suspense>
  );
}
