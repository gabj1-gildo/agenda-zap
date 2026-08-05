import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getBillingStatus, getPlans, BillingApiError } from "../services/billing.service";
import type { Subscription, Invoice, Plan } from "../types/billing";

interface BillingState {
  subscription: Subscription | null;
  invoices: Invoice[];
  plans: Plan[];
  loading: boolean;
  error: string | null;
}

function mapErrorToMessage(err: unknown): string {
  if (err instanceof BillingApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado ao carregar dados de faturamento.";
}

export function useBilling() {
  const { data: session, status: sessionStatus } = useSession();
  const [state, setState] = useState<BillingState>({
    subscription: null,
    invoices: [],
    plans: [],
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session) return;
    
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const auth = { 
        token: (session.user as any)?.accessToken, 
        tenantId: (session.user as any)?.tenantId 
      };
      
      const [statusRes, plansRes] = await Promise.all([
        getBillingStatus(auth),
        getPlans(auth),
      ]);

      setState({
        subscription: statusRes.success ? statusRes.data.subscription : null,
        invoices: statusRes.success ? statusRes.data.invoices ?? [] : [],
        plans: plansRes.success ? plansRes.data : [],
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = mapErrorToMessage(err);
      setState(s => ({ ...s, loading: false, error: errorMessage }));
      toast.error(errorMessage);
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchAll();
    } else if (sessionStatus === 'unauthenticated') {
      setState(s => ({ ...s, loading: false }));
    }
  }, [fetchAll, sessionStatus]);

  return { ...state, refetch: fetchAll };
}
