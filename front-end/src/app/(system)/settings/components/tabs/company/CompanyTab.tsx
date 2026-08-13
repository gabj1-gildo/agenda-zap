import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoUpload } from "./LogoUpload";
import { BasicInfoForm } from "./BasicInfoForm";
import { AddressForm } from "./AddressForm";
import { ServiceLocationForm } from "./ServiceLocationForm";
import { TenantConfig } from "../../../types/settings.types";
import { toast } from "sonner";

interface CompanyTabProps {
  tenant: TenantConfig | null;
  saving: boolean;
  docValidating: boolean;
  docError: string | null;
  updateTenantLocal: (updates: Partial<TenantConfig>) => void;
  saveTenantData: (payload: Partial<TenantConfig>) => Promise<boolean>;
  uploadLogo: (file: File) => Promise<string | null>;
  deleteLogo: (url: string) => Promise<void>;
  fetchCep: (cep: string) => void;
  validateDocument: (doc: string) => Promise<boolean>;
}

export function CompanyTab({
  tenant,
  saving,
  docValidating,
  docError,
  updateTenantLocal,
  saveTenantData,
  uploadLogo,
  deleteLogo,
  fetchCep,
  validateDocument
}: CompanyTabProps) {
  const [pendingLogoUrl, setPendingLogoUrl] = useState<string | null>(null);

  const handleSaveLogo = async () => {
    if (pendingLogoUrl) {
      const success = await saveTenantData({ logoUrl: pendingLogoUrl });
      if (success) {
        setPendingLogoUrl(null);
      }
    }
  };

  const handleSaveBasicInfo = async () => {
    if (tenant?.document) {
      const isValid = await validateDocument(tenant.document);
      if (!isValid) {
        toast.error("Corrija os erros no documento antes de salvar.");
        return;
      }
    }
    saveTenantData({
      name: tenant?.name,
      phone: tenant?.phone,
      email: tenant?.email,
      document: tenant?.document,
      cpfBirthDate: tenant?.cpfBirthDate,
      cpfGender: tenant?.cpfGender,
      description: tenant?.description,
      schedulingMode: tenant?.schedulingMode
    });
  };

  const handleSaveAddress = async () => {
    if (tenant?.document) {
      const raw = tenant.document.replace(/\D/g, '');
      if (raw.length > 11) { // CNPJ
        if (!tenant.addressStreet || !tenant.addressNumber || !tenant.addressNeighborhood || !tenant.addressCity || !tenant.addressState || !tenant.cep) {
          toast.error("Para contas PJ (CNPJ), o endereço completo é obrigatório.");
          return;
        }
      }
    }
    saveTenantData({
      cep: tenant?.cep,
      addressStreet: tenant?.addressStreet,
      addressNumber: tenant?.addressNumber,
      addressComplement: tenant?.addressComplement,
      addressNeighborhood: tenant?.addressNeighborhood,
      addressCity: tenant?.addressCity,
      addressState: tenant?.addressState
    });
  };

  const handleSaveServiceLocation = async () => {
    saveTenantData({
      serviceLocationType: tenant?.serviceLocationType,
      servicePerimeter: tenant?.servicePerimeter,
      acceptPaymentOnSite: tenant?.acceptPaymentOnSite
    });
  };

  const handleNewLogoSelect = (url: string | null) => {
    setPendingLogoUrl(url);
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "$1.$2.$3-$4").replace(/(-\d{2})\d+?$/, "$1");
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "$1.$2.$3/$4-$5").replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  if (!tenant) {
    return (
      <div className="space-y-6 min-h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando dados da empresa...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Logotipo */}
      <Card>
        <CardHeader>
          <CardTitle>Logotipo da Empresa</CardTitle>
          <CardDescription>A logo que será exibida para os seus clientes no sistema e WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUpload 
            currentLogoUrl={tenant?.logoUrl || tenant?.logo_url}
            newLogoUrl={pendingLogoUrl}
            onUpload={uploadLogo}
            onDeleteNew={deleteLogo}
            onNewLogoSelect={handleNewLogoSelect}
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6">
          <Button onClick={handleSaveLogo} disabled={saving || !pendingLogoUrl}>
            {saving ? "Salvando..." : "Salvar Logotipo"}
          </Button>
        </CardFooter>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>O nome, contato e documento da sua empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <BasicInfoForm 
            tenant={tenant}
            updateTenant={updateTenantLocal}
            formatDocument={formatDocument}
            onValidateDocument={() => tenant?.document && validateDocument(tenant.document)}
            docError={docError}
            docValidating={docValidating}
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6">
          <Button onClick={handleSaveBasicInfo} disabled={saving || docValidating}>
            {saving ? "Salvando..." : "Salvar Informações"}
          </Button>
        </CardFooter>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
          <CardDescription>O endereço físico do seu estabelecimento.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddressForm 
            tenant={tenant}
            updateTenant={updateTenantLocal}
            onCepChange={fetchCep}
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6">
          <Button onClick={handleSaveAddress} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Endereço"}
          </Button>
        </CardFooter>
      </Card>

      {/* Service Location */}
      <Card>
        <CardHeader>
          <CardTitle>Locais e Raio de Atendimento</CardTitle>
          <CardDescription>Defina como e onde você atende seus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceLocationForm 
            tenant={tenant}
            updateTenant={updateTenantLocal}
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6">
          <Button onClick={handleSaveServiceLocation} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Local de Atendimento"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
