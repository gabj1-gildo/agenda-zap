export interface PaymentKey {
  id: string;
  name: string;
  gateway: string;
  token?: string;
  pixExpirationTime: string;
  acceptsPix: boolean;
  acceptsCreditCard: boolean;
  acceptsBoleto: boolean;
  isActive: boolean;
}

export interface WhatsAppInstance {
  id: string;
  evolutionInstanceName: string;
  evolutionInstanceStatus: string;
  phone: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
}

export interface AIPreset {
  id: string;
  label: string;
  desc: string;
  config: Record<string, any>;
}

export interface AIConfig {
  ai_provider?: string;
  ai_model?: string;
  preset_id?: string;
  tom_atendimento?: string;
  informacoes_gerais?: string;
  regras_agendamento?: string;
  instrucoes_pagamento?: string;
  regras_transbordo?: string;
  restricoes?: string;
  mensagem_encerramento?: string;
  customVars?: Record<string, string>;
}

export interface TenantConfig {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  description: string;
  cep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  serviceLocationType: string;
  servicePerimeter: string;
  acceptPaymentOnSite: boolean;
  schedulingMode: string;
  whatsappProvider: string;
  whatsappMetaToken?: string;
  whatsappMetaPhoneNumberId?: string;
  cpfBirthDate?: string;
  cpfGender?: string;
  logoUrl?: string;
  logo_url?: string;
  aiConfig: AIConfig;
  aiEnabled: boolean;
  googleCalendarToken?: string;
  _isProfileComplete?: boolean;
  _missingRequirements?: string[];
  customMaxWhatsAppInstances?: number;
  dailyReportEnabled?: boolean;
}
