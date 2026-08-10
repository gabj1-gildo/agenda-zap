import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, chatSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

const STAGE_MAP: Record<string, string> = {
  espera:                'espera',
  atendimento_ia:        'ia',
  atendimento_humano:    'humano',
  aguardando_pagamento:  'pagamento',
  finalizado:            'finalizado',
  perdido:               'perdido',
};

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Fetch all clients for tenant
    const allClients = await db.query.clients.findMany({
      where: eq(clients.tenantId, tenantId),
      orderBy: (c, { desc }) => [desc(c.updatedAt)],
    });

    // Fetch active chat sessions
    const sessions = await db.query.chatSessions.findMany({
      where: and(eq(chatSessions.tenantId, tenantId)),
    });

    const sessionMap = new Map(sessions.map(s => [s.clientId, s]));

    // Group by stage
    const board: Record<string, any[]> = {
      espera: [], ia: [], humano: [], pagamento: [], finalizado: [], perdido: [],
    };

    for (const client of allClients) {
      const rawStage = client.funnelStage || 'espera';
      const stage = STAGE_MAP[rawStage] || 'espera';
      const session = sessionMap.get(client.id);

      board[stage].push({
        id: client.id,
        name: client.name || client.whatsappName || '.',
        phone: client.phone,
        funnelStage: rawStage,
        status: session?.status === 'ACTIVE' ? 'online' : undefined,
        currentIntent: session?.currentIntent,
        updatedAt: client.updatedAt,
      });
    }

    const stats = {
      total: allClients.length,
      conversion: allClients.length > 0
        ? Math.round((board.finalizado.length / allClients.length) * 1000) / 10
        : 0,
      inAttendance: board.ia.length + board.humano.length,
    };

    return NextResponse.json({ success: true, data: { board, stats } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[GET /api/funil] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
