import { NextResponse } from 'next/server';
import { db } from '@/db';
import { planFeatures } from '@/db/schema';
import { verifyAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allFeatures = await db.query.planFeatures.findMany({
      orderBy: (features, { asc }) => [asc(features.createdAt)]
    });

    return NextResponse.json({ success: true, data: allFeatures });
  } catch (error) {
    console.error("Erro ao listar features:", error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório' }, { status: 400 });
    }

    const [newFeature] = await db.insert(planFeatures).values({ name }).returning();

    return NextResponse.json({ success: true, data: newFeature });
  } catch (error) {
    console.error("Erro ao criar feature:", error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    await db.delete(planFeatures).where(eq(planFeatures.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar feature:", error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
