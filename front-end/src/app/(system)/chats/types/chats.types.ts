export type Message = {
  role: "user" | "system" | "model";
  content: string;
};

export type Client = {
  id: string;
  name: string;
  whatsappName?: string;
  phone: string;
  status?: string;
  funnelStage?: string;
  clientTags?: any[];
};

export type ChatSession = {
  id: string;
  clientId: string;
  status: string; // 'ACTIVE' ou 'HUMAN'
  hasUnread?: boolean;
  history: Message[];
  updatedAt: string;
  client: Client;
  context?: any;
};
