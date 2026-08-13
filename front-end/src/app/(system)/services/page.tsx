"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";
import { Suspense } from "react";
import { ServicesTab } from "./components/tabs/services/ServicesTab";
import { SchedulesTab } from "./components/tabs/schedules/SchedulesTab";
import { ExceptionsTab } from "./components/tabs/exceptions/ExceptionsTab";

function ServicesPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const queryTenantId = searchParams?.get("tenant");
  const targetTenantId = queryTenantId || (session as any)?.tenantId;

  if (!targetTenantId) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">


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
              <ServicesTab tenantId={targetTenantId as string} />
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
              <SchedulesTab tenantId={targetTenantId as string} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excecoes" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <ExceptionsTab tenantId={targetTenantId as string} />
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
