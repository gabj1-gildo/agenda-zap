import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { name, phone } = await req.json();

    const body = { name, phone };

    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const [updatedClient] = await db.update(clients)
      .set({ name: body.name, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
      .returning();


    if (!updatedClient) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedClient });
  } catch (error) {
    console.error('Failed to update client:', error);
    return NextResponse.json({ success: false, error: 'Failed to update client' }, { status: 500 });
  }
}
