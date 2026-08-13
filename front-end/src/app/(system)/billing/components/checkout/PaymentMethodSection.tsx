import { Controller, UseFormReturn } from "react-hook-form";
import { CreditCard } from "lucide-react";
import type { CheckoutFormValues } from "../../schemas/checkout.schema";

interface PaymentMethodSectionProps {
  form: UseFormReturn<CheckoutFormValues>;
}

export function PaymentMethodSection({ form }: PaymentMethodSectionProps) {
  const { control } = form;

  return (
    <div className="pt-2">
      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Forma de Pagamento</label>
      <Controller
        control={control}
        name="method"
        render={({ field: { onChange, value } }) => (
          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button" 
              aria-pressed={value === 'CREDIT_CARD'} 
              onClick={() => onChange('CREDIT_CARD')} 
              className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${value === 'CREDIT_CARD' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Cartão
            </button>
            <button 
              type="button" 
              aria-pressed={value === 'PIX'} 
              onClick={() => onChange('PIX')} 
              className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${value === 'PIX' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[9px]">P</div> PIX
            </button>
            <button 
              type="button" 
              aria-pressed={value === 'BOLETO'} 
              onClick={() => onChange('BOLETO')} 
              className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${value === 'BOLETO' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
            >
              Boleto
            </button>
          </div>
        )}
      />
    </div>
  );
}
