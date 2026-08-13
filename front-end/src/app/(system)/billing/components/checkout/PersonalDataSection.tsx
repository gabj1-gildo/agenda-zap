import { Controller, UseFormReturn } from "react-hook-form";
import type { CheckoutFormValues } from "../../schemas/checkout.schema";
import { maskDocument, maskPhone } from "../../utils/masks";

interface PersonalDataSectionProps {
  form: UseFormReturn<CheckoutFormValues>;
}

export function PersonalDataSection({ form }: PersonalDataSectionProps) {
  const { register, control, formState: { errors } } = form;

  return (
    <>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nome Completo</label>
        <input {...register("name")} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">E-mail</label>
        <input type="email" {...register("email")} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">CPF ou CNPJ</label>
          <Controller
            control={control}
            name="document"
            render={({ field: { onChange, value } }) => (
              <input value={value} onChange={(e) => onChange(maskDocument(e.target.value))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
            )}
          />
          {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">WhatsApp</label>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <input type="tel" value={value} onChange={(e) => onChange(maskPhone(e.target.value))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
            )}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>
    </>
  );
}
