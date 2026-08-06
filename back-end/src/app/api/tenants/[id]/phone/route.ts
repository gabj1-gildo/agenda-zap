import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/config/env';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

const EVOLUTION_URL = env.EVOLUTION_API_URL ? env.EVOLUTION_API_URL.replace(/\/$/, '') : undefined;
const EVOLUTION_KEY = env.EVOLUTION_API_KEY || '';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!EVOLUTION_URL) {
      return NextResponse.json({ error: 'EVOLUTION_API_URL não configurada no .env' }, { status: 500 });
    }

    const { phone } = await req.json();
    const { id: tenantId } = await params;

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Número obrigatório' }, { status: 400 });
    }

    // Verificar se o telefone já está em uso por outra empresa
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.phone, phone))
      .limit(1);

    if (existingTenant && existingTenant.id !== tenantId) {
      return NextResponse.json(
        { success: false, message: 'Este número de WhatsApp já está sendo utilizado por outra empresa no sistema.' },
        { status: 400 }
      );
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) {
      return NextResponse.json({ success: false, message: 'Empresa não encontrada' }, { status: 404 });
    }

    // Nome da instância: slug da empresa + _AgendaZap
    const instanceName = `${tenant.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 20)}_AgendaZap`;

    // Tentar criar instância na Evolution API
    let evoRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    let evoData = await evoRes.json();

    // Se a instância já existir, tentamos conectar nela em vez de falhar
    if (!evoRes.ok && evoData.response?.message?.[0]?.includes('already in use')) {
      evoRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        headers: { apikey: EVOLUTION_KEY }
      });
      evoData = await evoRes.json();
    } else if (!evoRes.ok) {
      console.error('Evolution API erro ao criar:', evoData);
      return NextResponse.json({ 
        success: false, 
        message: 'Erro na API do WhatsApp. Tente novamente.',
        errorDetails: evoData
      }, { status: 500 });
    }

    const qrCode: string | null = evoData?.qrcode?.base64 || evoData?.base64 || null;

    // Configurar Webhook
    const appUrl = env.APP_URL || (req.headers.get('origin') || `http://${req.headers.get('host')}`);
    const webhookUrl = `${appUrl}/api/webhooks/whatsapp`;
    
    await fetch(`${EVOLUTION_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: [
            "MESSAGES_UPSERT",
            "CONNECTION_UPDATE"
          ]
        }
      }),
    }).catch(err => console.error("Erro ao configurar webhook:", err));

    // Salvar no banco
    await db
      .update(tenants)
      .set({
        phone,
        evolutionInstanceName: instanceName,
        evolutionInstanceStatus: 'PENDING_QR',
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));

    return NextResponse.json({
      success: true,
      data: {
        instanceName,
        qrCode,
        status: 'PENDING_QR',
      },
    });
  } catch (error) {
    console.error('Phone/Evolution error:', error);
    return NextResponse.json({ success: false, message: 'Erro interno ao criar instância. O número pode ser inválido ou o banco falhou.' }, { status: 500 });
  }
}

// GET — checar status da instância e buscar novo QR se necessário
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    
    const user = verifyAuth(_req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant?.evolutionInstanceName) {
      return NextResponse.json({ success: false, message: 'Sem instância vinculada' }, { status: 404 });
    }

    const statusRes = await fetch(
      `${EVOLUTION_URL}/instance/connectionState/${tenant.evolutionInstanceName}`,
      { headers: { apikey: EVOLUTION_KEY } }
    );
    const statusData = await statusRes.json();
    const state: string = statusData?.instance?.state || 'DISCONNECTED';

    // Atualizar status no banco
    await db
      .update(tenants)
      .set({ evolutionInstanceStatus: state.toUpperCase(), updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    // Se ainda não conectado, pegar novo QR
    let qrCode: string | null = null;
    if (state !== 'open') {
      const qrRes = await fetch(
        `${EVOLUTION_URL}/instance/connect/${tenant.evolutionInstanceName}`,
        { headers: { apikey: EVOLUTION_KEY } }
      );
      const qrData = await qrRes.json();
      qrCode = qrData?.base64 || null;
    }

    return NextResponse.json({
      success: true,
      data: { instanceName: tenant.evolutionInstanceName, status: state, qrCode },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao checar status' }, { status: 500 });
  }
}

// DELETE — desconectar/excluir instância
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    
    const user = verifyAuth(_req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    if (!EVOLUTION_URL) {
      return NextResponse.json({ error: 'EVOLUTION_API_URL não configurada no .env' }, { status: 500 });
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    
    if (tenant?.evolutionInstanceName) {
      // Excluir a instância na Evolution API (Logout/Delete)
      await fetch(`${EVOLUTION_URL}/instance/delete/${tenant.evolutionInstanceName}`, {
        method: 'DELETE',
        headers: { apikey: EVOLUTION_KEY }
      }).catch(err => console.error("Erro ao deletar instância na API externa:", err));
    }

    // Limpar os dados no banco
    await db
      .update(tenants)
      .set({ 
        evolutionInstanceName: null, 
        evolutionInstanceStatus: null, 
        updatedAt: new Date() 
      })
      .where(eq(tenants.id, tenantId));

    return NextResponse.json({ success: true, message: 'Instância desconectada com sucesso' });
  } catch (error) {
    console.error('Delete Phone/Evolution error:', error);
    return NextResponse.json({ success: false, message: 'Erro ao desconectar' }, { status: 500 });
  }
}
