import { NextResponse } from 'next/server';
import { db } from '@/db';
import { plans } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const activePlans = await db.query.plans.findMany({
      where: eq(plans.isActive, true),
      orderBy: [desc(plans.price)]
    });

    return NextResponse.json({ success: true, data: activePlans });
  } catch (error) {
    console.error('[PUBLIC PLANS ERROR]', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar planos' }, { status: 500 });
  }
}
