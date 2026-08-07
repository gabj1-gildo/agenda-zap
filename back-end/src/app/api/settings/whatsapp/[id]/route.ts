import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenantPhones } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { env } from '@/config/env';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const phoneId = params.id;

    // Buscar instância no banco
    const phoneRecord = await db.query.tenantPhones.findFirst({
      where: and(eq(tenantPhones.id, phoneId), eq(tenantPhones.tenantId, tenantId))
    });

    if (!phoneRecord) {
      return NextResponse.json({ success: false, error: 'Instância não encontrada' }, { status: 404 });
    }

    const EVOLUTION_URL = env.EVOLUTION_API_URL ? env.EVOLUTION_API_URL.replace(/\/$/, '') : undefined;
    const EVOLUTION_KEY = env.EVOLUTION_API_KEY || '';

    // Deletar da Evolution API se estiver configurada e tiver nome
    if (EVOLUTION_URL && phoneRecord.evolutionInstanceName) {
      try {
        await fetch(`${EVOLUTION_URL}/instance/logout/${phoneRecord.evolutionInstanceName}`, {
          method: 'DELETE',
          headers: { apikey: EVOLUTION_KEY }
        });
        await fetch(`${EVOLUTION_URL}/instance/delete/${phoneRecord.evolutionInstanceName}`, {
          method: 'DELETE',
          headers: { apikey: EVOLUTION_KEY }
        });
      } catch (e) {
        console.error("Erro ao deletar instância na Evolution API", e);
      }
    }

    // Deletar do banco de dados
    await db.delete(tenantPhones).where(eq(tenantPhones.id, phoneId));

    return NextResponse.json({ success: true, message: 'Instância removida com sucesso' });

  } catch (error: any) {
    console.error('Error deleting tenant phone:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const phoneId = params.id;

    const phoneRecord = await db.query.tenantPhones.findFirst({
      where: and(eq(tenantPhones.id, phoneId), eq(tenantPhones.tenantId, tenantId))
    });

    if (!phoneRecord || !phoneRecord.evolutionInstanceName) {
      return NextResponse.json({ success: false, error: 'Instância não encontrada' }, { status: 404 });
    }

    const EVOLUTION_URL = env.EVOLUTION_API_URL ? env.EVOLUTION_API_URL.replace(/\/$/, '') : undefined;
    const EVOLUTION_KEY = env.EVOLUTION_API_KEY || '';

    if (!EVOLUTION_URL) return NextResponse.json({ success: false, error: 'Evolution API não configurada' }, { status: 500 });

    const statusRes = await fetch(
      `${EVOLUTION_URL}/instance/connectionState/${phoneRecord.evolutionInstanceName}`,
      { headers: { apikey: EVOLUTION_KEY } }
    );
    const statusData = await statusRes.json();
    const state: string = statusData?.instance?.state || 'DISCONNECTED';

    // Atualizar status no banco
    await db
      .update(tenantPhones)
      .set({ evolutionInstanceStatus: state.toUpperCase(), updatedAt: new Date() })
      .where(eq(tenantPhones.id, phoneId));

    let qrCode: string | null = null;
    if (state !== 'open') {
      try {
        const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${phoneRecord.evolutionInstanceName}`, {
          headers: { apikey: EVOLUTION_KEY }
        });
        const connectData = await connectRes.json();
        qrCode = connectData?.base64 || connectData?.qrcode?.base64 || null;
      } catch (e) {
        console.error("Erro ao gerar novo QR code", e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...phoneRecord,
        evolutionInstanceStatus: state.toUpperCase(),
        qrCode
      }
    });

  } catch (error: any) {
    console.error('Error fetching tenant phone status:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

