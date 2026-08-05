import { Button } from "@/components/ui/button";
import { CreditCard, ArrowUpCircle } from "lucide-react";

interface BillingHeaderProps {
  onChangeCard?: () => void;
  onViewPlans: () => void;
}

export function BillingHeader({ onChangeCard, onViewPlans }: BillingHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
          Seu plano
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie sua assinatura, formas de pagamento e acompanhe seu uso.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {onChangeCard && (
          <Button variant="outline" size="sm" onClick={onChangeCard}>
            <CreditCard className="w-4 h-4 mr-2" />
            Trocar cartão
          </Button>
        )}
        <Button size="sm" onClick={onViewPlans} className="shadow-sm">
          <ArrowUpCircle className="w-4 h-4 mr-2" />
          Ver planos e upgrade
        </Button>
      </div>
    </div>
  );
}
