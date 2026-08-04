import { NextResponse } from 'next/server';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/config/env';
import { verifyAuth } from '@/lib/auth';

const EVOLUTION_URL = env.EVOLUTION_API_URL ? env.EVOLUTION_API_URL.replace(/\/$/, '') : undefined;
const EVOLUTION_KEY = env.EVOLUTION_API_KEY || '';

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    if (!EVOLUTION_URL) {
      return NextResponse.json({ error: 'EVOLUTION_API_URL não configurada no .env' }, { status: 500 });
    }

    const { instanceName: requestedInstanceName } = await req.json();
    
    // We can use a default if none is provided
    const instanceName = requestedInstanceName || 'sistema-agenda-zap';

    if (!instanceName) {
      return NextResponse.json({ success: false, message: 'Nome da instância é obrigatório' }, { status: 400 });
    }

    // Create instance on Evolution API
    const evoRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
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

    const evoData = await evoRes.json();
    const qrCode: string | null = evoData?.qrcode?.base64 || evoData?.base64 || null;

    // Configure Webhook
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

    // Save instance name and status in database
    const existingName = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'whatsapp_default_instance_name')
    });
    
    if (existingName) {
      await db.update(systemSettings)
        .set({ value: instanceName, updatedAt: new Date() })
        .where(eq(systemSettings.key, 'whatsapp_default_instance_name'));
    } else {
      await db.insert(systemSettings)
        .values({ key: 'whatsapp_default_instance_name', value: instanceName, description: 'Instância padrão do sistema para envios globais' });
    }

    const existingStatus = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'whatsapp_default_status')
    });

    if (existingStatus) {
      await db.update(systemSettings)
        .set({ value: 'PENDING_QR', updatedAt: new Date() })
        .where(eq(systemSettings.key, 'whatsapp_default_status'));
    } else {
      await db.insert(systemSettings)
        .values({ key: 'whatsapp_default_status', value: 'PENDING_QR', description: 'Status da conexão do WhatsApp Padrão' });
    }

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
    return NextResponse.json({ success: false, message: 'Erro ao criar instância' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    if (!EVOLUTION_URL) {
      return NextResponse.json({ error: 'EVOLUTION_API_URL não configurada no .env' }, { status: 500 });
    }

    const instanceSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'whatsapp_default_instance_name')
    });
    
    const instanceName = instanceSetting?.value;

    if (!instanceName) {
      return NextResponse.json({ success: false, message: 'Sem instância vinculada' }, { status: 404 });
    }

    const statusRes = await fetch(
      `${EVOLUTION_URL}/instance/connectionState/${instanceName}`,
      { headers: { apikey: EVOLUTION_KEY } }
    );
    const statusData = await statusRes.json();
    const state: string = statusData?.instance?.state || 'DISCONNECTED';

    // Update status in the database
    const existingStatus = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'whatsapp_default_status')
    });

    if (existingStatus) {
      await db.update(systemSettings)
        .set({ value: state.toUpperCase(), updatedAt: new Date() })
        .where(eq(systemSettings.key, 'whatsapp_default_status'));
    } else {
      await db.insert(systemSettings)
        .values({ key: 'whatsapp_default_status', value: state.toUpperCase(), description: 'Status da conexão do WhatsApp Padrão' });
    }

    // Se ainda não conectado, pegar novo QR
    let qrCode: string | null = null;
    if (state !== 'open') {
      const qrRes = await fetch(
        `${EVOLUTION_URL}/instance/connect/${instanceName}`,
        { headers: { apikey: EVOLUTION_KEY } }
      );
      const qrData = await qrRes.json();
      console.log('Connect Data:', qrData);
      qrCode = qrData?.base64 || qrData?.qrcode?.base64 || qrData?.code || null;
    }

    return NextResponse.json({
      success: true,
      data: { instanceName, status: state.toUpperCase(), qrCode },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao checar status' }, { status: 500 });
  }
}
