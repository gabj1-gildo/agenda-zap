"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { ServicesSettings } from "@/components/ServicesSettings";
import { ExceptionsSettings } from "@/components/ExceptionsSettings";
import { Calendar, Clock, Cog } from "lucide-react";

function minsToTime(m: number) {
  if (!m || isNaN(m)) return "00:00";
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function timeToMins(t: string) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h * 60) + (m || 0);
}

const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

import { Suspense } from "react";

function ServicesPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const queryTenantId = searchParams?.get("tenant");
  const targetTenantId = queryTenantId || (session as any)?.tenantId;

  const [schedules, setSchedules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!targetTenantId) return;
      try {
        const token = (session?.user as any)?.accessToken;
        const headers: any = { 'tenant-id': targetTenantId };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(getBackendUrl('/api/settings/schedules'), { headers });
        const data = await res.json();
        
        if (data.success) {
          setSchedules(data.data);
        }
      } catch (err) {
        toast.error("Erro ao carregar horários");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetTenantId, session]);

  const saveSchedules = async () => {
    setSaving(true);
    try {
      await fetch(getBackendUrl('/api/settings/schedules'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'tenant-id': targetTenantId, 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` },
        body: JSON.stringify({ schedules })
      });
      toast.success("Horários salvos com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar horários");
    } finally {
      setSaving(false);
    }
  };

  if (!targetTenantId) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="w-8 h-8 text-primary" />
          Serviços e Horários
        </h1>
        <p className="text-muted-foreground mt-1">Configure seus serviços, preços e sua agenda de atendimento.</p>
      </div>

      <Tabs defaultValue="servicos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 h-auto md:h-10 gap-2">
          <TabsTrigger value="servicos">Serviços e Preços</TabsTrigger>
          <TabsTrigger value="horarios">Horários de Atendimento</TabsTrigger>
          <TabsTrigger value="excecoes">Exceções e Feriados</TabsTrigger>
        </TabsList>

        <TabsContent value="servicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Oferecidos</CardTitle>
              <CardDescription>Cadastre os serviços que sua empresa oferece, com durações e preços.</CardDescription>
            </CardHeader>
            <CardContent>
              <ServicesSettings tenantId={targetTenantId as string} token={(session?.user as any)?.accessToken} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento Regular</CardTitle>
              <CardDescription>Defina seus dias de atendimento e duração dos agendamentos (minutos).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : schedules.map((sched, idx) => (
                <div key={idx} className="flex flex-col gap-3 p-4 border rounded-md bg-card">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 w-32 shrink-0">
                      <Checkbox 
                        checked={sched.isActive} 
                        onCheckedChange={(c) => {
                          const s = [...schedules]; s[idx].isActive = !!c; setSchedules(s);
                        }}
                      />
                      <Label className="font-semibold">{days[sched.dayOfWeek]}</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-muted-foreground text-xs w-14">Abertura</Label>
                      <Input 
                        type="time" 
                        value={sched.startTime || "09:00"} 
                        onChange={e => { const s = [...schedules]; s[idx].startTime = e.target.value; setSchedules(s); }}
                        disabled={!sched.isActive}
                      />
                      <span className="text-muted-foreground text-sm">até</span>
                      <Input 
                        type="time" 
                        value={sched.endTime || "18:00"} 
                        onChange={e => { const s = [...schedules]; s[idx].endTime = e.target.value; setSchedules(s); }}
                        disabled={!sched.isActive}
                      />
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <Label className="text-muted-foreground text-xs">Duração</Label>
                      <Input 
                        type="time" 
                        className="w-[100px]" 
                        value={minsToTime(sched.slotDuration)} 
                        onChange={e => { 
                          const s = [...schedules]; 
                          s[idx].slotDuration = timeToMins(e.target.value); 
                          setSchedules(s); 
                        }}
                        disabled={!sched.isActive}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-0 md:pl-[150px]">
                    <Label className="text-muted-foreground text-xs w-12">Pausa</Label>
                    <Input 
                      type="time" 
                      className="w-[100px]"
                      value={sched.intervalStartTime || ""} 
                      onChange={e => { const s = [...schedules]; s[idx].intervalStartTime = e.target.value; setSchedules(s); }}
                      disabled={!sched.isActive}
                    />
                    <span className="text-muted-foreground text-sm">até</span>
                    <Input 
                      type="time" 
                      className="w-[100px]"
                      value={sched.intervalEndTime || ""} 
                      onChange={e => { const s = [...schedules]; s[idx].intervalEndTime = e.target.value; setSchedules(s); }}
                      disabled={!sched.isActive}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6">
              <Button onClick={saveSchedules} disabled={saving || loading}>{saving ? "Salvando..." : "Salvar Horários"}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="excecoes" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <ExceptionsSettings tenantId={targetTenantId as string} token={(session?.user as any)?.accessToken} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted-foreground animate-pulse">Carregando serviços...</div>}>
      <ServicesPageContent />
    </Suspense>
  );
}
