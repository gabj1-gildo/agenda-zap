import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Suspense } from "react";
import { CalendarSkeleton } from "./components/CalendarSkeleton";
import { CalendarClient } from "./components/CalendarClient";
import { getBackendUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session as any)?.tenantId;
  const token = (session?.user as any)?.accessToken;

  if (!tenantId) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-muted text-muted-foreground">
          🗓
        </div>
        <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">Agenda indisponível</h2>
        <p className="text-sm text-muted-foreground">
          Selecione uma empresa no topo da tela para acessar a agenda.
        </p>
      </div>
    );
  }

  // Ao invés de aguardar os dados no servidor e bloquear a tela (causando sensação de lentidão),
  // renderizamos a "casca" do calendário instantaneamente. O fetch inicial será feito pelo Client Component.
  return (
    <CalendarClient 
      tenantId={tenantId}
      token={token}
      initialAppointments={[]}
      initialMode="GERAL"
    />
  );
}
