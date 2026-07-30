import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userTenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = verifyAuth(req);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, message: 'Tenant ID required' }, { status: 400 });

    const { id } = await params;
    const userId = id;
    const { permissions } = await req.json();

    await db.update(userTenants)
      .set({ permissions })
      .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = verifyAuth(req);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, message: 'Tenant ID required' }, { status: 400 });

    const { id } = await params;
    const userId = id;

    // TODO: A tenant OWNER cannot delete themselves if they are the only owner, but for simplicity:
    await db.delete(userTenants)
      .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user from team:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
