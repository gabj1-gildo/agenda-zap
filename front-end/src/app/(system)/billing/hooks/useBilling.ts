import useSWR from "swr";
import { useSession } from "next-auth/react";
import { getBillingStatus, getPlans, BillingApiError } from "../services/billing.service";
import type { Subscription, Invoice, Plan } from "../types/billing";

interface BillingData {
  subscription: Subscription | null;
  invoices: Invoice[];
  usage: { tenants: number; users: number; chats: number } | null;
  plans: Plan[];
}

function mapErrorToMessage(err: unknown): string {
  if (err instanceof BillingApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado ao carregar dados de faturamento.";
}

export function useBilling() {
  const { data: session, status: sessionStatus } = useSession();

  const fetcher = async (): Promise<BillingData> => {
    if (sessionStatus !== 'authenticated' || !session) {
      throw new Error("Não autenticado");
    }
    
    const auth = { 
      token: (session.user as any)?.accessToken, 
      tenantId: (session.user as any)?.tenantId 
    };
    
    const [statusRes, plansRes] = await Promise.all([
      getBillingStatus(auth),
      getPlans(auth),
    ]);

    if (!statusRes.success) throw new Error(statusRes.error || "Falha ao carregar status");
    
    return {
      subscription: statusRes.data?.subscription || null,
      invoices: statusRes.data?.invoices || [],
      usage: statusRes.data?.usage || null,
      plans: plansRes.success ? plansRes.data || [] : [],
    };
  };

  const shouldFetch = sessionStatus === 'authenticated' && !!session;

  const { data, error, mutate, isLoading } = useSWR<BillingData>(
    shouldFetch ? ['billing_data', (session.user as any)?.tenantId] : null,
    fetcher
  );

  return {
    subscription: data?.subscription || null,
    invoices: data?.invoices || [],
    usage: data?.usage || null,
    plans: data?.plans || [],
    loading: isLoading && shouldFetch,
    error: error ? mapErrorToMessage(error) : null,
    refetch: mutate,
  };
}
