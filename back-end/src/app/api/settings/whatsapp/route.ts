import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { tenantPhones, userSubscriptions, tenants } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    let phones: any[] = [];
    await withTenant(tenantId, async (tx) => {
      phones = await tx.query.tenantPhones.findMany({
        where: eq(tenantPhones.tenantId, tenantId),
        orderBy: [desc(tenantPhones.createdAt)]
      });
    });

    return NextResponse.json({ success: true, data: phones });
  } catch (error: any) {
    console.error('Error fetching tenant phones:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Validar limites
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, user.id),
      with: { plan: true }
    });

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);

    if (!subscription || !subscription.plan) {
      return NextResponse.json({ success: false, error: 'Assinatura não encontrada' }, { status: 403 });
    }

    const currentPhones = await db.query.tenantPhones.findMany({
      where: eq(tenantPhones.tenantId, tenantId)
    });

    const hasMetaCloud = tenant?.whatsappMetaToken && tenant?.whatsappMetaPhoneNumberId;
    const totalInstances = currentPhones.length + (hasMetaCloud ? 1 : 0);
    const maxInstances = tenant?.customMaxWhatsAppInstances ?? subscription.plan.maxWhatsAppInstances;

    if (totalInstances >= maxInstances) {
      return NextResponse.json({ success: false, error: `Seu plano/limite permite no máximo ${maxInstances} instância(s) de WhatsApp. O limite já foi atingido.` }, { status: 403 });
    }

    const body = await req.json();
    if (!body.phone || !body.evolutionInstanceName) {
      return NextResponse.json({ success: false, error: 'Telefone e nome da instância são obrigatórios' }, { status: 400 });
    }

    const { env } = await import('@/config/env');
    const EVOLUTION_URL = env.EVOLUTION_API_URL ? env.EVOLUTION_API_URL.replace(/\/$/, '') : undefined;
    const EVOLUTION_KEY = env.EVOLUTION_API_KEY || '';

    if (!EVOLUTION_URL) {
      return NextResponse.json({ success: false, error: 'EVOLUTION_API_URL não configurada no .env' }, { status: 500 });
    }

    const instanceName = body.evolutionInstanceName.toLowerCase().replace(/[^a-z0-9-]/g, '');

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

    if (!evoRes.ok && evoData.response?.message?.[0]?.includes('already in use')) {
      evoRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        headers: { apikey: EVOLUTION_KEY }
      });
      evoData = await evoRes.json();
    } else if (!evoRes.ok) {
      return NextResponse.json({ success: false, error: 'Erro na API do WhatsApp. Tente novamente.', details: evoData }, { status: 500 });
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

    let newPhone: any = null;
    await withTenant(tenantId, async (tx) => {
      const inserted = await tx.insert(tenantPhones).values({
        tenantId,
        phone: body.phone,
        evolutionInstanceName: instanceName,
        evolutionInstanceStatus: 'PENDING_QR',
      }).returning();
      newPhone = inserted[0];
    });

    return NextResponse.json({ success: true, data: { ...newPhone, qrCode } });
  } catch (error: any) {
    console.error('Error creating tenant phone:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
