export type Tenant = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  evolutionInstanceStatus: string | null;
  createdAt: string;
};

export type DashboardMetrics = {
  faturamento: number;
  appointmentsCount: number;
  atendimentosPagos: number;
  atendimentosPendentes: number;
  atendimentosCancelados: number;
  novosClientes: number;
  tokensUsados: number;
  ticketMedio: number;
  taxaConversao: number;
  conversasAtivas: number;
  chartData: any[];
  kanbanClients: any[];
};

export type AdminMetrics = {
  mrr: number;
  pixVolume: number;
  totalTokens: number;
  chartData: any[];
};
