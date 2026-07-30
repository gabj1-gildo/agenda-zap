import { NextResponse } from 'next/server';
import { db } from '@/db';
import { aiModels } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Both Superadmin and Tenant Admins need to list active models to fill their selects
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'SUPERADMIN';
    const models = await db.select().from(aiModels);

    // Filter active only for normal users, superadmin sees all
    const result = isSuperAdmin ? models : models.filter(m => m.isActive);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching ai models:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { provider, modelId, name, isActive } = await req.json();

    if (!provider || !modelId || !name) {
      return NextResponse.json({ success: false, message: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    await db.insert(aiModels).values({
      provider,
      modelId,
      name,
      isActive: isActive !== undefined ? isActive : true
    });

    return NextResponse.json({ success: true, message: 'Modelo criado com sucesso' });
  } catch (error) {
    console.error('Error creating ai model:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
