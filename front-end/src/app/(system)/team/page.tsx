"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamTab } from "./components/tabs/team/TeamTab";
import { ProfessionalsTab } from "./components/tabs/professionals/ProfessionalsTab";
import { RoomsTab } from "./components/tabs/rooms/RoomsTab";

function TeamContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const queryTenantId = searchParams?.get("tenant");
  const targetTenantId = queryTenantId || (session as any)?.tenantId;

  if (!targetTenantId) {
    return <div className="p-8 text-center text-muted-foreground">Nenhuma empresa selecionada.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      
      <Tabs defaultValue="acessos" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-4 h-auto gap-2">
          <TabsTrigger value="acessos">Acessos (Atendentes)</TabsTrigger>
          <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
          <TabsTrigger value="salas">Salas e Consultórios</TabsTrigger>
        </TabsList>

        <TabsContent value="acessos" className="space-y-6 mt-4">
          <TeamTab tenantId={targetTenantId as string} />
        </TabsContent>

        <TabsContent value="profissionais" className="space-y-6 mt-4">
          <ProfessionalsTab tenantId={targetTenantId as string} />
        </TabsContent>

        <TabsContent value="salas" className="space-y-6 mt-4">
          <RoomsTab tenantId={targetTenantId as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando equipe...</div>}>
      <TeamContent />
    </Suspense>
  );
}
