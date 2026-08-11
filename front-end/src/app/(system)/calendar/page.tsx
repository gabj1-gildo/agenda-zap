import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Suspense } from "react";
import { CalendarSkeleton } from "./components/CalendarSkeleton";
import { CalendarClient } from "./components/CalendarClient";
import { getBackendUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

function getMonthDays(base: Date) {
  const firstDay = new Date(base.getFullYear(), base.getMonth(), 1);
  const startOffset = firstDay.getDay(); 
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);
  
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  const endOffset = 6 - lastDay.getDay();
  const totalDays = startOffset + lastDay.getDate() + endOffset;
  const numCells = totalDays <= 35 ? 35 : 42;
  
  return Array.from({ length: numCells }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });
}

async function fetchInitialAgenda(tenantId: string, token: string) {
  try {
    const baseDate = new Date();
    const days = getMonthDays(baseDate);
    const startStr = days[0].toISOString();
    const endStr = days[days.length - 1].toISOString();

    const res = await fetch(getBackendUrl(`/api/tenants/${tenantId}/agenda?start=${startStr}&end=${endStr}`), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    
    const data = await res.json();
    if (data.success) {
      return {
        appointments: data.data,
        schedulingMode: data.schedulingMode || "GERAL"
      };
    }
  } catch (error) {
    console.error("Error fetching initial agenda:", error);
  }
  return { appointments: [], schedulingMode: "GERAL" };
}

async function CalendarLoader({ tenantId, token }: { tenantId: string, token: string }) {
  const { appointments, schedulingMode } = await fetchInitialAgenda(tenantId, token);
  
  return (
    <CalendarClient 
      tenantId={tenantId}
      token={token}
      initialAppointments={appointments}
      initialMode={schedulingMode}
    />
  );
}

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

  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarLoader tenantId={tenantId} token={token} />
    </Suspense>
  );
}
