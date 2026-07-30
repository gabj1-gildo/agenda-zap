import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema/appointments";
import { tenants } from "@/db/schema/tenants";
import { clients } from "@/db/schema/clients";
import { and, eq, gte, lte } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/services/whatsappService";
import { env } from '@/config/env';

export const dynamic = 'force-dynamic';

const CRON_SECRET = env.CRON_SECRET || 'my-super-secret-cron-key';

export async function processDailyReport() {
  try {
    const now = new Date();
    
    // InÃ­cio e fim do dia atual
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // InÃ­cio e fim do dia seguinte
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);

    // Buscar agendamentos de hoje
    const todayAppointments = await db
      .select({
        tenantId: appointments.tenantId,
        price: appointments.price,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          gte(appointments.date, startOfToday),
          lte(appointments.date, endOfToday)
        )
      );

    // Buscar agendamentos de amanhÃ£ para o resumo
    const tomorrowAppointments = await db
      .select({
        tenantId: appointments.tenantId,
        serviceName: appointments.serviceName,
        date: appointments.date,
        clientName: clients.name,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .where(
        and(
          eq(appointments.status, "PAGO"), // Assumindo 'PAGO' como confirmado
          gte(appointments.date, startOfTomorrow),
          lte(appointments.date, endOfTomorrow)
        )
      );

    // Buscar lojistas
    const tenantsList = await db.select().from(tenants);

    let reportsSent = 0;

    for (const tenant of tenantsList) {
      if (!tenant.phone) continue;

      const tenantTodayAppts = todayAppointments.filter(a => a.tenantId === tenant.id);
      const tenantTomorrowAppts = tomorrowAppointments.filter(a => a.tenantId === tenant.id);

      if (tenantTodayAppts.length === 0 && tenantTomorrowAppts.length === 0) {
        continue; // Nada a relatar para este lojista
      }

      // Faturamento e total de hoje (apenas PAGO)
      const confirmedOrCompleted = tenantTodayAppts.filter(a => a.status === 'PAGO');
      
      const revenue = confirmedOrCompleted.reduce((acc, curr) => acc + Number(curr.price), 0);
      const totalToday = confirmedOrCompleted.length;

      // Montar texto da agenda de amanhÃ£
      let tomorrowScheduleText = "Sem agendamentos confirmados para amanhÃ£.";
      if (tenantTomorrowAppts.length > 0) {
        // Ordenar por hora
        tenantTomorrowAppts.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        tomorrowScheduleText = tenantTomorrowAppts.map(a => {
          const time = a.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          return `- ${time}: ${a.serviceName} (${a.clientName || 'Sem nome'})`;
        }).join("\n");
      }

      const message = `*Fechamento DiÃ¡rio - AgendaZap*\nOlÃ¡, ${tenant.name}!\n\nðŸ“Š *Resumo de Hoje:*\n- Total de Atendimentos pagos: ${totalToday}\n- Faturamento: R$ ${revenue.toFixed(2)}\n\nðŸ“… *Sua Agenda de AmanhÃ£:*\n${tomorrowScheduleText}\n\nBom descanso!`;

      const success = await sendWhatsAppMessage(tenant.phone, message, tenant.id || undefined);
      if (success) {
        reportsSent++;
      }
    }

    return {
      success: true,
      message: "RelatÃ³rios enviados com sucesso",
      reportsSent
    };

  } catch (error) {
    console.error("Erro no processDailyReport:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const querySecret = url.searchParams.get('secret');
    const providedSecret = (authHeader && authHeader.startsWith('Bearer ')) 
      ? authHeader.split(' ')[1] 
      : querySecret;

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processDailyReport();
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
