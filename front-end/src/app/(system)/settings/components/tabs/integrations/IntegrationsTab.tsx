import { ReceiveOnSiteToggle } from "./ReceiveOnSiteToggle";
import { ActiveGatewaySelect } from "./ActiveGatewaySelect";
import { GoogleCalendarCard } from "./GoogleCalendarCard";
import { PaymentGatewaysManager } from "./PaymentGatewaysManager";
import { TenantConfig, PaymentKey } from "../../../types/settings.types";

interface IntegrationsTabProps {
  tenant: TenantConfig | null;
  keys: PaymentKey[];
  updateTenantLocal: (updates: Partial<TenantConfig>) => void;
  saveGeneral: () => Promise<boolean>;
  onToggleKey: (id: string, isActive: boolean) => void;
  onAddKey: (newKey: Partial<PaymentKey>) => Promise<boolean>;
  onDeleteKey: (id: string) => void;
}

export function IntegrationsTab({
  tenant,
  keys,
  updateTenantLocal,
  saveGeneral,
  onToggleKey,
  onAddKey,
  onDeleteKey
}: IntegrationsTabProps) {
  return (
    <div className="space-y-6">
      {!tenant ? (
        <div className="py-8 text-center text-muted-foreground text-sm animate-pulse">Carregando integrações...</div>
      ) : (
        <>
      <ReceiveOnSiteToggle 
        acceptPaymentOnSite={tenant?.acceptPaymentOnSite || false}
        onToggle={(checked) => updateTenantLocal({ acceptPaymentOnSite: checked })}
        onSave={saveGeneral}
      />

      <ActiveGatewaySelect 
        keys={keys}
        onToggleKey={onToggleKey}
      />
      
      <GoogleCalendarCard 
        tenantId={tenant.id}
        hasToken={!!tenant?.googleCalendarToken}
      />

          <PaymentGatewaysManager 
            tenantId={tenant.id}
            keys={keys}
            onAddKey={onAddKey}
            onDeleteKey={onDeleteKey}
          />
        </>
      )}
    </div>
  );
}
