"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ClientProfileTabs({ clientId, tenantId, token }: { clientId: string, tenantId: string, token: string }) {
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planMonths, setPlanMonths] = useState("1");
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  const [loadingAuto, setLoadingAuto] = useState(false);
  const [autoActive, setAutoActive] = useState(false);
  const [autoDay, setAutoDay] = useState("5"); // Friday
  const [autoTime, setAutoTime] = useState("09:00");
  const [autoMessage, setAutoMessage] = useState(`Oi! Tudo bem? 😊\nPassando pra fazer nossa atualização semanal — quero saber como foi a última semana:\n\n✅ Como está o peso atual?\n✅ Conseguiu seguir bem o plano alimentar?\n✅ Teve alguma dificuldade ou situação que atrapalhou?\n✅ Existe algo que está te incomodando na rotina, horários ou alimentos?\n✅ Deseja ajustar algo no plano para essa nova semana?\n\nAlém disso, se quiser compartilhar fotos das refeições pode registrar no aplicativo. Pesagem ou até feedbacks sobre energia, sono e treino, pode me mandar — isso ajuda bastante a fazer os ajustes mais assertivos.\n\nO objetivo é ir melhorando juntos, de forma leve e constante 💪\nVamos pra mais uma semana de foco e evolução!`);

  useEffect(() => {
    fetchPlan();
    fetchAutomations();
  }, []);

  const fetchPlan = async () => {
    try {
      const res = await fetch(getBackendUrl(`/api/clients/${clientId}/plans`), {
        headers: { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentPlan(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAutomations = async () => {
    try {
      const res = await fetch(getBackendUrl(`/api/clients/${clientId}/automations`), {
        headers: { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const auto = data.data[0];
        setAutoActive(auto.isActive);
        setAutoDay(auto.dayOfWeek.toString());
        setAutoTime(auto.time);
        setAutoMessage(auto.messageTemplate);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await fetch(getBackendUrl(`/api/clients/${clientId}/plans`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ durationMonths: Number(planMonths), tenantId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Plano atualizado com sucesso!");
        setCurrentPlan(data.data);
      } else {
        toast.error(data.message || "Erro ao salvar plano");
      }
    } catch (e) {
      toast.error("Erro interno ao salvar plano");
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSaveAutomation = async () => {
    setLoadingAuto(true);
    try {
      const res = await fetch(getBackendUrl(`/api/clients/${clientId}/automations`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: autoActive,
          dayOfWeek: Number(autoDay),
          time: autoTime,
          messageTemplate: autoMessage,
          tenantId
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Automação atualizada com sucesso!");
      } else {
        toast.error(data.message || "Erro ao salvar automação");
      }
    } catch (e) {
      toast.error("Erro interno ao salvar automação");
    } finally {
      setLoadingAuto(false);
    }
  };

  return (
    <Tabs defaultValue="plan" className="w-full">
      <TabsList className="w-full max-w-md grid grid-cols-2">
        <TabsTrigger value="plan">Plano do Cliente</TabsTrigger>
        <TabsTrigger value="automation">Acompanhamento Auto</TabsTrigger>
      </TabsList>
      
      <TabsContent value="plan" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Plano e Contrato</CardTitle>
            <CardDescription>Defina por quanto tempo este cliente terá acompanhamento ativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPlan && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium">Plano Atual: <span className="text-primary">{currentPlan.durationMonths} meses</span></p>
                <p className="text-sm text-muted-foreground mt-1">
                  Válido de {new Date(currentPlan.startDate).toLocaleDateString()} até {new Date(currentPlan.endDate).toLocaleDateString()}
                </p>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${new Date(currentPlan.endDate) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {new Date(currentPlan.endDate) > new Date() ? 'Ativo' : 'Vencido'}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Renovar / Novo Plano</Label>
              <Select value={planMonths} onValueChange={(val) => setPlanMonths(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Mês</SelectItem>
                  <SelectItem value="2">2 Meses</SelectItem>
                  <SelectItem value="3">3 Meses</SelectItem>
                  <SelectItem value="6">6 Meses</SelectItem>
                  <SelectItem value="12">12 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSavePlan} disabled={loadingPlan}>
              {loadingPlan && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Plano
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="automation" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Check-in Automático via WhatsApp</CardTitle>
            <CardDescription>Programe mensagens semanais para acompanhar o cliente (só funciona se o plano estiver ativo).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border border-border p-4 rounded-lg">
              <div>
                <Label className="text-base">Ativar Check-in Semanal</Label>
                <p className="text-sm text-muted-foreground">O cliente receberá a mensagem programada.</p>
              </div>
              <Switch checked={autoActive} onCheckedChange={setAutoActive} />
            </div>

            {autoActive && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dia da Semana</Label>
                    <Select value={autoDay} onValueChange={(val) => setAutoDay(val || "")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Segunda-feira</SelectItem>
                        <SelectItem value="2">Terça-feira</SelectItem>
                        <SelectItem value="3">Quarta-feira</SelectItem>
                        <SelectItem value="4">Quinta-feira</SelectItem>
                        <SelectItem value="5">Sexta-feira</SelectItem>
                        <SelectItem value="6">Sábado</SelectItem>
                        <SelectItem value="0">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input type="time" value={autoTime} onChange={(e) => setAutoTime(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem de Check-in</Label>
                  <Textarea 
                    value={autoMessage} 
                    onChange={(e) => setAutoMessage(e.target.value)}
                    className="min-h-[250px] resize-y"
                    placeholder="Escreva a mensagem..."
                  />
                  <p className="text-xs text-muted-foreground">Você pode usar emojis e formatação do WhatsApp (*negrito*, _itálico_).</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveAutomation} disabled={loadingAuto}>
              {loadingAuto && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Automação
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
