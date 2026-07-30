import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, tenants } from '@/db/schema';
import { eq, isNotNull, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/services/whatsappService';

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { message, target } = await req.json();

    if (!message || message.trim() === '') {
      return NextResponse.json({ success: false, error: 'Mensagem vazia' }, { status: 400 });
    }

    // Buscar a instância do tenant
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId)
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Empresa não encontrada' }, { status: 404 });
    }

    if (tenant.evolutionInstanceStatus !== 'OPEN' || !tenant.evolutionInstanceName) {
      return NextResponse.json({ success: false, error: 'O WhatsApp da empresa não está conectado. Vá em Configurações > Integrações para conectar.' }, { status: 400 });
    }

    const instanceName = tenant.evolutionInstanceName;

    // Buscar clientes do tenant
    let phoneNumbers = new Set<string>();

    if (target === 'ALL_CLIENTS') {
      const tenantClients = await db.select({ phone: clients.phone }).from(clients).where(
        and(
          eq(clients.tenantId, tenantId),
          isNotNull(clients.phone)
        )
      );
      
      tenantClients.forEach(c => {
        if (c.phone) phoneNumbers.add(c.phone);
      });
    }

    const phoneList = Array.from(phoneNumbers);

    if (phoneList.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum cliente com número de telefone encontrado' }, { status: 400 });
    }

    let successCount = 0;
    for (const phone of phoneList) {
      const sent = await sendWhatsAppMessage(phone, message, tenant.id);
      if (sent) successCount++;
    }

    return NextResponse.json({ success: true, message: `Mensagem enviada para ${successCount} de ${phoneList.length} clientes.` });
  } catch (error) {
    console.error('Error broadcasting whatsapp message:', error);
    return NextResponse.json({ success: false, error: 'Erro interno no disparo' }, { status: 500 });
  }
}
