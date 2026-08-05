import { ShieldCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "../utils/billing.utils";
import type { Subscription } from "../types/billing";

interface ActiveSubscriptionProps {
  activeSub: Subscription | null;
  trialDaysRemaining: number | null;
  onChangeCard?: () => void;
}

export function ActiveSubscription({ activeSub, trialDaysRemaining, onChangeCard }: ActiveSubscriptionProps) {
  if (!activeSub) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/[0.06] to-transparent px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Plano: {activeSub.plan?.name}</span>
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
              activeSub.status === 'ACTIVE'
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", activeSub.status === 'ACTIVE' ? "bg-green-500" : "bg-yellow-500")} />
              {activeSub.status}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {activeSub.plan?.maxTenants} Filiais • {activeSub.plan?.includedChats} Chats IA/mês • R$ {formatMoney(activeSub.plan?.price)}/{activeSub.plan?.interval === 'yearly' ? 'ano' : 'mês'}
          </p>
        </div>
      </div>
      {trialDaysRemaining !== null && (
        <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 font-semibold px-3 py-1.5 rounded-full text-xs border border-blue-500/20">
          <Clock className="w-3.5 h-3.5" />
          Trial: {trialDaysRemaining} dias restantes
        </div>
      )}
      {onChangeCard && (
        <button 
          onClick={onChangeCard}
          className="ml-auto text-xs font-semibold text-primary hover:underline px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          Trocar Cartão de Crédito
        </button>
      )}
    </div>
  );
}
