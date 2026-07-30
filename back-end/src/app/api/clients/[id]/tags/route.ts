import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clientTags } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('tenant-id');
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    if (!tenantId || !clientId) {
      return NextResponse.json({ success: false, error: 'Unauthorized or missing client ID' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { tagId } = await req.json();

    if (!tagId) {
      return NextResponse.json({ success: false, error: 'tagId is required' }, { status: 400 });
    }

    await db.insert(clientTags).values({
      clientId,
      tagId,
    }).onConflictDoNothing(); // Ignore if already assigned

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning tag:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('tenant-id');
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    if (!tenantId || !clientId) {
      return NextResponse.json({ success: false, error: 'Unauthorized or missing client ID' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { tagId } = await req.json();

    if (!tagId) {
      return NextResponse.json({ success: false, error: 'tagId is required' }, { status: 400 });
    }

    await db.delete(clientTags)
      .where(and(eq(clientTags.clientId, clientId), eq(clientTags.tagId, tagId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tag:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
