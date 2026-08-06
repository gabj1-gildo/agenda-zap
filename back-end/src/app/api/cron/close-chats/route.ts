import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatSessions } from '@/db/schema';
import { eq, or, and, lt } from 'drizzle-orm';
import { subHours, subMinutes } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Para proteger a rota de cron, podemos verificar um Bearer token no Header,
    // ou apenas garantir que seja chamada por um serviço autorizado (Vercel Cron / Render).
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'secret-cron-token';
    
    // Se quiser manter seguro:
    // if (authHeader !== `Bearer ${expectedToken}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const now = new Date();
    // 23h e 59m = 23.98 hours = 1439 minutes
    const updatedThreshold = subMinutes(now, 1439);
    // 36h
    const createdThreshold = subHours(now, 36);

    const staleSessions = await db.query.chatSessions.findMany({
      where: and(
        eq(chatSessions.status, 'ACTIVE'),
        or(
          lt(chatSessions.updatedAt, updatedThreshold),
          lt(chatSessions.createdAt, createdThreshold)
        )
      )
    });

    if (staleSessions.length > 0) {
      await db.update(chatSessions)
        .set({ status: 'CLOSED' })
        .where(
          and(
            eq(chatSessions.status, 'ACTIVE'),
            or(
              lt(chatSessions.updatedAt, updatedThreshold),
              lt(chatSessions.createdAt, createdThreshold)
            )
          )
        );
    }

    return NextResponse.json({
      success: true,
      closedCount: staleSessions.length,
      message: `${staleSessions.length} chat sessions were closed due to timeout.`
    });
  } catch (error: any) {
    console.error('Error closing chats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
