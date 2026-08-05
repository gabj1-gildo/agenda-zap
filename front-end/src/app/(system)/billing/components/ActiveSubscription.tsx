import { ShieldCheck, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "../utils/billing.utils";
import type { Subscription } from "../types/billing";
import { UsageMetrics } from "./UsageMetrics";

interface ActiveSubscriptionProps {
  activeSub: Subscription | null;
  trialDaysRemaining: number | null;
  usage: { tenants: number; users: number; chats: number } | null;
}

export function ActiveSubscription({ activeSub, trialDaysRemaining, usage }: ActiveSubscriptionProps) {
  if (!activeSub) return null;

  return (
    <div className="bg-card border border-primary/20 shadow-sm rounded-xl p-5 mb-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-foreground">{activeSub.plan?.name}</span>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                activeSub.status === 'ACTIVE'
                  ? "bg-green-500/10 text-green-600 border border-green-500/20"
                  : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", activeSub.status === 'ACTIVE' ? "bg-green-500" : "bg-yellow-500")} />
                {activeSub.status}
              </span>
              
              {trialDaysRemaining !== null && (
                <div className="flex items-center gap-1 bg-blue-500/10 text-blue-600 font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border border-blue-500/20 ml-1">
                  <Clock className="w-3 h-3" />
                  Trial: {trialDaysRemaining} dias restantes
                </div>
              )}
            </div>
            {activeSub.cardLast4 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Cartão final {activeSub.cardLast4}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-medium text-muted-foreground">R$</span>
            <span className="text-2xl font-bold text-foreground">{formatMoney(activeSub.plan?.price ?? 0)}</span>
            <span className="text-xs text-muted-foreground">/{activeSub.plan?.interval === 'yearly' ? 'ano' : 'mês'}</span>
          </div>
          {activeSub.currentPeriodEnd && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              Renova em: {new Date(activeSub.currentPeriodEnd).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </div>

      <UsageMetrics subscription={activeSub} usage={usage} />
    </div>
  );
}
