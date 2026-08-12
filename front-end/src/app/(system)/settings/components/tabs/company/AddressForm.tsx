import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TenantConfig } from "../../../types/settings.types";

interface AddressFormProps {
  tenant: TenantConfig;
  updateTenant: (updates: Partial<TenantConfig>) => void;
  onCepChange: (cep: string) => void;
}

export function AddressForm({ tenant, updateTenant, onCepChange }: AddressFormProps) {
  const numberInputRef = useRef<HTMLInputElement>(null);

  // We could focus number after cep fetch in the parent or here by passing a ref/prop if needed.
  // For simplicity, we just render the inputs.

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Endereço</h3>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="space-y-2 md:col-span-3">
          <Label>CEP</Label>
          <Input 
            value={tenant?.cep || ""} 
            onChange={e => {
              let val = e.target.value.replace(/\D/g, "");
              if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, "$1-$2");
              updateTenant({ cep: val });
              if (val.replace(/\D/g, "").length === 8) {
                onCepChange(val);
                setTimeout(() => numberInputRef.current?.focus(), 100);
              }
            }}
            placeholder="00000-000"
            maxLength={9}
          />
        </div>
        
        <div className="space-y-2 md:col-span-7">
          <Label>Rua / Avenida</Label>
          <Input 
            value={tenant?.addressStreet || ""} 
            onChange={e => updateTenant({ addressStreet: e.target.value })} 
            placeholder="Ex: Avenida Paulista"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Número</Label>
          <Input 
            ref={numberInputRef}
            value={tenant?.addressNumber || ""} 
            onChange={e => updateTenant({ addressNumber: e.target.value })} 
            placeholder="Ex: 1000"
          />
        </div>

        <div className="space-y-2 md:col-span-4">
          <Label>Complemento (Opcional)</Label>
          <Input 
            value={tenant?.addressComplement || ""} 
            onChange={e => updateTenant({ addressComplement: e.target.value })} 
            placeholder="Ex: Sala 202, Bloco B"
          />
        </div>

        <div className="space-y-2 md:col-span-3">
          <Label>Bairro</Label>
          <Input 
            value={tenant?.addressNeighborhood || ""} 
            onChange={e => updateTenant({ addressNeighborhood: e.target.value })} 
            placeholder="Ex: Centro"
          />
        </div>

        <div className="space-y-2 md:col-span-4">
          <Label>Cidade</Label>
          <Input 
            value={tenant?.addressCity || ""} 
            onChange={e => updateTenant({ addressCity: e.target.value })} 
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>UF</Label>
          <Input 
            value={tenant?.addressState || ""} 
            onChange={e => updateTenant({ addressState: e.target.value.toUpperCase() })} 
            maxLength={2}
            placeholder="SP"
          />
        </div>
      </div>
    </div>
  );
}
