import { Label } from "@/components/ui/label";
import { AIPreset, TenantConfig } from "../../../types/settings.types";

interface AIGlobalPresetsProps {
  tenant: TenantConfig;
  globalPresets: AIPreset[];
  onSelectPreset: (preset: AIPreset) => void;
}

export function AIGlobalPresets({ tenant, globalPresets, onSelectPreset }: AIGlobalPresetsProps) {
  return (
    <div>
      <Label className="text-base font-semibold">Modelo de Negócio (IA)</Label>
      <p className="text-xs text-muted-foreground mb-4">Escolha o modelo que melhor descreve o seu negócio. A IA será configurada automaticamente com as melhores práticas.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {globalPresets.map((preset) => (
          <div 
            key={preset.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${tenant?.aiConfig?.preset_id === preset.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/50'}`}
            onClick={() => onSelectPreset(preset)}
          >
            <div className="font-semibold">{preset.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{preset.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
