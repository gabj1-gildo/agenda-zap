import { NextResponse } from 'next/server';
import { db } from '@/db';
import { aiModels } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { provider, modelId, name, isActive } = await req.json();
    const { id } = await params;

    await db.update(aiModels)
      .set({ provider, modelId, name, isActive, updatedAt: new Date() })
      .where(eq(aiModels.id, id));

    return NextResponse.json({ success: true, message: 'Modelo atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating ai model:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await db.delete(aiModels).where(eq(aiModels.id, id));

    return NextResponse.json({ success: true, message: 'Modelo deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting ai model:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
