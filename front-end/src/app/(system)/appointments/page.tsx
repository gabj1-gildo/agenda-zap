import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AppointmentsWrapper } from "./components/AppointmentsWrapper";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session as any)?.tenantId;

  if (!token || !tenantId) return <div>Acesso Restrito</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Listagem de Agendamentos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe e gerencie todos os agendamentos realizados.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/calendar">
            <Button variant="outline" className="border-border">
              <Calendar className="w-4 h-4 mr-2"/>
              Ver no Calendário
            </Button>
          </Link>
        </div>
      </div>

      <AppointmentsWrapper tenantId={tenantId} token={token} />
    </div>
  );
}
