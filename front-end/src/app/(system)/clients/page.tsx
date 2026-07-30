export const dynamic = 'force-dynamic';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getBackendUrl } from "@/lib/api";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getClients(tenantId: string, token: string) {
  try {
    const res = await fetch(getBackendUrl(`/api/dashboard/clients?tenantId=${tenantId}`), { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session?.user as any)?.tenantId;

  if (!token || !tenantId) return <div>Acesso negado.</div>;

  const clients = await getClients(tenantId, token);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
        <p className="text-muted-foreground mt-1">Gerencie a base de clientes do seu estabelecimento.</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone / WhatsApp</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client: any) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <a href={`/clients/${client.id}`} className="block w-full h-full text-primary hover:underline">
                        {client.name || 'Sem nome'}
                      </a>
                    </TableCell>
                    <TableCell>
                      {client.phone || '-'}
                    </TableCell>
                    <TableCell>
                      {formatDate(client.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
