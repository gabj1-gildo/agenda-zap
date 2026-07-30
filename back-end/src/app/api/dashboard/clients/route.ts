import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { clients } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId') || req.headers.get('tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }


    const { appointments } = await import('@/db/schema');
    
    let allClients: any[] = [];
    await withTenant(tenantId, async (tx) => {
      // Simplest way for now: fetch clients that have an appointment with this tenant
      const tenantAppointments = await tx.select({ clientId: appointments.clientId }).from(appointments).where(eq(appointments.tenantId, tenantId));
      
      const clientIds = [...new Set(tenantAppointments.map(a => a.clientId))];
      
      if (clientIds.length > 0) {
        const { inArray } = await import('drizzle-orm');
        allClients = await tx.query.clients.findMany({
          where: inArray(clients.id, clientIds),
          orderBy: [desc(clients.createdAt)]
        });
      }
    });

    return NextResponse.json({ success: true, data: allClients });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
