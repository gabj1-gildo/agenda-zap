import { db } from '@/db';
import { clients, chatSessions, tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateAiResponse } from '@/services/ai';
import { sendWhatsAppMessage } from '@/services/whatsappService';

export async function processIncomingMessage(
  phoneJid: string,
  pushName: string,
  text: string,
  tenant: any,
  mediaBase64?: string,
  mimeType?: string
) {
  try {
    console.log(`\n--- Processando mensagem consolidada de ${phoneJid} para tenant ${tenant.id} ---`);

    const phone = phoneJid.split('@')[0];

    // Buscar ou criar Cliente
    let client = await db.query.clients.findFirst({
      where: and(
        eq(clients.phone, phone),
        eq(clients.tenantId, tenant.id)
      )
    });

    if (!client) {
      const [newClient] = await db.insert(clients).values({
        phone: phone,
        name: pushName,
        tenantId: tenant.id
      }).returning();
      client = newClient;
    }

    // Buscar ou criar Sessão de Chat
    let session = await db.query.chatSessions.findFirst({
      where: and(
        eq(chatSessions.clientId, client.id),
        eq(chatSessions.tenantId, tenant.id)
      ),
      orderBy: (sessions, { desc }) => [desc(sessions.updatedAt)]
    });

    let currentHistory: any[] = [];
    const newMessage = { 
      role: 'user', 
      content: text, 
      mediaBase64: mediaBase64 || null, 
      mimeType: mimeType || null 
    };

    if (!session) {
      currentHistory = [newMessage];
      const [newSession] = await db.insert(chatSessions).values({
        clientId: client.id,
        tenantId: tenant.id,
        status: 'ACTIVE',
        history: currentHistory,
        hasUnread: true
      }).returning();
      session = newSession;
    } else {
      currentHistory = (session.history as any[]) || [];
      currentHistory.push(newMessage);
      
      await db.update(chatSessions)
        .set({ history: currentHistory, updatedAt: new Date(), hasUnread: true })
        .where(eq(chatSessions.id, session.id));
    }

    if (session.status === 'HUMAN') {
      console.log(`[ATENDIMENTO HUMANO] A IA não vai responder para ${phoneJid}.`);
      return;
    }

    console.log(`Gerando resposta da IA...`);
    const respostaIA = await generateAiResponse(currentHistory, pushName, session, tenant, client);
    
    const joinedResponse = Array.isArray(respostaIA) ? respostaIA.join('\n\n') : respostaIA;
    const updatedHistory = [...currentHistory, { role: 'system', content: joinedResponse }];
    await db.update(chatSessions)
      .set({ history: updatedHistory, updatedAt: new Date(), hasUnread: false })
      .where(eq(chatSessions.id, session.id));

    // Pós-processamento: interceptar link de pagamento (para o WhatsApp)
    let mensagensFinais = Array.isArray(respostaIA) ? [...respostaIA] : [respostaIA];
    const { generateCheckoutLink } = await import('@/services/paymentService');
    
    for (let i = 0; i < mensagensFinais.length; i++) {
      let msg = mensagensFinais[i];
      const match = msg.match(/\[GERAR_PAGAMENTO_PLANO:([^\]]+)\]/);
      if (match) {
        const planId = match[1];
        const checkoutUrl = await generateCheckoutLink(tenant.id, planId, client.id);
        msg = msg.replace(match[0], checkoutUrl);
        mensagensFinais[i] = msg;
      }
    }

    for (const msg of mensagensFinais) {
      await sendWhatsAppMessage(phoneJid, msg, tenant.id);
    }

  } catch (error) {
    console.error('Erro ao processar a mensagem no banco:', error);
  }
}
