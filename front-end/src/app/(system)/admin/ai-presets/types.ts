export interface AdvancedPreset {
  label: string;
  text: string;
}

export interface GlobalPreset {
  id: string;
  label: string;
  desc: string;
  config: Record<string, string>;
}

export const PRESET_FIELDS = [
  { id: "tom_atendimento", name: "Tom de Atendimento" },
  { id: "instrucoes_pagamento", name: "Instruções de Pagamento" },
  { id: "regras_transbordo", name: "Regras de Transbordo" },
  { id: "mensagem_encerramento", name: "Mensagem de Encerramento" },
  { id: "informacoes_gerais", name: "Informações Gerais" },
  { id: "regras_agendamento", name: "Regras de Agendamento" },
  { id: "restricoes", name: "Restrições" }
];
