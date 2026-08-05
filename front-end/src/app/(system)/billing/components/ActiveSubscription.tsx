import { ShieldCheck, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney, formatInterval } from "../utils/billing.utils";
import type { Subscription } from "../types/billing";
import { UsageMetrics } from "./UsageMetrics";

interface ActiveSubscriptionProps {
  activeSub: Subscription | null;
  usage: { tenants: number; users: number; chats: number } | null;
}

export function ActiveSubscription({ activeSub, usage }: ActiveSubscriptionProps) {
  if (!activeSub || !activeSub.plan) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">{activeSub.plan.name}</h2>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-bold rounded-full border border-green-500/20">
                {activeSub.status === 'TRIALING' ? 'Em teste' : 'Ativo'}
              </span>
            </div>
            {activeSub.trialEnd && activeSub.status === 'TRIALING' && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 mt-1 bg-amber-500/10 inline-flex px-2 py-0.5 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                <span>Termina em {new Date(activeSub.trialEnd).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">{formatMoney(activeSub.plan.price)}</span>
            <span className="text-xs text-muted-foreground">/{formatInterval(activeSub.plan.interval)}</span>
          </div>
        </div>

        <div className="relative z-10 mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">Próxima cobrança</span>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {activeSub.currentPeriodEnd 
                ? new Date(activeSub.currentPeriodEnd).toLocaleDateString()
                : 'Não definida'}
            </span>
          </div>
        </div>
      </div>

      <UsageMetrics usage={usage} plan={activeSub.plan} />
    </div>
  );
}
