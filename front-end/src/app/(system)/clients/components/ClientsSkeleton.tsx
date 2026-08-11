import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClientsSkeleton() {
  return (
    <div className="space-y-8 pb-10 mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie a base de clientes do seu estabelecimento.</p>
        </div>
        <Button disabled><Plus className="w-4 h-4 mr-2"/> Novo Cliente</Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-4">
        {/* Fake Search */}
        <div className="flex items-center gap-2 max-w-sm">
          <div className="w-5 h-5 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-card border border-border rounded-md animate-pulse" />
        </div>

        {/* Fake Table */}
        <div className="border rounded-md">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[20%]">Nome</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[20%]">Telefone / WhatsApp</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[20%]">Data de Cadastro</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[15%]">Status</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground w-[25%]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="border-b border-border animate-pulse">
                  <td className="p-4"><div className="h-4 w-32 bg-muted rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-24 bg-muted rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-20 bg-muted rounded"></div></td>
                  <td className="p-4"><div className="h-5 w-16 bg-muted rounded-full"></div></td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <div className="h-9 w-9 bg-muted rounded-md"></div>
                      <div className="h-9 w-9 bg-muted rounded-md"></div>
                      <div className="h-9 w-9 bg-muted rounded-md"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
