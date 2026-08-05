import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { createCheckout } from "../services/billing.service";
import type { CheckoutRequest, Plan } from "../types/billing";

interface UseCheckoutProps {
  onSuccess?: () => void;
}

export function useCheckout({ onSuccess }: UseCheckoutProps = {}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const openCheckout = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  const handleCheckout = async (formData: Omit<CheckoutRequest, 'planId'>) => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const auth = { 
        token: (session?.user as any)?.accessToken, 
        tenantId: (session?.user as any)?.tenantId 
      };

      const res = await createCheckout(auth, {
        ...formData,
        planId: selectedPlan.id
      });

      if (res.success) {
        if (res.data?.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        } else if (res.data?.pix) {
          toast.success("PIX gerado. O código foi enviado por e-mail/WhatsApp.");
          closeCheckout();
          onSuccess?.();
        } else {
          toast.error("Resposta inválida do servidor.");
        }
      } else {
        toast.error(res.error || "Erro ao realizar assinatura.");
      }
    } catch (e: any) {
      toast.error(e.message || "Falha ao processar assinatura.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    showCheckout,
    openCheckout,
    closeCheckout,
    handleCheckout,
    selectedPlan,
  };
}
