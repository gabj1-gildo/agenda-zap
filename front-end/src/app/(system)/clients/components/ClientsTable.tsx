import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, BookMarked } from "lucide-react";
import Link from "next/link";

interface ClientsTableProps {
  clients: any[];
  isLoading: boolean;
  onOpenSubsModal: (client: any) => void;
  onOpenEditModal: (client: any) => void;
  onDeleteClient: (id: string) => void;
}

export function ClientsTable({ clients, isLoading, onOpenSubsModal, onOpenEditModal, onDeleteClient }: ClientsTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-md p-12 text-center text-muted-foreground flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateString));
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
            <TableHead className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nome</TableHead>
            <TableHead className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Telefone / WhatsApp</TableHead>
            <TableHead className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Data de Cadastro</TableHead>
            <TableHead className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length > 0 ? (
            clients.map((client: any) => (
              <TableRow key={client.id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-primary">
                  <Link href={`/clients/${client.id}`} className="hover:underline">
                    {client.name || "Sem nome"}
                  </Link>
                </TableCell>
                <TableCell>{client.phone || "-"}</TableCell>
                <TableCell>{formatDate(client.createdAt)}</TableCell>
                <TableCell>
                  <Badge className={client.status === "Ativo" ? "bg-green-600" : "bg-gray-500"}>
                    {client.status || "Ativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" onClick={() => onOpenSubsModal(client)} title="Ver Assinaturas">
                    <BookMarked className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => onOpenEditModal(client)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDeleteClient(client.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Nenhum cliente encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
