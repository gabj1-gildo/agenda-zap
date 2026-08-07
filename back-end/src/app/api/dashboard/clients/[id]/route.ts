import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();

    let updatedClient: any = null;
    await withTenant(tenantId, async (tx) => {
      const updated = await tx.update(clients)
        .set({
          name: body.name !== undefined ? body.name : undefined,
          phone: body.phone !== undefined ? body.phone : undefined,
          status: body.status !== undefined ? body.status : undefined,
          funnelStage: body.funnelStage !== undefined ? body.funnelStage : undefined,
          updatedAt: new Date()
        })
        .where(and(eq(clients.id, (await params).id), eq(clients.tenantId, tenantId)))
        .returning();
      updatedClient = updated[0];
    });

    if (!updatedClient) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedClient });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    let deletedClient: any = null;
    await withTenant(tenantId, async (tx) => {
      const deleted = await tx.delete(clients)
        .where(and(eq(clients.id, (await params).id), eq(clients.tenantId, tenantId)))
        .returning();
      deletedClient = deleted[0];
    });

    if (!deletedClient) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: deletedClient });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
