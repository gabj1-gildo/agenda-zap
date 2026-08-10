import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, tenants, tenantPhones } from '@/db/schema';
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

    const { message, target, targetType, targetIds, mediaUrl } = await req.json();

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

    const openPhone = (await db.select().from(tenantPhones).where(and(eq(tenantPhones.tenantId, tenantId), eq(tenantPhones.evolutionInstanceStatus, 'OPEN'))).limit(1))[0];
    const isConnected = tenant.evolutionInstanceStatus === 'OPEN' || tenant.whatsappProvider === 'META_CLOUD' || !!openPhone;

    if (!isConnected) {
      return NextResponse.json({ success: false, error: 'O WhatsApp da empresa não está conectado. Vá em Configurações > WhatsApp para conectar.' }, { status: 400 });
    }

    const instanceName = tenant.evolutionInstanceName || openPhone?.evolutionInstanceName;

    // Buscar clientes do tenant
    let targetClients: any[] = [];

    if (targetType === 'TAGS' && Array.isArray(targetIds) && targetIds.length > 0) {
      const { inArray } = await import('drizzle-orm');
      const { clientTags } = await import('@/db/schema');
      
      const tagsMatches = await db.select({ clientId: clientTags.clientId })
        .from(clientTags)
        .where(inArray(clientTags.tagId, targetIds));
        
      const clientIds = Array.from(new Set(tagsMatches.map(t => t.clientId)));
      
      if (clientIds.length > 0) {
        targetClients = await db.select().from(clients).where(
          and(
            eq(clients.tenantId, tenantId),
            isNotNull(clients.phone),
            inArray(clients.id, clientIds)
          )
        );
      }
    } else {
      targetClients = await db.select().from(clients).where(
        and(
          eq(clients.tenantId, tenantId),
          isNotNull(clients.phone)
        )
      );
    }

    // Remove duplicados pelo telefone
    const uniqueClientsMap = new Map();
    for (const c of targetClients) {
      if (c.phone) {
        uniqueClientsMap.set(c.phone, c);
      }
    }
    
    const uniqueClients = Array.from(uniqueClientsMap.values());

    if (uniqueClients.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum cliente com número de telefone encontrado' }, { status: 400 });
    }

    let successCount = 0;
    
    const { sendWhatsAppImage } = await import('@/services/whatsappService');
    
    for (const client of uniqueClients) {
      const phone = client.phone;
      let finalMessage = message;
      
      // Substituir variáveis dinâmicas
      if (client.name) {
        const firstName = client.name.split(' ')[0];
        finalMessage = finalMessage.replace(/{nome}/g, firstName);
        finalMessage = finalMessage.replace(/{nome_completo}/g, client.name);
      } else {
        finalMessage = finalMessage.replace(/{nome}/g, 'Cliente');
        finalMessage = finalMessage.replace(/{nome_completo}/g, 'Cliente');
      }

      let sent = false;
      if (mediaUrl) {
        sent = await sendWhatsAppImage(phone, mediaUrl, finalMessage, tenant.id);
      } else {
        sent = await sendWhatsAppMessage(phone, finalMessage, tenant.id);
      }
      
      if (sent) successCount++;
    }

    return NextResponse.json({ success: true, message: `Mensagem enviada para ${successCount} de ${uniqueClients.length} clientes.` });
  } catch (error) {
    console.error('Error broadcasting whatsapp message:', error);
    return NextResponse.json({ success: false, error: 'Erro interno no disparo' }, { status: 500 });
  }
}
