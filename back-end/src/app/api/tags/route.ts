import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Missing Tenant ID' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const tenantTags = await db.query.tags.findMany({
      where: eq(tags.tenantId, tenantId),
      orderBy: (tags, { desc }) => [desc(tags.createdAt)]
    });

    return NextResponse.json({ success: true, data: tenantTags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Missing Tenant ID' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { name, color } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Tag name is required' }, { status: 400 });
    }

    const newTag = await db.insert(tags).values({
      tenantId,
      name,
      color: color || '#3b82f6',
    }).returning();

    return NextResponse.json({ success: true, data: newTag[0] });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
