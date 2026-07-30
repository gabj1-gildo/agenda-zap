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

    const settings = await db.select().from(systemSettings);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { key, value, description } = body;

    if (!key || !value) {
      return NextResponse.json({ success: false, message: 'Key and value are required' }, { status: 400 });
    }

    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key)
    });

    if (existing) {
      await db.update(systemSettings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings)
        .values({ key, value, description });
    }

    return NextResponse.json({ success: true, message: 'Setting saved successfully' });
  } catch (error) {
    console.error('Error saving system setting:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
