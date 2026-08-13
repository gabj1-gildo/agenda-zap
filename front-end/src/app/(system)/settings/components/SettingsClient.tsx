"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanySettings } from "../hooks/useCompanySettings";
import { useWhatsAppSettings } from "../hooks/useWhatsAppSettings";
import { useAISettings } from "../hooks/useAISettings";
import { useIntegrationsSettings } from "../hooks/useIntegrationsSettings";
import { CompanyTab } from "./tabs/company/CompanyTab";
import { WhatsAppTab } from "./tabs/whatsapp/WhatsAppTab";
import { AITab } from "./tabs/ai/AITab";
import { IntegrationsTab } from "./tabs/integrations/IntegrationsTab";
import { TagsTab } from "./tabs/tags/TagsTab";
import { useTagsSettings } from "../hooks/useTagsSettings";
import { TenantPhoneModal } from "@/components/TenantPhoneModal";
import { ConfirmDisconnectModal } from "./modals/ConfirmDisconnectModal";
import { ProviderSelectModal } from "./modals/ProviderSelectModal";
import { MetaCloudModal } from "./modals/MetaCloudModal";

interface SettingsClientProps {
  targetTenantId: string | null;
  isSuperAdmin: boolean;
}

export function SettingsClient({ targetTenantId, isSuperAdmin }: SettingsClientProps) {
  // Hooks
  const companySettings = useCompanySettings(targetTenantId);
  const whatsappSettings = useWhatsAppSettings(targetTenantId);
  const aiSettings = useAISettings(targetTenantId);
  const integrationsSettings = useIntegrationsSettings(targetTenantId);
  const tagsSettings = useTagsSettings(targetTenantId);

  // Modal states
  const [showPhoneModal, setShowPhoneModal] = useState<boolean | string>(false);
  const [showProviderSelect, setShowProviderSelect] = useState(false);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<string | null>(null);

  // No manual load needed anymore, handled by SWR

  if (!targetTenantId) {
    return <div className="p-8 text-center text-muted-foreground">Nenhuma empresa selecionada.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {showPhoneModal && (
        <TenantPhoneModal 
          tenantId={targetTenantId as string} 
          tenantPhone={companySettings.tenant?.phone || ""}
          existingInstanceId={typeof showPhoneModal === 'string' ? showPhoneModal : undefined}
          onClose={() => {
            setShowPhoneModal(false);
            whatsappSettings.mutateInstances();
          }} 
        />
      )}

      <ConfirmDisconnectModal 
        instanceId={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(null)}
        onConfirm={async () => {
          if (showDisconnectConfirm) {
            await whatsappSettings.removeInstance(showDisconnectConfirm);
            setShowDisconnectConfirm(null);
          }
        }}
      />

      <ProviderSelectModal 
        open={showProviderSelect}
        onOpenChange={setShowProviderSelect}
        onSelectEvolution={() => {
          setShowProviderSelect(false);
          setShowPhoneModal(true);
        }}
        onSelectMeta={() => {
          setShowProviderSelect(false);
          setShowMetaModal(true);
        }}
      />

      <MetaCloudModal 
        open={showMetaModal}
        onOpenChange={setShowMetaModal}
        tenant={companySettings.tenant!}
        updateTenantLocal={companySettings.updateTenantLocal}
        onSave={async () => {
          await companySettings.saveTenantData({
            whatsappMetaToken: companySettings.tenant?.whatsappMetaToken,
            whatsappMetaPhoneNumberId: companySettings.tenant?.whatsappMetaPhoneNumberId
          });
          setShowMetaModal(false);
        }}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações {isSuperAdmin ? "da Empresa" : ""}</h1>
        <p className="text-muted-foreground mt-1">Gerencie as preferências, horários e dados do estabelecimento{isSuperAdmin ? " selecionado" : ""}.</p>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4 h-auto md:h-10 gap-2">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="notificacoes">WhatsApp</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-6">
          <CompanyTab 
            tenant={companySettings.tenant}
            originalTenant={companySettings.originalTenant}
            saving={companySettings.saving}
            docValidating={companySettings.docValidating}
            docError={companySettings.docError}
            updateTenantLocal={companySettings.updateTenantLocal}
            saveTenantData={companySettings.saveTenantData}
            uploadLogo={companySettings.uploadLogo}
            deleteLogo={companySettings.deleteLogo}
            fetchCep={companySettings.fetchCep}
            validateDocument={companySettings.validateDocument}
          />
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
          <WhatsAppTab 
            tenant={companySettings.tenant}
            originalTenant={companySettings.originalTenant}
            instances={whatsappSettings.instances}
            onProviderSelect={() => setShowProviderSelect(true)}
            onMetaConfigure={() => setShowMetaModal(true)}
            onMetaRemove={async () => {
              if (confirm("Remover conexão Meta Cloud?")) {
                companySettings.updateTenantLocal({ whatsappMetaToken: undefined, whatsappMetaPhoneNumberId: undefined });
                setTimeout(() => companySettings.saveTenantData({ whatsappMetaToken: null as any, whatsappMetaPhoneNumberId: null as any }), 0);
              }
            }}
            onEvolutionReconnect={(id) => setShowPhoneModal(id)}
            onEvolutionRemove={(id) => setShowDisconnectConfirm(id)}
            onAIToggle={(checked) => {
              companySettings.updateTenantLocal({ aiEnabled: checked });
              setTimeout(() => companySettings.saveTenantData({ aiEnabled: checked }), 0);
            }}
          />
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <AITab 
            tenant={companySettings.tenant}
            originalTenant={companySettings.originalTenant}
            availableModels={aiSettings.availableModels}
            aiPresets={aiSettings.aiPresets}
            saving={companySettings.saving}
            isSuperAdmin={isSuperAdmin}
            updateAiConfig={(key, value) => {
              companySettings.updateTenantLocal({
                aiConfig: {
                  ...companySettings.tenant?.aiConfig,
                  [key]: value
                }
              });
            }}
            saveTenantData={companySettings.saveTenantData}
            getTenantVarValue={(v) => {
              if (v === 'nome_empresa') return companySettings.tenant?.name || "";
              if (v === 'telefone') return companySettings.tenant?.phone || "";
              if (v === 'endereco') return companySettings.tenant?.addressStreet || "";
              return companySettings.tenant?.aiConfig?.customVars?.[v] || "";
            }}
          />
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <TagsTab 
            tags={tagsSettings.tags}
            loading={tagsSettings.loading}
            saving={tagsSettings.saving}
            createTag={tagsSettings.createTag}
            updateTag={tagsSettings.updateTag}
            deleteTag={tagsSettings.deleteTag}
          />
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-6">
          <IntegrationsTab 
            tenant={companySettings.tenant}
            originalTenant={companySettings.originalTenant}
            keys={integrationsSettings.keys}
            updateTenantLocal={companySettings.updateTenantLocal}
            saveTenantData={companySettings.saveTenantData}
            onToggleKey={integrationsSettings.toggleKey}
            onAddKey={integrationsSettings.addKey}
            onDeleteKey={integrationsSettings.deleteKey}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
