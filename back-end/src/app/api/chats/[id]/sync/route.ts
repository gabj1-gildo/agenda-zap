import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { fetchWhatsAppHistory } from '@/services/evolutionApi';

import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
        tenant: true,
        client: true,
      }
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const remoteJid = `${session.client.phone}@s.whatsapp.net`;
    const historicalMessages = await fetchWhatsAppHistory(remoteJid, 50);

    if (!historicalMessages || historicalMessages.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhuma mensagem encontrada para sincronizar.', data: session });
    }

    // Como as mensagens vindas da API sao cronologicas,
    // podemos simplesmente substituir o histórico antigo pelo histórico trazido do banco de dados oficial do WhatsApp/Evolution.
    const [updatedSession] = await db.update(chatSessions)
      .set({ 
        history: historicalMessages, 
        updatedAt: new Date() 
      })
      .where(eq(chatSessions.id, session.id))
      .returning();

    return NextResponse.json({ success: true, data: updatedSession });
  } catch (error) {
    console.error('Failed to sync history:', error);
    return NextResponse.json({ success: false, error: 'Failed to sync history' }, { status: 500 });
  }
}
