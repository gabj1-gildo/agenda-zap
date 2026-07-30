import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function handleUpdateFunnelStage(args: any, tenant: any, client: any): Promise<string> {
  const { stage } = args;

  const validStages = ['espera', 'atendimento_ia', 'atendimento_humano', 'aguardando_pagamento', 'finalizado', 'perdido'];
  const normalizedStage = String(stage).toLowerCase();

  if (!validStages.includes(normalizedStage)) {
    console.error(`Tentativa de atualizar para estágio inválido: ${stage}`);
    return "Um erro interno ocorreu ao tentar atualizar o estágio do funil (estágio inválido).";
  }

  try {
    await db.update(clients)
      .set({ funnelStage: normalizedStage, updatedAt: new Date() })
      .where(eq(clients.id, client.id));
      
    // Se a IA colocar em "atendimento_humano", devemos desativar a IA para este cliente
    if (normalizedStage === 'atendimento_humano') {
      const { chatSessions } = await import('@/db/schema');
      const { and } = await import('drizzle-orm');
      await db.update(chatSessions)
        .set({ status: 'HUMAN', updatedAt: new Date() })
        .where(and(eq(chatSessions.clientId, client.id), eq(chatSessions.tenantId, tenant.id), eq(chatSessions.status, 'ACTIVE')));
    }

    console.log(`[AI KANBAN] Cliente ${client.name || client.phone} movido para a etapa: ${normalizedStage}`);
    
    // Como a IA é uma assistente invisível nesse aspecto, não precisamos responder algo específico para o usuário
    // Mas a função exige um retorno de string de sistema
    return "Status atualizado silenciosamente.";
  } catch (error) {
    console.error("Erro ao atualizar o estágio do funil:", error);
    return "Ocorreu um erro interno de banco de dados ao tentar atualizar o funil.";
  }
}
