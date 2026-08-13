import { Controller, UseFormReturn } from "react-hook-form";
import type { CheckoutFormValues } from "../../schemas/checkout.schema";
import { maskCardNumber, maskCardExpiry } from "../../utils/masks";
import type { Plan } from "../../types/billing";

interface CreditCardSectionProps {
  form: UseFormReturn<CheckoutFormValues>;
  plan: Plan | null;
  isMonthly: boolean;
}

export function CreditCardSection({ form, plan, isMonthly }: CreditCardSectionProps) {
  const { register, control, formState: { errors } } = form;

  return (
    <>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Número do Cartão</label>
        <Controller
          control={control}
          name="cardNumber"
          render={({ field: { onChange, value } }) => (
            <input value={value || ""} onChange={(e) => onChange(maskCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-mono" />
          )}
        />
        {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nome no Cartão</label>
        <input {...register("cardHolderName")} placeholder="Como impresso no cartão" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none uppercase" />
        {errors.cardHolderName && <p className="text-red-500 text-xs mt-1">{errors.cardHolderName.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Validade</label>
          <Controller
            control={control}
            name="cardExpiry"
            render={({ field: { onChange, value } }) => (
              <input value={value || ""} onChange={(e) => onChange(maskCardExpiry(e.target.value))} placeholder="MM/AA" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
            )}
          />
          {errors.cardExpiry && <p className="text-red-500 text-xs mt-1">{errors.cardExpiry.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">CVV</label>
          <input type="password" maxLength={4} {...register("cardCvv")} placeholder="123" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          {errors.cardCvv && <p className="text-red-500 text-xs mt-1">{errors.cardCvv.message}</p>}
        </div>
      </div>

      {!isMonthly && plan && (
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Número de Parcelas</label>
          <Controller
            control={control}
            name="installments"
            render={({ field: { onChange, value } }) => (
              <select 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}x de R$ {(Number(plan.price) / n).toFixed(2).replace(".", ",")} {n > 1 ? "sem juros" : ""}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      )}
    </>
  );
}
