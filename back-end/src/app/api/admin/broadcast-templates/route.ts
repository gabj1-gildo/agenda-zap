import { NextResponse } from 'next/server';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'system_broadcast_templates')
    });

    const templates = setting?.value ? JSON.parse(setting.value) : [];

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching broadcast templates:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'Título e conteúdo são obrigatórios' }, { status: 400 });
    }

    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'system_broadcast_templates')
    });

    const currentTemplates: any[] = setting?.value ? JSON.parse(setting.value) : [];
    
    const newTemplate = {
      id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      content,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [newTemplate, ...currentTemplates];

    await db.insert(systemSettings)
      .values({
        key: 'system_broadcast_templates',
        value: JSON.stringify(updatedTemplates),
        description: 'Templates de disparos globais do sistema (SuperAdmin)'
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: JSON.stringify(updatedTemplates), updatedAt: new Date() }
      });

    return NextResponse.json({ success: true, data: newTemplate, message: 'Template salvo com sucesso!' });
  } catch (error) {
    console.error('Error saving broadcast template:', error);
    return NextResponse.json({ success: false, message: 'Erro ao salvar template' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID do template é obrigatório' }, { status: 400 });
    }

    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'system_broadcast_templates')
    });

    const currentTemplates: any[] = setting?.value ? JSON.parse(setting.value) : [];
    const updatedTemplates = currentTemplates.filter(t => t.id !== id);

    await db.insert(systemSettings)
      .values({
        key: 'system_broadcast_templates',
        value: JSON.stringify(updatedTemplates),
        description: 'Templates de disparos globais do sistema (SuperAdmin)'
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: JSON.stringify(updatedTemplates), updatedAt: new Date() }
      });

    return NextResponse.json({ success: true, message: 'Template excluído com sucesso!' });
  } catch (error) {
    console.error('Error deleting broadcast template:', error);
    return NextResponse.json({ success: false, message: 'Erro ao excluir template' }, { status: 500 });
  }
}
