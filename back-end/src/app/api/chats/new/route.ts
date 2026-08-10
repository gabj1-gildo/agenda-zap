import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, chatSessions, tenants, tenantPhones } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/services/whatsappService';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { tenantId, phone, name, initialMessage } = await req.json();

    if (!tenantId || !phone) {
      return NextResponse.json({ success: false, error: 'TenantId and Phone are required' }, { status: 400 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId)
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Empresa não encontrada' }, { status: 404 });
    }

    const isConnected = tenant.evolutionInstanceStatus === 'OPEN' || 
      tenant.whatsappProvider === 'META_CLOUD' ||
      (await db.select().from(tenantPhones).where(and(eq(tenantPhones.tenantId, tenantId), eq(tenantPhones.evolutionInstanceStatus, 'OPEN'))).limit(1)).length > 0;

    if (!isConnected) {
      return NextResponse.json({ success: false, error: 'O WhatsApp da empresa não está conectado.' }, { status: 400 });
    }

    // 1. Find or create client
    let client = await db.query.clients.findFirst({
      where: eq(clients.phone, phone)
    });

    if (!client) {
      const inserted = await db.insert(clients).values({
        phone: phone,
        name: name || 'Novo Cliente',
        whatsappName: name || 'Novo Cliente',
      }).returning();
      client = inserted[0];
    } else if (name && (!client.name || client.name === '')) {
      await db.update(clients).set({ name }).where(eq(clients.id, client.id));
    }

    // 2. Find or create active chat session
    let session = await db.query.chatSessions.findFirst({
      where: and(
        eq(chatSessions.clientId, client.id),
        eq(chatSessions.tenantId, tenantId),
        eq(chatSessions.status, 'ACTIVE')
      )
    });

    if (!session) {
      const insertedSession = await db.insert(chatSessions).values({
        clientId: client.id,
        tenantId: tenantId,
        status: 'ACTIVE',
        history: []
      }).returning();
      session = insertedSession[0];
    }

    // 3. Send initial message if provided
    if (initialMessage && initialMessage.trim() !== '') {
      await sendWhatsAppMessage(phone, initialMessage, tenant?.id || undefined);
      
      // Update history
      const currentHistory = (session.history as any[]) || [];
      const updatedHistory = [...currentHistory, { role: 'system', content: initialMessage }];
      
      await db.update(chatSessions)
        .set({ history: updatedHistory, updatedAt: new Date() })
        .where(eq(chatSessions.id, session.id));
        
      session.history = updatedHistory;
    }

    // Fetch client to return with session
    const fullSession = await db.query.chatSessions.findFirst({
      where: eq(chatSessions.id, session.id),
      with: { client: true }
    });

    return NextResponse.json({ success: true, data: fullSession });

  } catch (error) {
    console.error('Error creating new chat:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
