import { NextResponse } from 'next/server';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export const DEFAULT_PRESETS = {
  tom_atendimento: [
    { label: "Profissional e Formal", text: "Atue de forma extremamente polida, respeitosa e formal. Evite gírias e emojis. Foco na objetividade." },
    { label: "Amigável e Descontraído", text: "Seja acolhedor, use linguagem coloquial, amigável e insira emojis curtos ocasionalmente. Trate o cliente com proximidade." },
    { label: "Direto e Objetivo", text: "Responda de forma rápida, curta e cirúrgica. Não faça rodeios. Priorize o fechamento do agendamento sem conversa fiada." },
    { label: "Empático e Paciente", text: "Demonstre muita paciência, tire todas as dúvidas detalhadamente, use um tom compreensivo e evite apressar o cliente." }
  ],
  instrucoes_pagamento: [
    { label: "Automático (Recomendado - AbacatePay/MercadoPago)", text: "Os pagamentos são processados via link de pagamento automático. Não peça comprovante ao cliente, apenas informe que o sistema de agendamento confirmará automaticamente assim que o pagamento no link for aprovado." },
    { label: "Manual (PIX com Comprovante)", text: "Pagamentos devem ser feitos via PIX na chave: 00.000.000/0001-00. Peça sempre que o cliente envie o comprovante de pagamento por aqui para podermos confirmar o agendamento manualmente." }
  ],
  regras_transbordo: [
    { label: "Transferência Imediata", text: "Se o cliente pedir para falar com um humano, diga: 'Vou transferir você para um de nossos especialistas. Aguarde um momento.' e encerre o bot (transbordo)." },
    { label: "Tentativa de Retenção", text: "Tente resolver a dúvida 2 vezes antes de transferir. Se o cliente insistir, diga: 'Transferindo para o suporte humano.' e encerre." },
    { label: "Empático", text: "Se houver solicitação de humano ou frustração, diga: 'Entendo perfeitamente. Um atendente humano vai assumir agora para te ajudar da melhor forma.' e pare a automação." }
  ],
  mensagem_encerramento: [
    { label: "Simples", text: "Obrigado pelo contato! Qualquer dúvida, estamos à disposição." },
    { label: "Com Redes Sociais", text: "Agradecemos o agendamento! Siga nosso Instagram para novidades e até logo." },
    { label: "Calorosa", text: "Foi um prazer atender você! Te esperamos ansiosamente para o seu agendamento. Um excelente dia!" },
    { label: "Sem Mensagem (Deixar em branco)", text: "" }
  ],
  informacoes_gerais: [
    { label: "Estrutura Básica", text: "Sobre Nós: [Descreva a empresa brevemente]\nEndereço: [Rua, Número, Bairro, Cidade]\nServiços: [Lista resumida de serviços]\nDiferenciais: [O que destaca o negócio]" }
  ],
  regras_agendamento: [
    { label: "Tolerância Padrão", text: "Tolerância de atraso: 10 minutos.\nCancelamentos: devem ser avisados com no mínimo 2 horas de antecedência.\nRemarcações: sujeitas à disponibilidade na agenda." }
  ],
  restricoes: [
    { label: "Regras Rígidas (Recomendado)", text: "NUNCA ofereça descontos sob nenhuma hipótese. NUNCA ofenda ou discuta com o cliente. NUNCA invente ou ofereça serviços e horários que não estejam na lista do sistema." }
  ]
};

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'ai_presets')
    });

    let presets = DEFAULT_PRESETS;

    if (setting && setting.value) {
      try {
        presets = JSON.parse(setting.value);
      } catch (e) {
        console.error("Erro ao fazer parse do ai_presets", e);
      }
    }

    return NextResponse.json({ success: true, data: presets });
  } catch (error) {
    console.error('Error fetching ai presets:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
