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
  onAIToggle
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
        </CardContent>
      )}
    </Card>
  );
}
