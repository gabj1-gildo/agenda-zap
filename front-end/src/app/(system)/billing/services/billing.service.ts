import { getBackendUrl } from "@/lib/api";
import type {
  BillingStatusResponse, PlansResponse, CheckoutRequest,
  CheckoutResponse, ChangePlanRequest, ChangePlanResponse
} from "../types/billing";

interface AuthContext {
  token: string;
  tenantId?: string;
}

export class BillingApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'BillingApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new BillingApiError('UNAUTHORIZED', 'Sessão expirada. Faça login novamente.');
  if (res.status === 403) throw new BillingApiError('FORBIDDEN', 'Você não tem permissão para essa ação.');
  if (res.status === 404) throw new BillingApiError('NOT_FOUND', 'Recurso não encontrado.');
  if (res.status >= 500) throw new BillingApiError('SERVER_ERROR', 'Erro no servidor. Tente novamente.');
  if (!res.ok) throw new BillingApiError('UNKNOWN', 'Erro inesperado.');
  return res.json();
}

/**
 * Helper to add a timeout to fetch requests
 */
async function fetchWithTimeout(url: string | URL | Request, options: RequestInit = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new BillingApiError('TIMEOUT', 'A requisição demorou demais, tente novamente.');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

export async function getBillingStatus({ token, tenantId }: AuthContext): Promise<BillingStatusResponse> {
  const res = await fetchWithTimeout(getBackendUrl('/api/admin/billing/status'), {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'tenant-id': tenantId ?? '' 
    }
  });
  return handleResponse<BillingStatusResponse>(res);
}

export async function getPlans({ token }: AuthContext): Promise<PlansResponse> {
  const res = await fetchWithTimeout(getBackendUrl('/api/admin/plans'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse<PlansResponse>(res);
}

export async function createCheckout(
  { token }: AuthContext, body: CheckoutRequest
): Promise<CheckoutResponse> {
  const res = await fetchWithTimeout(getBackendUrl('/api/saas/checkout'), {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(body)
  });
  return handleResponse<CheckoutResponse>(res);
}

export async function changePlan(
  { token }: AuthContext, body: ChangePlanRequest
): Promise<ChangePlanResponse> {
  const res = await fetchWithTimeout(getBackendUrl('/api/saas/subscription/change'), {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(body)
  });
  return handleResponse<ChangePlanResponse>(res);
}
