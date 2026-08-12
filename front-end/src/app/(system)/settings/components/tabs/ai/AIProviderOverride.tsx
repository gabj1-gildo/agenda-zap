import { Label } from "@/components/ui/label";
import { MonitorSmartphone } from "lucide-react";
import { AIModel, TenantConfig } from "../../../types/settings.types";

interface AIProviderOverrideProps {
  tenant: TenantConfig;
  availableModels: AIModel[];
  updateAiConfig: (key: string, value: string) => void;
  isSuperAdmin: boolean;
}

export function AIProviderOverride({ tenant, availableModels, updateAiConfig, isSuperAdmin }: AIProviderOverrideProps) {
  if (!isSuperAdmin) return null;

  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-border mb-8">
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <MonitorSmartphone className="w-4 h-4" /> Sobrescrita de Motor de IA (Opcional)
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        Se não preenchido, a empresa usará o modelo global definido pelo Superadmin. Preencha aqui para forçar um motor específico para esta empresa. Esta opção é visível apenas para o Superadmin.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Provedor de IA</Label>
          <select
            value={tenant?.aiConfig?.ai_provider || ""}
            onChange={(e) => updateAiConfig('ai_provider', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Usar Padrão Global</option>
            <option value="gemini">Google Gemini (SDK Nativo)</option>
            <option value="groq">Groq (OpenAI Compatible)</option>
            <option value="deepseek">DeepSeek (OpenAI Compatible)</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label>Modelo Específico</Label>
          <select
            value={tenant?.aiConfig?.ai_model || ""}
            onChange={(e) => updateAiConfig('ai_model', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Usar Padrão Global</option>
            {availableModels
              .filter(m => !tenant?.aiConfig?.ai_provider || m.provider === tenant?.aiConfig?.ai_provider)
              .map(m => (
                <option key={m.id} value={m.modelId}>{m.name}</option>
              ))
            }
          </select>
        </div>
      </div>
    </div>
  );
}
