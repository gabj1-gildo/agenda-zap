import { db } from '@/db';
import { tenants, tenantPhones } from '@/db/schema';
import { metaMessageLogs } from '@/db/schema/metaMessageLogs';
import { eq, and } from 'drizzle-orm';
import { sendWhatsAppMessage as sendEvolutionText, sendWhatsAppImage as sendEvolutionImage } from './evolutionApi';
import { sendMetaWhatsAppMessage, sendMetaWhatsAppImage } from './metaCloudApi';

async function getEvolutionInstanceName(tenant: any): Promise<string | undefined> {
  if (tenant.evolutionInstanceName) return tenant.evolutionInstanceName;
  const phones = await db.select().from(tenantPhones).where(eq(tenantPhones.tenantId, tenant.id));
  const openPhone = phones.find(p => p.evolutionInstanceStatus?.toUpperCase() === 'OPEN' || p.evolutionInstanceStatus?.toUpperCase() === 'CONNECTED');
  return openPhone?.evolutionInstanceName || undefined;
}

export async function sendWhatsAppMessage(
  remoteJid: string,
  text: string,
  tenantIdOrInstanceName?: string
): Promise<boolean> {
  if (!tenantIdOrInstanceName) {
    return await sendEvolutionText(remoteJid, text);
  }

  // Se o argumento passado não for um UUID válido (ou seja, é um nome de instância do sistema)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantIdOrInstanceName)) {
    return await sendEvolutionText(remoteJid, text, tenantIdOrInstanceName);
  }

  const tenantId = tenantIdOrInstanceName;
  const tenantList = await db.select().from(tenants).where(eq(tenants.id, tenantId));
  const tenant = tenantList[0];

  if (!tenant) return false;

  if (tenant.whatsappProvider?.toUpperCase() === 'META_CLOUD') {
    if (!tenant.whatsappMetaPhoneNumberId || !tenant.whatsappMetaToken) {
      console.error('Meta Cloud provider selected but missing tokens for tenant:', tenantId, '- Falling back to Evolution API');
      const instanceName = await getEvolutionInstanceName(tenant);
      return await sendEvolutionText(remoteJid, text, instanceName);
    }
    
    try {
      const result = await sendMetaWhatsAppMessage(
        tenant.whatsappMetaPhoneNumberId,
        tenant.whatsappMetaToken,
        remoteJid,
        text
      );

      // Log para faturamento
      await db.insert(metaMessageLogs).values({
        tenantId,
        remoteJid,
        messageType: 'TEXT',
        messageId: result.messages?.[0]?.id || null,
        status: 'SENT'
      });

      return true;
    } catch (error) {
      console.error('Error sending Meta Cloud message:', error);
      return false;
    }
  } else {
    const instanceName = await getEvolutionInstanceName(tenant);
    return await sendEvolutionText(remoteJid, text, instanceName);
  }
}

export async function sendWhatsAppImage(
  remoteJid: string,
  imageUrl: string,
  caption?: string,
  tenantIdOrInstanceName?: string
): Promise<boolean> {
  if (!tenantIdOrInstanceName) {
    return await sendEvolutionImage(remoteJid, imageUrl, caption);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantIdOrInstanceName)) {
    return await sendEvolutionImage(remoteJid, imageUrl, caption, tenantIdOrInstanceName);
  }

  const tenantId = tenantIdOrInstanceName;
  const tenantList = await db.select().from(tenants).where(eq(tenants.id, tenantId));
  const tenant = tenantList[0];

  if (!tenant) return false;

  if (tenant.whatsappProvider?.toUpperCase() === 'META_CLOUD') {
    if (!tenant.whatsappMetaPhoneNumberId || !tenant.whatsappMetaToken) {
      console.error('Meta Cloud provider selected but missing tokens for tenant:', tenantId, '- Falling back to Evolution API');
      const instanceName = await getEvolutionInstanceName(tenant);
      return await sendEvolutionImage(remoteJid, imageUrl, caption, instanceName);
    }
    
    try {
      const result = await sendMetaWhatsAppImage(
        tenant.whatsappMetaPhoneNumberId,
        tenant.whatsappMetaToken,
        remoteJid,
        imageUrl,
        caption
      );

      await db.insert(metaMessageLogs).values({
        tenantId,
        remoteJid,
        messageType: 'IMAGE',
        messageId: result.messages?.[0]?.id || null,
        status: 'SENT'
      });

      return true;
    } catch (error) {
      console.error('Error sending Meta Cloud image:', error);
      return false;
    }
  } else {
    const instanceName = await getEvolutionInstanceName(tenant);
    return await sendEvolutionImage(remoteJid, imageUrl, caption, instanceName);
  }
}
