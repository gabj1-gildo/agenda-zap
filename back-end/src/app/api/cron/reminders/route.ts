import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema/appointments";
import { clients } from "@/db/schema/clients";
import { tenants } from "@/db/schema/tenants";
import { and, eq, gte, lte } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/services/whatsappService";
import { env } from '@/config/env';

// Pode ser necessário forçar o método GET como dinâmico para evitar cache na Vercel
export const dynamic = 'force-dynamic';

const CRON_SECRET = env.CRON_SECRET || 'my-super-secret-cron-key';

export async function processReminders() {
  try {
    const now = new Date();
    // Próximas 2 a 3 horas
    const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const next3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Buscar agendamentos confirmados nas próximas 2 a 3 horas
    const upcomingAppointments = await db
      .select({
        appointmentId: appointments.id,
        serviceName: appointments.serviceName,
        date: appointments.date,
        clientName: clients.name,
        clientPhone: clients.phone,
        tenantId: tenants.id,
        tenantInstance: tenants.evolutionInstanceName,
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .innerJoin(tenants, eq(appointments.tenantId, tenants.id))
      .where(
        and(
          eq(appointments.status, "PAGO"),
          gte(appointments.date, next2Hours),
          lte(appointments.date, next3Hours)
        )
      );

    let messagesSent = 0;

    for (const appt of upcomingAppointments) {
      if (!appt.clientPhone) continue;

      const formattedTime = appt.date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = `Olá ${appt.clientName || ""}! Tudo bem?\n\nPassando para lembrar do seu agendamento de *${appt.serviceName}* hoje às *${formattedTime}*.\n\nNos vemos em breve!`;

      // Formatar o telefone para o padrão do WhatsApp se necessário
      // A função sendWhatsAppMessage lida com a string remoteJid (ex: 5511999999999)
      const jid = `${appt.clientPhone}@s.whatsapp.net`;
      const success = await sendWhatsAppMessage(jid, message, appt.tenantId || undefined);
      
      if (success) {
        messagesSent++;
      }
    }

    return {
      success: true,
      message: "Lembretes enviados com sucesso",
      totalFound: upcomingAppointments.length,
      totalSent: messagesSent,
    };
  } catch (error) {
    console.error("Erro no processReminders:", error);
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

    const result = await processReminders();
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
