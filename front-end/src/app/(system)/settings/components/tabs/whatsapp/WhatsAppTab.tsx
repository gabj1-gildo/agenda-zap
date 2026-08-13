import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Smartphone } from "lucide-react";
import { InstanceUsageLimit } from "./InstanceUsageLimit";
import { MissingRequirementsAlert } from "./MissingRequirementsAlert";
import { MetaCloudInstanceCard } from "./MetaCloudInstanceCard";
import { EvolutionInstanceCard } from "./EvolutionInstanceCard";
import { AIToggleConfig } from "./AIToggleConfig";
import { WhatsAppInstance, TenantConfig } from "../../../types/settings.types";

interface WhatsAppTabProps {
  tenant: TenantConfig | null;
  originalTenant?: TenantConfig | null;
  instances: WhatsAppInstance[];
  onProviderSelect: () => void;
  onMetaConfigure: () => void;
  onMetaRemove: () => void;
  onEvolutionReconnect: (id: string) => void;
  onEvolutionRemove: (id: string) => void;
  onAIToggle: (checked: boolean) => void;
  updateTenantLocal: (data: Partial<TenantConfig>) => void;
  saveTenantData: (data: Partial<TenantConfig>) => Promise<boolean>;
}

export function WhatsAppTab({
  tenant,
  originalTenant,
  instances,
  onProviderSelect,
  onMetaConfigure,
  onMetaRemove,
  onEvolutionReconnect,
  onEvolutionRemove,
  onAIToggle,
  updateTenantLocal,
  saveTenantData
}: WhatsAppTabProps) {

  const hasMetaCloud = !!(tenant?.whatsappMetaToken && tenant?.whatsappMetaPhoneNumberId);
  const usedWhatsAppInstances = instances.length + (hasMetaCloud ? 1 : 0);
  const maxWhatsAppInstances = tenant?.customMaxWhatsAppInstances ?? 1;
  const limitReached = usedWhatsAppInstances >= maxWhatsAppInstances;

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp API</CardTitle>
        <CardDescription>Conecte o número do seu estabelecimento para enviar e receber mensagens automaticamente.</CardDescription>
      </CardHeader>
      {!tenant ? (
        <CardContent className="space-y-4 min-h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground animate-pulse">Carregando dados...</div>
        </CardContent>
      ) : (
        <CardContent className="space-y-4">
        <InstanceUsageLimit usedInstances={usedWhatsAppInstances} maxInstances={maxWhatsAppInstances} />

        {!tenant?._isProfileComplete && (
          <MissingRequirementsAlert requirements={tenant._missingRequirements || []} />
        )}

        <div className="flex justify-between items-center mt-6 mb-2">
          <h3 className="font-semibold">Aparelhos Conectados</h3>
          <Button size="sm" onClick={onProviderSelect} disabled={!tenant?._isProfileComplete || limitReached}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conexão
          </Button>
        </div>
        
        {instances.length === 0 && !hasMetaCloud ? (
          <div className="p-8 text-center text-muted-foreground border rounded-md bg-muted/20">
            <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
            Nenhum WhatsApp conectado. Clique em "Nova Conexão" para gerar um QR Code ou configurar a Meta Cloud.
          </div>
        ) : (
          <div className="space-y-3">
            {hasMetaCloud && (
              <MetaCloudInstanceCard onConfigure={onMetaConfigure} onRemove={onMetaRemove} />
            )}

            {instances.map((instance) => (
              <EvolutionInstanceCard 
                key={instance.id} 
                instance={instance} 
                onReconnect={onEvolutionReconnect}
                onRemove={onEvolutionRemove}
              />
            ))}
          </div>
        )}

        <div className="space-y-4 pt-4 mt-6 border-t">
          <AIToggleConfig 
            aiEnabled={tenant?.aiEnabled || false}
            onToggle={onAIToggle}
            disabled={!tenant?._isProfileComplete}
          />
        </div>

        {/* CLOSE-CHATS */}
        <div className="space-y-4 pt-4 mt-6 border-t">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">Fechamento Automático de Conversas (CLOSE-CHATS)</h3>
            <p className="text-sm text-muted-foreground mt-1">Configure o sistema para encerrar automaticamente conversas inativas para manter sua caixa de entrada limpa.</p>
          </div>
          
          <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Ativar fechamento automático</label>
                <p className="text-xs text-muted-foreground">Conversas inativas serão movidas para aba "Resolvidos".</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={tenant?.autoCloseChats || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateTenantLocal({ autoCloseChats: checked });
                    setTimeout(() => saveTenantData({ autoCloseChats: checked }), 0);
                  }}
                  disabled={!tenant?._isProfileComplete}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {tenant?.autoCloseChats && (
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Tempo de inatividade (Horas)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="48"
                    className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={tenant?.autoCloseHours ?? 24}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) val = 1;
                      if (val > 48) val = 48;
                      if (val < 1) val = 1;
                      updateTenantLocal({ autoCloseHours: val });
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) val = 1;
                      saveTenantData({ autoCloseHours: val });
                    }}
                    disabled={!tenant?._isProfileComplete}
                  />
                  <span className="text-sm text-muted-foreground">Máximo: 48 horas</span>
                </div>
              </div>
            )}
          </div>
        </div>
        </CardContent>
      )}
    </Card>
  );
}
