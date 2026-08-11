"use client";

import { useClients } from "../../hooks/useClients";
import ClientProfileTabs from "../ClientProfileTabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientProfileSkeleton } from "./ClientProfileSkeleton";

export function ClientProfileWrapper({ tenantId, token, clientId }: { tenantId: string, token: string, clientId: string }) {
  const { clients, isLoading } = useClients(tenantId);
  
  if (isLoading) {
    return <ClientProfileSkeleton />;
  }

  const client = clients.find((c: any) => c.id === clientId);

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <Link href="/clients">
          <Button variant="outline" className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{client.name || 'Sem nome'}</h1>
          <p className="text-muted-foreground mt-1">{client.phone}</p>
        </div>
      </div>

      <ClientProfileTabs clientId={client.id} tenantId={tenantId} token={token} />
    </div>
  );
}
