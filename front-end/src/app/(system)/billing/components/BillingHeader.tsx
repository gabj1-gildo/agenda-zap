import { Button } from "@/components/ui/button";
import { CreditCard, ArrowUpCircle } from "lucide-react";

interface BillingHeaderProps {
  onChangeCard?: () => void;
  onViewPlans: () => void;
}

export function BillingHeader({ onChangeCard, onViewPlans }: BillingHeaderProps) {
  return (
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 shrink-0">
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
