import { formatMoney } from "../utils/billing.utils";
import type { Subscription } from "../types/billing";

interface UsageMetricsProps {
  subscription: Subscription | null;
  usage: { tenants: number; users: number; chats: number } | null;
}

export function UsageMetrics({ subscription, usage }: UsageMetricsProps) {
  if (!subscription || !subscription.plan || !usage) return null;

  const plan = subscription.plan;
  const tenantsLimit = plan.maxTenants;
  const usersLimit = plan.maxUsers * tenantsLimit; // Total allowed users across all tenants
  const chatsLimit = plan.includedChats;

  const tenantsUsed = usage.tenants;
  const usersUsed = usage.users;
  const chatsUsed = usage.chats;

  const extraChats = Math.max(0, chatsUsed - chatsLimit);
  const extraCost = extraChats * Number(plan.extraChatPrice);

  const renderMetric = (
    title: string,
    used: number,
    limit: number,
    isExtra: boolean = false,
    extraCostLabel?: string
  ) => {
    const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 100;
    const overLimit = used > limit;
    
    return (
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-foreground">{title}</h4>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {used} / {limit}
          </span>
        </div>
        
        <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full ${overLimit ? 'bg-amber-500' : 'bg-primary'} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {isExtra && overLimit ? (
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">
              {extraChats} chats extras · R$ {formatMoney(Number(plan.extraChatPrice))} cada
            </span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-500/20 px-2 py-1 rounded w-fit">
              + R$ {formatMoney(extraCost)} este mês
            </span>
          </div>
        ) : overLimit ? (
          <span className="text-xs text-amber-600 font-medium mt-1">Limite atingido</span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {renderMetric("Chats de IA", chatsUsed, chatsLimit, true)}
      {renderMetric("Filiais", tenantsUsed, tenantsLimit)}
      {renderMetric("Usuários", usersUsed, usersLimit)}
    </div>
  );
}
