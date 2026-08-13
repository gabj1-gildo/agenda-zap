import { UseFormReturn } from "react-hook-form";
import type { CheckoutFormValues } from "../../schemas/checkout.schema";

interface OTPSectionProps {
  form: UseFormReturn<CheckoutFormValues>;
  onBack: () => void;
}

export function OTPSection({ form, onBack }: OTPSectionProps) {
  const { register, getValues, formState: { errors } } = form;

  return (
    <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-right-4">
      <div className="text-center space-y-2 mb-6">
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para o WhatsApp <strong>{getValues("phone")}</strong>.
        </p>
      </div>
      
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 text-center">
          Código de Verificação
        </label>
        <input 
          type="text" 
          maxLength={6} 
          {...register("otpCode")} 
          className="w-full max-w-[200px] mx-auto block bg-background border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-primary/20 outline-none" 
          placeholder="000000"
        />
        {errors.otpCode && <p className="text-red-500 text-xs mt-1 text-center">{errors.otpCode.message}</p>}
      </div>

      <div className="flex justify-center pt-2">
        <button type="button" onClick={onBack} className="text-xs text-primary hover:underline font-medium">
          Voltar e editar dados
        </button>
      </div>
    </div>
  );
}
