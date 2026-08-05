import { memo, useState } from "react";
import { CheckCircle, XCircle, Sparkles, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney, calculateMonthlyEquivalent, intervalLabels, cycleLabels } from "../utils/billing.utils";
import type { Plan } from "../types/billing";

interface PlanCardProps {
  plan: Plan;
  availableCycles: string[];
  cycle: string;
  setCycle: (cycle: string) => void;
  isCurrentPlan: boolean;
  isRecommended?: boolean;
  onSubscribe: (plan: Plan) => void;
}

export const PlanCard = memo(function PlanCard({
  plan,
  availableCycles,
  cycle,
  setCycle,
  isCurrentPlan,
  isRecommended,
  onSubscribe
}: PlanCardProps) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const allFeatures = plan.features || [];
  const visibleFeatures = showAllFeatures ? allFeatures : allFeatures.slice(0, 4);
  const hasMoreFeatures = allFeatures.length > 4;

  const monthlyEquivalent = calculateMonthlyEquivalent(plan.price, plan.interval);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden border",
        isRecommended
          ? "border-primary/60 shadow-xl shadow-primary/15 bg-gradient-to-b from-primary/[0.07] via-background to-background ring-1 ring-primary/20"
          : "border-border/50 bg-background/60 backdrop-blur-sm hover:shadow-lg hover:border-border/80",
        isCurrentPlan && "ring-2 ring-primary/30"
      )}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground text-[10px] font-bold uppercase tracking-widest text-center py-1">
          <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" />
          Recomendado
        </div>
      )}

      {/* Trial badge */}
      {plan.trialDays > 0 && (
        <div className={cn(
          "absolute top-5 right-[-32px] rotate-45 bg-blue-600 text-white text-[10px] font-extrabold py-0.5 w-[110px] text-center shadow-md z-20",
          isRecommended && "top-8"
        )}>
          {plan.trialDays} DIAS GRÁTIS
        </div>
      )}

      {/* Header */}
      <div className={cn("px-5 pt-5 pb-3 text-center", isRecommended && "pt-8")}>
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description}</p>

        {/* Cycle toggle */}
        {availableCycles.length > 1 && (
          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center p-0.5 bg-muted/70 rounded-full border border-border/40">
              {availableCycles.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-300",
                    cycle === c
                      ? c === 'yearly'
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setCycle(c)}
                >
                  {cycleLabels[c] || c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="mt-3">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-sm text-muted-foreground font-medium">R$</span>
            <span className="text-3xl font-extrabold text-foreground tracking-tight">{formatMoney(plan.price)}</span>
            <span className="text-xs text-muted-foreground font-medium">/{intervalLabels[plan.interval] || 'mês'}</span>
          </div>
          {monthlyEquivalent && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              equivale a <span className="font-semibold text-foreground/80">R$ {formatMoney(monthlyEquivalent)}</span>/mês
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-border/40" />

      {/* Features */}
      <div className="flex-1 px-5 py-3">
        <ul className="space-y-1.5 text-[13px]">
          {/* Core limits */}
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground">Até <strong>{plan.maxUsers}</strong> Usuários / Filial</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground">Até <strong>{plan.maxTenants}</strong> {plan.maxTenants === 1 ? 'Consultório ou Clínica' : 'Consultórios ou Clínicas'}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground"><strong>{plan.includedChats}</strong> Chats de IA / mês</span>
          </li>
          <li className="flex items-center gap-2 opacity-70">
            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">R$ {formatMoney(plan.extraChatPrice)} por chat extra</span>
          </li>

          {/* Plan features */}
          {visibleFeatures.map((f: any, i: number) => {
            const isObj = typeof f === 'object' && f !== null;
            const text = isObj ? f.name : f;
            const included = isObj ? f.included : true;

            return (
              <li key={i} className={cn("flex items-center gap-2", !included && "opacity-40")}>
                {included ? (
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500/50 shrink-0" />
                )}
                <span className={cn("truncate", included ? "text-foreground" : "text-muted-foreground line-through")}>{text}</span>
              </li>
            );
          })}
        </ul>

        {/* Expand/collapse features */}
        {hasMoreFeatures && (
          <button
            className="flex items-center gap-1 text-[11px] text-primary font-medium mt-2 hover:underline mx-auto"
            onClick={() => setShowAllFeatures(!showAllFeatures)}
          >
            {showAllFeatures ? (
              <><ChevronUp className="w-3 h-3" /> Menos detalhes</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> +{allFeatures.length - 4} funcionalidades</>
            )}
          </button>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        {isCurrentPlan ? (
          <Button
            className="w-full text-sm py-2.5 font-semibold bg-muted text-muted-foreground hover:bg-muted cursor-default border border-dashed border-border"
            disabled
          >
            Plano Atual
          </Button>
        ) : (
          <Button
            className={cn(
              "w-full text-sm py-2.5 font-semibold transition-all duration-300",
              isRecommended
                ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 hover:shadow-primary/40"
                : "shadow-sm hover:shadow-md"
            )}
            onClick={() => onSubscribe(plan)}
          >
            Assinar {plan.name}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
});
