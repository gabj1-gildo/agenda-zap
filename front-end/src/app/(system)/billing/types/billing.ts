// Entidades de domínio
export interface PlanFeature {
  name: string;
  included: boolean;
}

export type BillingInterval = 'monthly' | 'quarterly' | 'semiannual' | 'yearly';
export type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | string; // LIMITAÇÃO: manter string até confirmar enum real do backend

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number | string; // LIMITAÇÃO: backend manda string às vezes — normalizar no service
  interval: BillingInterval;
  trialDays: number;
  maxUsers: number;
  maxTenants: number;
  includedChats: number;
  extraChatPrice: number | string;
  features: (PlanFeature | string)[]; // LIMITAÇÃO: formato misto existente hoje — documentar e normalizar
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INACTIVE';
  paymentMethod: string;
  externalReference?: string;
  mpPreapprovalId?: string;
  asaasSubscriptionId?: string;
  trialEnd?: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
  currentPeriodEnd?: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
}

export type InvoiceType = 'SUBSCRIPTION' | 'USAGE';

export interface Invoice {
  id: string;
  type: InvoiceType;
  month?: number;
  year?: number;
  extraChats?: number;
  totalAmount: number | string;
  dueDate: string | null;
  paymentUrl: string | null;
}

// DTOs de request/response da API
export interface BillingStatusResponse {
  success: boolean;
  data?: {
    subscription: Subscription | null;
    invoices: Invoice[];
    usage?: {
      tenants: number;
      users: number;
      chats: number;
    };
  };
  error?: string;
}

export interface PlansResponse {
  success: boolean;
  data: Plan[];
  error?: string;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  document: string;
  phone: string;
  method: PaymentMethod;
}

export interface CheckoutRequest extends CheckoutFormData {
  planId: string;
}

export interface CheckoutResponse {
  success: boolean;
  data?: {
    paymentUrl?: string;
    pix?: unknown; // LIMITAÇÃO: documentar formato real assim que confirmado com backend
  };
  error?: string;
}

export interface ChangePlanRequest {
  planId: string;
  isInstant: boolean;
  otpCode?: string;
  cvv?: string;
}

export interface ChangePlanResponse {
  success: boolean;
  message?: string;
}

// Tipos auxiliares de UI (não vêm da API)
export interface GroupedPlans {
  [planGroupKey: string]: Partial<Record<BillingInterval, Plan>>;
}
