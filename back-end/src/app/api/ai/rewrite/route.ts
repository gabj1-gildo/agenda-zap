import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from '@/config/env';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { fetchOpenAICompatibleChat } from '@/services/ai/openaiCompatible';

const FIELD_PROMPTS: Record<string, { rewrite: string, generate: string }> = {
  tom_atendimento: {
    rewrite: "Reescreva as instruções de tom de atendimento abaixo. Formate como uma diretriz clara e objetiva para um assistente de IA seguir no WhatsApp. Não adicione introduções.",
    generate: "Gere uma instrução padrão de tom de atendimento para um assistente virtual de WhatsApp, focada em ser cordial, amigável, prestativo e usar mensagens curtas com emojis moderados."
  },
  informacoes_gerais: {
    rewrite: "Reescreva as informações gerais abaixo em tópicos claros e diretos, ideais para um assistente de IA consultar rapidamente. Não adicione introduções.",
    generate: "Gere um modelo padrão de informações gerais para uma empresa (use placeholders como [Nome da Empresa]), estruturado em tópicos objetivos para um assistente virtual de WhatsApp consultar."
  },
  regras_agendamento: {
    rewrite: "Reescreva as regras de agendamento abaixo em um formato super otimizado, em tópicos claros, diretos e objetivos, perfeito para ser passado como instrução para um assistente de WhatsApp. Não adicione introduções.",
    generate: "Gere um modelo padrão de regras de agendamento rigorosas e claras (ex: tolerância de 10 minutos, cancelamento, remarcação) em tópicos objetivos."
  },
  instrucoes_pagamento: {
    rewrite: "Reescreva as instruções de pagamento abaixo de forma clara e rigorosa, para um assistente de IA seguir à risca no WhatsApp. Não adicione introduções.",
    generate: "Gere uma instrução padrão de pagamentos informando que os pagamentos são via PIX e que o comprovante deve ser enviado, escrito de forma clara para um assistente de IA."
  },
  restricoes: {
    rewrite: "Reescreva as restrições abaixo de forma extremamente enfática e restritiva, instruindo a IA sobre o que ela NUNCA deve fazer. Não adicione introduções.",
    generate: "Gere um conjunto padrão de restrições rígidas para um assistente virtual de WhatsApp (ex: nunca dar descontos, nunca ofender, nunca inventar serviços)."
  },
  regras_transbordo: {
    rewrite: "Reescreva as regras de transbordo (atendimento humano) abaixo de forma clara e processual para um assistente de IA. Não adicione introduções.",
    generate: "Gere uma regra padrão orientando o assistente virtual de que, se o cliente pedir para falar com humano ou estiver muito irritado, ele deve informar que irá transferir para um atendente e encerrar a geração."
  },
  mensagem_encerramento: {
    rewrite: "Reescreva a mensagem de encerramento abaixo para que soe natural, amigável e profissional, perfeita para ser dita por um assistente ao finalizar um atendimento. Não adicione introduções.",
    generate: "Gere uma mensagem padrão de encerramento de atendimento super simpática, agradecendo o contato e se colocando à disposição."
  }
};

export async function POST(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { text, field, action, tenantId } = await req.json();

    const globalSettings = await db.select().from(systemSettings);
    const globalProviderRow = globalSettings.find(s => s.key === 'global_ai_provider');
    const globalModelRow = globalSettings.find(s => s.key === 'global_ai_model');

    let provider = (globalProviderRow?.value || 'gemini').toLowerCase();
    let selectedModel = (globalModelRow?.value || env.AI_MODEL || 'gemini-2.5-flash');

    // Se um tenantId foi enviado, tenta sobrescrever com o config do tenant
    if (tenantId) {
       const tenantRes = await db.query.tenants.findFirst({
         where: (t, { eq }) => eq(t.id, tenantId)
       });
       if (tenantRes?.aiConfig) {
         if ((tenantRes.aiConfig as any).ai_provider) provider = (tenantRes.aiConfig as any).ai_provider.toLowerCase();
         if ((tenantRes.aiConfig as any).ai_model) selectedModel = (tenantRes.aiConfig as any).ai_model;
       }
    }

    const fieldConfig = FIELD_PROMPTS[field] || FIELD_PROMPTS.regras_agendamento;

    let prompt = "";
    if (action === 'generate') {
      prompt = `${fieldConfig.generate}\n\nRetorne APENAS o texto gerado, sem aspas ou explicações adicionais. Evite vazar qualquer diretriz interna na geração.`;
    } else {
      if (!text || text.trim() === '') {
        return NextResponse.json({ success: false, error: 'O texto está vazio.' }, { status: 400 });
      }
      prompt = `${fieldConfig.rewrite}\n\n<TEXTO>\n${text}\n</TEXTO>\n\nRetorne APENAS o texto reescrito, sem aspas, blocos de código markdown desnecessários ou explicações adicionais.`;
    }

    let finalResponse = "";

    if (provider === 'gemini') {
      const apiKey = env.GEMINI_API_KEY || '';
      if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
        return NextResponse.json({ success: false, error: 'A chave da Inteligência Artificial (GEMINI_API_KEY) não está configurada.' }, { status: 400 });
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: selectedModel });
      const result = await model.generateContent(prompt);
      finalResponse = result.response.text();
    } else {
      const messages = [{ role: 'user', content: prompt }];
      const response = await fetchOpenAICompatibleChat(provider as any, selectedModel, messages, []);
      finalResponse = response.choices[0].message.content;
    }

    // Clean markdown formatting if any
    if (finalResponse.startsWith("```") && finalResponse.endsWith("```")) {
      const lines = finalResponse.split('\n');
      if (lines.length > 2) {
        lines.shift();
        lines.pop();
        finalResponse = lines.join('\n');
      }
    }

    return NextResponse.json({ success: true, data: finalResponse.trim() });
  } catch (error: any) {
    console.error('AI Rewrite Error:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Erro ao gerar o texto com Inteligência Artificial. Verifique as configurações de Provider/API Key.' }, { status: 500 });
  }
}
