"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useBilling } from "./hooks/useBilling";
import { useCheckout } from "./hooks/useCheckout";
import { usePlanChange } from "./hooks/usePlanChange";
import { groupPlans, getRecommendedPlanKey, isUpgrade } from "./utils/billing.utils";

import { BillingHeader } from "./components/BillingHeader";
import { BillingSkeleton } from "./components/BillingSkeleton";
import { ActiveSubscription } from "./components/ActiveSubscription";
import { PendingInvoices } from "./components/PendingInvoices";
import { PlanSelector } from "./components/PlanSelector";
import { CheckoutForm } from "./components/CheckoutForm";
import { UpgradeModal } from "./components/UpgradeModal";
import { ChangeCardModal } from "./components/ChangeCardModal";
import type { Plan } from "./types/billing";

import { BillingOverview } from "./components/BillingOverview";
import { UpgradeBanner } from "./components/UpgradeBanner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function BillingPage() {
  const billing = useBilling();
  const checkout = useCheckout({ onSuccess: billing.refetch });
  const planChange = usePlanChange({ onSuccess: billing.refetch });
  const { data: session } = useSession();
  const [showChangeCardModal, setShowChangeCardModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);

  const groupedPlans = useMemo(() => groupPlans(billing.plans), [billing.plans]);
  const planNames = Object.keys(groupedPlans);
  const recommendedPlanName = getRecommendedPlanKey(groupedPlans);

  const onPlanActionClick = (plan: Plan) => {
    setShowPlansModal(false); // Close plans modal if it's open
    if (billing.subscription && billing.subscription.plan) {
      const upgrade = isUpgrade(billing.subscription.plan, plan);
      planChange.openPlanChange(plan, upgrade);
    } else {
      checkout.openCheckout(plan);
    }
  };

  if (billing.loading) {
    return <BillingSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-5xl mx-auto min-h-0">
      <BillingHeader 
        onChangeCard={() => setShowChangeCardModal(true)} 
        onViewPlans={() => {
          setShowPlansModal(true);
          setTimeout(() => {
            document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }} 
      />

      <ActiveSubscription 
        activeSub={billing.subscription} 
        usage={billing.usage}
      />

      {showChangeCardModal && (
        <ChangeCardModal
          onClose={() => setShowChangeCardModal(false)}
          onSuccess={billing.refetch}
          sessionToken={(session?.user as any)?.accessToken || ""}
          tenantId={(session?.user as any)?.tenantId || ""}
        />
      )}

      {/* Exibir faturas pendentes caso haja (já estava no layout antigo) */}
      <PendingInvoices 
        pendingInvoices={billing.invoices} 
        activeSub={billing.subscription} 
      />

      <BillingOverview 
        subscription={billing.subscription} 
        invoices={billing.invoices} 
        usage={billing.usage} 
      />

      <UpgradeBanner 
        subscription={billing.subscription} 
        usage={billing.usage} 
        onUpgradeClick={() => setShowPlansModal(true)}
      />

      {checkout.showCheckout && (
        <CheckoutForm 
          loading={checkout.loading}
          plan={checkout.selectedPlan}
          onClose={checkout.closeCheckout}
          onSubmit={checkout.handleCheckout}
        />
      )}
      
      {planChange.state.show && planChange.state.plan && (
        <UpgradeModal 
          plan={planChange.state.plan}
          isUpgrade={planChange.state.isUpgrade}
          loading={planChange.loading}
          currentSub={billing.subscription}
          onClose={planChange.closePlanChange}
          onConfirm={planChange.handlePlanChange}
        />
      )}

      {showPlansModal && (
        <div className="mt-8 pt-8 border-t border-border animate-in fade-in slide-in-from-bottom-8 duration-500" id="planos">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Escolha um plano</h2>
            <p className="text-muted-foreground mt-2">
              Selecione o plano ideal para a sua empresa.
            </p>
            <button 
              onClick={() => setShowPlansModal(false)}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Cancelar e ocultar planos
            </button>
          </div>
          <div className="pb-8">
            <div className={cn(
              "grid gap-6 items-stretch",
              planNames.length === 1 && "max-w-sm mx-auto",
              planNames.length === 2 && "md:grid-cols-2 max-w-3xl mx-auto",
              planNames.length >= 3 && "md:grid-cols-2 lg:grid-cols-3"
            )}>
              {planNames.map(planName => (
                <PlanSelector
                  key={planName}
                  variations={groupedPlans[planName]}
                  activeSub={billing.subscription}
                  isRecommended={planName === recommendedPlanName}
                  onSubscribe={onPlanActionClick}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
