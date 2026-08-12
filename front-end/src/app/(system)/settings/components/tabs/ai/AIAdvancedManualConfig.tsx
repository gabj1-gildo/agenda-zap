import { Label } from "@/components/ui/label";
import { TenantConfig } from "../../../types/settings.types";

interface AIAdvancedManualConfigProps {
  tenant: TenantConfig;
  aiPresets: any;
  onSelectAdvancedPreset: (field: string, text: string) => void;
}

export function AIAdvancedManualConfig({ tenant, aiPresets, onSelectAdvancedPreset }: AIAdvancedManualConfigProps) {
  const fields = [
    { key: 'tom_atendimento', label: 'Tom de Atendimento' },
    { key: 'informacoes_gerais', label: 'Informações Gerais da Empresa' },
    { key: 'regras_agendamento', label: 'Regras de Agendamento' },
    { key: 'instrucoes_pagamento', label: 'Instruções de Pagamento' },
    { key: 'regras_transbordo', label: 'Regras de Transbordo (Humano)' },
    { key: 'restricoes', label: 'Restrições / Regras Rígidas' },
    { key: 'mensagem_encerramento', label: 'Mensagem de Encerramento' }
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden mt-6">
      <details className="group">
        <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-muted/30">
          <span>Modo Avançado (Personalização Manual)</span>
          <span className="transition group-open:rotate-180">
            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
          </span>
        </summary>
        <div className="p-4 bg-background border-t space-y-6">
          {fields.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={(tenant?.aiConfig as any)?.[key] || ""}
                onChange={e => onSelectAdvancedPreset(key, e.target.value)}
              >
                <option value="">Selecione um modelo avançado...</option>
                {aiPresets?.[key]?.map((opt: any) => (
                  <option key={opt.text} value={opt.text}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
