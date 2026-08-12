import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { getBackendUrl } from "@/lib/api";

interface GoogleCalendarCardProps {
  tenantId: string;
  hasToken: boolean;
}

export function GoogleCalendarCard({ tenantId, hasToken }: GoogleCalendarCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Google Calendar</CardTitle>
        <CardDescription>Sincronize os agendamentos confirmados com sua agenda do Google.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasToken ? (
          <div className="flex items-center gap-3 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-4 rounded-md border border-green-200 dark:border-green-900/50">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Google Calendar conectado com sucesso.</span>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Você ainda não conectou sua conta do Google.</p>
            <Button onClick={() => window.location.href = getBackendUrl(`/api/google/auth?tenantId=${tenantId}`)}>
              Conectar com o Google
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
