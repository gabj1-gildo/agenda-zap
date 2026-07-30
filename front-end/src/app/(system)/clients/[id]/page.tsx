import { getBackendUrl } from "@/lib/api";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ClientProfileTabs from "./ClientProfileTabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getClient(tenantId: string, token: string, clientId: string) {
  try {
    const res = await fetch(getBackendUrl(`/api/dashboard/clients?tenantId=${tenantId}`), { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const client = json.data?.find((c: any) => c.id === clientId);
    return client || null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default async function ClientProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session?.user as any)?.tenantId;

  if (!token || !tenantId) return <div>Acesso negado.</div>;

  const client = await getClient(tenantId, token, params.id);

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
