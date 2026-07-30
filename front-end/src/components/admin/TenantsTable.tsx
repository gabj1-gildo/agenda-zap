import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function TenantsTable({ tenants }: { tenants: any[] }) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Lojistas da Plataforma</CardTitle>
        <CardDescription>
          Gerencie seus usuários e acompanhe as configurações ativas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Lista completa de usuários registrados (Tenants).</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone / WhatsApp</TableHead>
              <TableHead>Chave PIX</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants && tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{tenant.phone || "Não informado"}</TableCell>
                <TableCell>{tenant.pixKey || "Pendente"}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Ativo
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {(!tenants || tenants.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum lojista encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
