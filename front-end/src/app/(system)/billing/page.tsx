"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useBilling } from "./hooks/useBilling";
import { useCheckout } from "./hooks/useCheckout";
import { usePlanChange } from "./hooks/usePlanChange";
import { groupPlans, getRecommendedPlanKey, isUpgrade, calculateTrialRemainingDays } from "./utils/billing.utils";

import { BillingHeader } from "./components/BillingHeader";
import { BillingSkeleton } from "./components/BillingSkeleton";
import { ActiveSubscription } from "./components/ActiveSubscription";
import { PendingInvoices } from "./components/PendingInvoices";
import { PlanSelector } from "./components/PlanSelector";
import { CheckoutForm } from "./components/CheckoutForm";
import { UpgradeModal } from "./components/UpgradeModal";
import { ChangeCardModal } from "./components/ChangeCardModal";
import type { Plan } from "./types/billing";

export default function BillingPage() {
  const billing = useBilling();
  const checkout = useCheckout({ onSuccess: billing.refetch });
  const planChange = usePlanChange({ onSuccess: billing.refetch });
  const { data: session } = useSession();
  const [showChangeCardModal, setShowChangeCardModal] = useState(false);

  const groupedPlans = useMemo(() => groupPlans(billing.plans), [billing.plans]);
  const planNames = Object.keys(groupedPlans);
  const recommendedPlanName = getRecommendedPlanKey(groupedPlans);
  const trialDaysRemaining = calculateTrialRemainingDays(billing.subscription?.trialEnd ?? null);

  const onPlanActionClick = (plan: Plan) => {
    if (billing.subscription && billing.subscription.plan) {
      const upgrade = isUpgrade(billing.subscription.plan, plan);
      planChange.openPlanChange(plan, upgrade);
    } else {
      checkout.openCheckout(plan.id);
    }
  };

  if (billing.loading) {
    return <BillingSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-6xl mx-auto min-h-0">
      <BillingHeader />

      <ActiveSubscription 
        activeSub={billing.subscription} 
        trialDaysRemaining={trialDaysRemaining} 
        onChangeCard={() => setShowChangeCardModal(true)}
      />

      {showChangeCardModal && (
        <ChangeCardModal
          onClose={() => setShowChangeCardModal(false)}
          onSuccess={billing.refetch}
          sessionToken={(session?.user as any)?.accessToken || ""}
          tenantId={(session?.user as any)?.tenantId || ""}
        />
      )}

      <PendingInvoices 
        pendingInvoices={billing.invoices} 
        activeSub={billing.subscription} 
      />

      {checkout.showCheckout ? (
        <CheckoutForm 
          loading={checkout.loading}
          onClose={checkout.closeCheckout}
          onSubmit={checkout.handleCheckout}
        />
      ) : planChange.state.show && planChange.state.plan ? (
        <UpgradeModal 
          plan={planChange.state.plan}
          isUpgrade={planChange.state.isUpgrade}
          loading={planChange.loading}
          onClose={planChange.closePlanChange}
          onConfirm={planChange.handlePlanChange}
        />
      ) : (
        <div className="flex-1 flex flex-col justify-center min-h-0 mt-4">
          <div className={cn(
            "grid gap-4 items-stretch",
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
      )}
    </div>
  );
}
