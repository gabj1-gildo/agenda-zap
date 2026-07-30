"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Appointment = {
  id: string;
  date: string;
  serviceName: string;
  price: string;
  status: string;
  client: {
    name: string;
    phone: string;
  };
}

export function AgendaTimeline({ appointments }: { appointments: Appointment[] }) {
  // Sort appointments by date
  const sorted = [...(appointments || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Agenda do Dia</CardTitle>
        <CardDescription>
          Próximos compromissos marcados pela IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado.</p>
          ) : (
            sorted.map((apt) => {
              const time = new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const date = new Date(apt.date).toLocaleDateString('pt-BR');
              
              return (
                <div key={apt.id} className="flex items-center space-x-4 border border-border p-4 rounded-lg bg-card transition-all hover:shadow-md">
                  <div className="flex flex-col items-center justify-center bg-primary/10 text-primary font-bold rounded-md w-16 h-16 shrink-0">
                    <span className="text-sm">{date.substring(0,5)}</span>
                    <span className="text-lg">{time}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-none">{apt.serviceName}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.client?.name || 'Cliente Desconhecido'} • {apt.client?.phone || 'Sem número'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="font-semibold text-green-600 dark:text-green-400">R$ {apt.price}</div>
                    <Badge variant={apt.status === 'PAGO' ? 'default' : apt.status === 'PENDENTE' ? 'secondary' : 'destructive'}>
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
