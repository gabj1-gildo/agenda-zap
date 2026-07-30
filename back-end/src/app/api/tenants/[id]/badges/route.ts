import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, chatSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    // Pagamentos pendentes
    const pendingAppointments = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.status, 'PENDENTE')));

    // Conversas não lidas
    const activeChats = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(and(
        eq(chatSessions.tenantId, tenantId), 
        eq(chatSessions.status, 'ACTIVE'),
        eq(chatSessions.hasUnread, true)
      ));

    return NextResponse.json({
      success: true,
      data: {
        payments: pendingAppointments.length,
        chats: activeChats.length,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao buscar badges' }, { status: 500 });
  }
}
