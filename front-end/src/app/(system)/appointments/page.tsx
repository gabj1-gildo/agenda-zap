export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AppointmentsContent } from "./components/AppointmentsContent";
import { AppointmentsSkeleton } from "./components/AppointmentsSkeleton";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session?.user as any)?.tenantId;

  if (!token || !tenantId) return (
    <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-muted text-muted-foreground">
        📅
      </div>
      <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">Agendamentos indisponíveis</h2>
      <p className="text-sm text-muted-foreground">
        Selecione uma empresa no topo da tela para acessar os agendamentos.
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header instantly rendered */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Agenda
          </p>
          <h1 className="font-display font-extrabold text-4xl text-foreground">
            Agendamentos
          </h1>
        </div>
      </div>

      <Suspense fallback={<AppointmentsSkeleton />}>
        <AppointmentsContent searchParams={searchParams} tenantId={tenantId} token={token} />
      </Suspense>
    </div>
  );
}
