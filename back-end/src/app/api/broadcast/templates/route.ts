import { NextResponse } from 'next/server';
import { db } from '@/db';
import { messageTemplates } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID obrigatório' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });

    const templates = await db.select()
      .from(messageTemplates)
      .where(eq(messageTemplates.tenantId, tenantId))
      .orderBy(desc(messageTemplates.createdAt));

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json({ success: false, error: 'Erro ao listar templates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID obrigatório' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });

    const { name, content, mediaUrl } = await req.json();

    if (!name || !content) {
      return NextResponse.json({ success: false, error: 'Nome e Conteúdo são obrigatórios' }, { status: 400 });
    }

    const [newTemplate] = await db.insert(messageTemplates)
      .values({
        tenantId,
        name,
        content,
        mediaUrl
      })
      .returning();

    return NextResponse.json({ success: true, data: newTemplate });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ success: false, error: 'Erro ao criar template' }, { status: 500 });
  }
}
