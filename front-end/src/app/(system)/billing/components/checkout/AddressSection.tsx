import { Controller, UseFormReturn } from "react-hook-form";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CheckoutFormValues } from "../../schemas/checkout.schema";
import { maskCep } from "../../utils/masks";

interface AddressSectionProps {
  form: UseFormReturn<CheckoutFormValues>;
}

export function AddressSection({ form }: AddressSectionProps) {
  const { register, control, setValue, watch } = form;
  const [validatingCep, setValidatingCep] = useState(false);

  const currentCep = watch("cep");

  const handleCepBlur = async () => {
    if (!currentCep) return;
    const cep = currentCep.replace(/\D/g, "");
    if (cep.length === 8) {
      setValidatingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (data.erro) {
          toast.error("CEP não encontrado");
        } else {
          setValue("street", data.logradouro);
          setValue("neighborhood", data.bairro);
          setValue("city", data.localidade);
          setValue("state", data.uf);
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      } finally {
        setValidatingCep(false);
      }
    }
  };

  return (
    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-2 mt-2">
        <MapPin className="w-3.5 h-3.5 text-primary" />
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0">Endereço de Cobrança</label>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 relative">
          <Controller
            control={control}
            name="cep"
            render={({ field: { onChange, value } }) => (
              <input value={value || ""} onChange={(e) => onChange(maskCep(e.target.value))} onBlur={handleCepBlur} placeholder="CEP" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
            )}
          />
          {validatingCep && <div className="absolute right-4 top-3 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </div>
        <input {...register("number")} placeholder="Nº" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-3">
        <input {...register("street")} placeholder="Rua / Logradouro" className="col-span-3 w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
        <input {...register("neighborhood")} placeholder="Bairro" className="col-span-1 w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
        <input {...register("city")} placeholder="Cidade" className="col-span-1 w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
        <input {...register("state")} placeholder="UF" maxLength={2} className="col-span-1 text-center w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
      </div>
    </div>
  );
}
