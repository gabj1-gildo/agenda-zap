import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const updateFunnelStageTool: FunctionDeclaration = {
  name: "update_funnel_stage",
  description: "Atualiza o estágio do cliente no funil de vendas (Kanban) da empresa com base no contexto atual da conversa. DEVE ser chamado sempre que houver uma progressão clara.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      stage: {
        type: SchemaType.STRING,
        description: "A nova etapa do funil. DEVE ser exatamente um destes valores: 'espera', 'atendimento_ia', 'atendimento_humano', 'aguardando_pagamento', 'finalizado', 'perdido'.",
      },
    },
    required: ["stage"],
  },
};
