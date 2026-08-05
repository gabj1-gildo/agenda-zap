import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { changePlan } from "../services/billing.service";
import type { Plan } from "../types/billing";

interface UsePlanChangeProps {
  onSuccess?: () => void;
}

export function usePlanChange({ onSuccess }: UsePlanChangeProps = {}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<{ show: boolean; plan: Plan | null; isUpgrade: boolean }>({
    show: false,
    plan: null,
    isUpgrade: false
  });

  const openPlanChange = (plan: Plan, isUpgrade: boolean) => {
    setState({ show: true, plan, isUpgrade });
  };

  const closePlanChange = () => {
    setState({ show: false, plan: null, isUpgrade: false });
  };

  const handlePlanChange = async (isInstant: boolean) => {
    if (!state.plan) return;

    setLoading(true);
    try {
      const auth = { 
        token: (session?.user as any)?.accessToken, 
        tenantId: (session?.user as any)?.tenantId 
      };
      
      const res = await changePlan(auth, {
        planId: state.plan.id,
        isInstant
      });

      if (res.success) {
        toast.success(res.message || "Plano alterado com sucesso.");
        closePlanChange();
        onSuccess?.(); // Invoca o refetch em vez de reload
      } else {
        toast.error(res.message || "Erro ao alterar o plano.");
      }
    } catch (e: any) {
      toast.error(e.message || "Falha ao processar alteração de plano.");
    } finally {
      setLoading(false);
    }
  };

  return {
    state,
    loading,
    openPlanChange,
    closePlanChange,
    handlePlanChange
  };
}
