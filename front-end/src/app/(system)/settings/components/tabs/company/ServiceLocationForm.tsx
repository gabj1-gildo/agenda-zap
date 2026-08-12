import { Label } from "@/components/ui/label";
import { TenantConfig } from "../../../types/settings.types";

interface ServiceLocationFormProps {
  tenant: TenantConfig;
  updateTenant: (updates: Partial<TenantConfig>) => void;
}

export function ServiceLocationForm({ tenant, updateTenant }: ServiceLocationFormProps) {
  return (
    <>
      <div className="space-y-3 mt-4">
        <Label className="text-sm font-semibold">Tipo de Atendimento</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'ON_SITE', label: 'No Estabelecimento', desc: 'Clientes vêm até você', icon: '🏪' },
            { value: 'DOMICILE', label: 'A Domicílio', desc: 'Você vai até o cliente', icon: '🚗' },
            { value: 'BOTH', label: 'Ambos', desc: 'Os dois tipos', icon: '🔄' },
          ].map(opt => (
            <label
              key={opt.value}
              className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                (tenant?.serviceLocationType || 'ON_SITE') === opt.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  name="serviceLocationType"
                  value={opt.value}
                  checked={(tenant?.serviceLocationType || 'ON_SITE') === opt.value}
                  onChange={() => updateTenant({ serviceLocationType: opt.value })}
                  className="accent-primary"
                />
                <span className="text-lg">{opt.icon}</span>
                <span className="font-semibold text-sm">{opt.label}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">{opt.desc}</p>
            </label>
          ))}
        </div>
      </div>

      {(tenant?.serviceLocationType === 'DOMICILE' || tenant?.serviceLocationType === 'BOTH') && (
        <div className="space-y-3 mt-4">
          <Label className="text-sm font-semibold">Perímetro de Atendimento a Domicílio</Label>
          <textarea
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={3}
            value={tenant?.servicePerimeter || ""}
            onChange={e => updateTenant({ servicePerimeter: e.target.value })}
            placeholder={`Descreva a área de atendimento. Exemplos:\n- Raio de 15km a partir do centro\n- Bairros: Centro, Santa Mônica, Jardim América\n- Cidades: Monte Claros, Bocaiuva, Pirapora`}
          />
          <div className="flex gap-2 flex-wrap">
            {['Raio de 10km', 'Raio de 20km', 'Cidade toda', 'Região metropolitana'].map(sugg => (
              <button
                key={sugg}
                type="button"
                onClick={() => updateTenant({ servicePerimeter: sugg })}
                className="text-xs px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
              >
                + {sugg}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">A IA usará esta informação para validar o endereço enviado pelo cliente e informar se está dentro do perímetro.</p>
        </div>
      )}
    </>
  );
}
