"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getBackendUrl } from "@/lib/api";

import { useSession } from "next-auth/react";

export function ManualControls({ schedules }: { schedules: any[] }) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const toggleSchedule = async (scheduleId: string, currentActive: boolean) => {
    setLoading(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }

      const res = await fetch(getBackendUrl('/api/dashboard/schedules'), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ scheduleId, isActive: !currentActive })
      });
      if (res.ok) {
        toast.success(currentActive ? "Horário bloqueado com sucesso!" : "Horário reaberto com sucesso!");
        window.location.reload();
      } else {
        toast.error("Erro ao atualizar horário.");
      }
    } catch (err) {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Controle de Operação</CardTitle>
        <CardDescription>
          Bloqueie horários ou pause o atendimento da IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3">Bloqueio Rápido de Expediente</h4>
          <div className="space-y-3">
            {schedules && schedules.map(sched => (
              <div key={sched.id} className="flex items-center justify-between">
                <span className="text-sm capitalize font-medium">
                  {['domingo','segunda','terça','quarta','quinta','sexta','sábado'][sched.dayOfWeek]}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">{sched.startTime} - {sched.endTime}</span>
                  <Button 
                    variant={sched.isActive ? "outline" : "destructive"} 
                    size="sm"
                    disabled={loading}
                    onClick={() => toggleSchedule(sched.id, sched.isActive)}
                  >
                    {sched.isActive ? "Bloquear" : "Bloqueado"}
                  </Button>
                </div>
              </div>
            ))}
            {(!schedules || schedules.length === 0) && (
              <p className="text-xs text-muted-foreground">Nenhum horário cadastrado no banco.</p>
            )}
          </div>
        </div>
        
        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-3">Pausar Atendimento da IA</h4>
          <p className="text-xs text-muted-foreground mb-4">
            A IA não responderá mensagens se você desligar o atendimento automático. (Em breve)
          </p>
          <Button variant="secondary" className="w-full" disabled>Desativar IA (Em breve)</Button>
        </div>
      </CardContent>
    </Card>
  )
}
