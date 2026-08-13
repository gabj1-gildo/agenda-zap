import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = req.headers.get('tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updateData: any = { updatedAt: new Date() };
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
    if (body.messageTemplate) updateData.messageTemplate = body.messageTemplate;

    if (Object.keys(updateData).length === 1) { // only updatedAt
      return NextResponse.json({ success: true, message: 'No fields to update' });
    }

    const [updated] = await db.update(automations)
      .set(updateData)
      .where(
        and(
          eq(automations.id, id),
          eq(automations.tenantId, tenantId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Automation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating automation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = req.headers.get('tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db.delete(automations)
      .where(
        and(
          eq(automations.id, id),
          eq(automations.tenantId, tenantId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Automation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Automation deleted' });
  } catch (error: any) {
    console.error('Error deleting automation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
