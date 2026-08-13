import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatPhone } from "@/lib/utils";
import { TenantConfig } from "../../../types/settings.types";

interface BasicInfoFormProps {
  tenant: TenantConfig;
  updateTenant: (updates: Partial<TenantConfig>) => void;
  formatDocument: (val: string) => string;
  onValidateDocument: () => void;
  docError: string | null;
  docValidating: boolean;
}

export function BasicInfoForm({ tenant, updateTenant, formatDocument, onValidateDocument, docError, docValidating }: BasicInfoFormProps) {
  const isDocumentCPF = tenant?.document && tenant.document.replace(/\D/g, '').length <= 11;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Nome do Estabelecimento</Label>
        <Input 
          value={tenant?.name || ""} 
          onChange={e => updateTenant({ name: e.target.value })} 
        />
      </div>
      <div className="space-y-2">
        <Label>Telefone / WhatsApp</Label>
        <Input 
          value={tenant?.phone || ""} 
          onChange={e => updateTenant({ phone: formatPhone(e.target.value) })} 
          placeholder="+55 (00) 00000-0000"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>E-mail de Contato</Label>
          <Input 
            type="email"
            value={tenant?.email || ""} 
            onChange={e => updateTenant({ email: e.target.value })} 
            placeholder="contato@empresa.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Documento (CNPJ/CPF)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input 
                value={tenant?.document || ""} 
                onChange={e => {
                  const formatted = formatDocument(e.target.value);
                  updateTenant({ document: formatted });
                }}
                placeholder="00.000.000/0000-00"
                className={docError ? "border-red-500 pr-10" : "pr-10"}
              />
              {docValidating && (
                <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </div>
            <Button 
              variant="secondary" 
              onClick={onValidateDocument}
              disabled={docValidating || !tenant?.document}
            >
              Validar
            </Button>
          </div>
          {docError && <p className="text-xs text-red-500 mt-1">{docError}</p>}
        </div>
      </div>

      {isDocumentCPF && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-2">
            <Label>Data de Nascimento (CPF)</Label>
            <Input 
              value={tenant?.cpfBirthDate || ""} 
              onChange={e => updateTenant({ cpfBirthDate: e.target.value })} 
              placeholder="DD/MM/AAAA"
            />
          </div>
          <div className="space-y-2">
            <Label>Sexo (CPF)</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={tenant?.cpfGender || ''}
              onChange={e => updateTenant({ cpfGender: e.target.value })}
            >
              <option value="">Selecione...</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Descrição / Bio da Empresa</Label>
        <textarea 
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={tenant?.description || ""} 
          onChange={e => updateTenant({ description: e.target.value })} 
          placeholder="Um pequeno resumo sobre o seu negócio..."
        />
      </div>

      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">Relatório Diário</Label>
          <p className="text-sm text-muted-foreground">
            Receba um resumo de fechamento de caixa e próximos agendamentos no seu WhatsApp, todos os dias às 20h.
          </p>
        </div>
        <Switch
          checked={tenant?.dailyReportEnabled ?? true}
          onCheckedChange={(checked) => updateTenant({ dailyReportEnabled: checked })}
        />
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Modo de Agendamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Como sua empresa divide os horários?</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={tenant?.schedulingMode || 'GERAL'}
              onChange={e => updateTenant({ schedulingMode: e.target.value })}
            >
              <option value="GERAL">Modo Geral (A empresa como um todo)</option>
              <option value="PROFISSIONAL">Por Profissional (Cada um tem sua agenda)</option>
              <option value="CONSULTORIO">Por Consultório/Sala</option>
            </select>
            <p className="text-xs text-muted-foreground">Isso muda como a IA pesquisa a disponibilidade e os menus deste painel.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
