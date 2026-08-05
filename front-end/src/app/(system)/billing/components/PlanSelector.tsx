import { memo, useState } from "react";
import { PlanCard } from "./PlanCard";
import type { Subscription, Plan } from "../types/billing";

interface PlanSelectorProps {
  variations: any;
  activeSub: Subscription | null;
  onSubscribe: (plan: Plan) => void;
  isRecommended?: boolean;
}

export const PlanSelector = memo(function PlanSelector({
  variations,
  activeSub,
  onSubscribe,
  isRecommended
}: PlanSelectorProps) {
  const availableCycles = Object.keys(variations);
  const [cycle, setCycle] = useState<string>(
    availableCycles.includes('monthly') ? 'monthly' 
    : availableCycles[0]
  );

  const plan = variations[cycle] || Object.values(variations)[0];
  if (!plan) return null;

  const isCurrentPlan = activeSub?.planId === plan.id;

  return (
    <PlanCard
      plan={plan}
      availableCycles={availableCycles}
      cycle={cycle}
      setCycle={setCycle}
      isCurrentPlan={isCurrentPlan}
      isRecommended={isRecommended}
      onSubscribe={onSubscribe}
    />
  );
});
