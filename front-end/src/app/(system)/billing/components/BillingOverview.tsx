import { CheckCircle, ExternalLink, Receipt } from "lucide-react";
import { formatMoney, cycleLabels } from "../utils/billing.utils";
import type { Subscription, Invoice } from "../types/billing";

interface BillingOverviewProps {
  subscription: Subscription | null;
  invoices: Invoice[];
  usage: { chats: number } | null;
}

export function BillingOverview({ subscription, invoices, usage }: BillingOverviewProps) {
  if (!subscription || !subscription.plan) return null;

  const plan = subscription.plan;
  const cycleName = cycleLabels[plan.interval] || 'Mensal';
  
  // Extra costs
  const chatsLimit = plan.includedChats;
  const chatsUsed = usage?.chats || 0;
  const extraChats = Math.max(0, chatsUsed - chatsLimit);
  const extraCost = extraChats * Number(plan.extraChatPrice);
  
  const basePrice = Number(plan.price);
  const nextInvoiceTotal = basePrice + extraCost;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Cobrança */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">Sua próxima fatura</h3>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Assinatura ({cycleName})</span>
            <span className="font-medium text-foreground">R$ {formatMoney(basePrice)}</span>
          </div>
          
          {extraCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chats extras ({extraChats})</span>
              <span className="font-medium text-amber-600">R$ {formatMoney(extraCost)}</span>
            </div>
          )}
          
          <div className="pt-3 border-t border-border flex justify-between">
            <span className="font-bold text-foreground">Total estimado</span>
            <span className="font-bold text-primary">R$ {formatMoney(nextInvoiceTotal)}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          {subscription.mpPreapprovalId && (
            <a 
              href="https://www.mercadopago.com.br/subscriptions" 
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 px-3 py-2 rounded-lg"
            >
              Ver no Mercado Pago <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Recursos inclusos */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-bold text-base text-foreground mb-4">Recursos do plano</h3>
        
        <ul className="space-y-2.5">
          <li className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            <span>Até <strong>{plan.maxTenants}</strong> {plan.maxTenants === 1 ? 'Filial' : 'Filiais'}</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            <span>Até <strong>{plan.maxUsers}</strong> Usuários por filial</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            <span><strong>{plan.includedChats}</strong> Chats de IA inclusos / mês</span>
          </li>
          
          {Array.isArray(plan.features) && plan.features.map((f: any, i: number) => {
            const isObj = typeof f === 'object' && f !== null;
            const text = isObj ? f.name : f;
            const included = isObj ? f.included : true;

            if (!included) return null;

            return (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
