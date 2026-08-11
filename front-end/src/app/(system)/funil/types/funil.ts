export type StageKey = 'espera' | 'ia' | 'humano' | 'pagamento' | 'finalizado' | 'perdido';
export type DBStage = 'espera' | 'atendimento_ia' | 'atendimento_humano' | 'aguardando_pagamento' | 'finalizado' | 'perdido';

export interface Stage {
  key: StageKey;
  dbKey: DBStage;
  title: string;
  sub: string;
  color: string;
  rgb: string;
  light: string;
}

export const STAGES: Stage[] = [
  { key: 'espera',     dbKey: 'espera',               title: 'Espera',        sub: 'Aguardando primeiro contato',  color: '#f5a524', rgb: '245,165,36',  light: '#ffd98f' },
  { key: 'ia',         dbKey: 'atendimento_ia',        title: 'Atend. IA',     sub: 'Em atendimento com IA',        color: '#8b5cf6', rgb: '139,92,246',  light: '#d3c4ff' },
  { key: 'humano',     dbKey: 'atendimento_humano',    title: 'Atend. Humano', sub: 'Atendimento com atendente',    color: '#3b82f6', rgb: '59,130,246',  light: '#bcd8ff' },
  { key: 'pagamento',  dbKey: 'aguardando_pagamento',  title: 'Aguard. Pagto', sub: 'Aguardando pagamento',         color: '#14b8a6', rgb: '20,184,166',  light: '#8ff0e2' },
  { key: 'finalizado', dbKey: 'finalizado',            title: 'Finalizado',    sub: 'Negócios concluídos',          color: '#22c55e', rgb: '34,197,94',   light: '#a6f0c0' },
  { key: 'perdido',    dbKey: 'perdido',               title: 'Perdido',       sub: 'Negócios não concluídos',      color: '#f43f5e', rgb: '244,63,94',   light: '#ffb8c4' },
];

export interface LeadCard {
  id: string;
  name: string;
  phone: string;
  funnelStage: DBStage;
  status?: 'online';
  updatedAt?: string;
}

export type Board = Record<StageKey, LeadCard[]>;

export const emptyBoard: Board = { espera: [], ia: [], humano: [], pagamento: [], finalizado: [], perdido: [] };
