import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Invoice, Subscription } from "../types/billing";

interface PendingInvoicesProps {
  pendingInvoices: Invoice[];
  activeSub: Subscription | null;
}

export function PendingInvoices({ pendingInvoices, activeSub }: PendingInvoicesProps) {
  if (!pendingInvoices || pendingInvoices.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/[0.04] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-red-500" />
        <span className="font-bold text-sm text-red-500">Faturas Pendentes</span>
      </div>
      <div className="space-y-2">
        {pendingInvoices.map((inv) => (
          <div key={inv.id} className="flex flex-col sm:flex-row justify-between sm:items-center rounded-lg border border-border/50 bg-background p-3 gap-2">
            <div>
              <p className="font-semibold text-sm">
                {inv.type === 'SUBSCRIPTION' ? 'Renovação do Plano' : `Uso excedente ${inv.month}/${inv.year}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {inv.type === 'SUBSCRIPTION'
                  ? 'Pagamento via PIX/Boleto'
                  : `${inv.extraChats} chats × R$ ${Number(activeSub?.plan?.extraChatPrice || 0).toFixed(2)}`}
              </p>
              {inv.dueDate && (
                <p className="text-[11px] font-semibold text-red-500 mt-0.5">
                  Venc: {new Date(inv.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <span className="font-extrabold text-lg">
                R$ {Number(inv.totalAmount).toFixed(2).replace('.', ',')}
              </span>
              <Button 
                size="sm" 
                variant="destructive" 
                className="text-xs shadow-sm" 
                onClick={() => window.open(inv.paymentUrl || '#', '_blank')}
              >
                Pagar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
