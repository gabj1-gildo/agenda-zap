import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatSessions, clients, tenantPhones } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/services/whatsappService';

import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { message } = await req.json();
    if (!message || message.trim() === '') {
      return NextResponse.json({ success: false, error: 'Empty message' }, { status: 400 });
    }

    const tenantId = req.headers.get('x-tenant-id') || req.headers.get('x-user-tenant') || req.headers.get('tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing tenantId' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const session = await db.query.chatSessions.findFirst({
      where: and(eq(chatSessions.id, id), eq(chatSessions.tenantId, tenantId)),
      with: {
        client: true,
        tenant: true
      }
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const isConnected = session.tenant?.evolutionInstanceStatus === 'OPEN' || 
      session.tenant?.whatsappProvider === 'META_CLOUD' ||
      (await db.select().from(tenantPhones).where(and(eq(tenantPhones.tenantId, session.tenant.id), eq(tenantPhones.evolutionInstanceStatus, 'OPEN'))).limit(1)).length > 0;

    if (!isConnected) {
      return NextResponse.json({ success: false, error: 'O WhatsApp da empresa não está conectado.' }, { status: 400 });
    }

    // O Evolution API requer o remoteJid (ex: 5511999999999@s.whatsapp.net)
    const remoteJid = `${session.client.phone}@s.whatsapp.net`;

    const instanceName = (session.context as any)?.evolutionInstanceName;

    // Enviar mensagem via Evolution API (forçando a instância correta se disponível)
    await sendWhatsAppMessage(remoteJid, message, instanceName || session.tenant.id);

    // Salvar no histórico
    const currentHistory = (session.history as any[]) || [];
    currentHistory.push({ role: 'system', content: message });

    const [updatedSession] = await db.update(chatSessions)
      .set({ history: currentHistory, status: 'HUMAN', updatedAt: new Date() })
      .where(eq(chatSessions.id, session.id))
      .returning();

    await db.update(clients)
      .set({ funnelStage: 'atendimento_humano', updatedAt: new Date() })
      .where(eq(clients.id, session.clientId));

    return NextResponse.json({ success: true, data: updatedSession });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
