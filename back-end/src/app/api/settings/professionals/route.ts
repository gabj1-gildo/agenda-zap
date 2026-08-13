export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { professionals, professionalServices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const data = await db.select().from(professionals).where(eq(professionals.tenantId, tenantId));
    
    // Buscar servicos de cada
    const ps = await db.select().from(professionalServices);
    const servicesByProf: Record<string, string[]> = {};
    ps.forEach(p => {
      if (!servicesByProf[p.professionalId]) servicesByProf[p.professionalId] = [];
      servicesByProf[p.professionalId].push(p.serviceId);
    });

    const populated = data.map(d => ({ ...d, serviceIds: servicesByProf[d.id] || [] }));

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, error: 'Nome é obrigatório' }, { status: 400 });

    const [created] = await db.insert(professionals).values({
      tenantId,
      name: body.name,
      description: body.description,
      avatarUrl: body.avatarUrl,
      userId: body.userId || null,
      isActive: body.isActive ?? true,
    }).returning();

    if (body.serviceIds && Array.isArray(body.serviceIds)) {
      for (const svcId of body.serviceIds) {
        await db.insert(professionalServices).values({ professionalId: created.id, serviceId: svcId });
      }
    }

    return NextResponse.json({ success: true, data: { ...created, serviceIds: body.serviceIds || [] } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
