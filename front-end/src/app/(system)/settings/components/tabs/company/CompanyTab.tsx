import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoUpload } from "./LogoUpload";
import { BasicInfoForm } from "./BasicInfoForm";
import { AddressForm } from "./AddressForm";
import { ServiceLocationForm } from "./ServiceLocationForm";
import { TenantConfig } from "../../../types/settings.types";
import { toast } from "sonner";

interface CompanyTabProps {
  tenant: TenantConfig;
  saving: boolean;
  docValidating: boolean;
  docError: string | null;
  updateTenantLocal: (updates: Partial<TenantConfig>) => void;
  saveGeneral: (extraPayload?: any) => Promise<boolean>;
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
  saveGeneral,
  uploadLogo,
  deleteLogo,
  fetchCep,
  validateDocument
}: CompanyTabProps) {

  const handleSaveWithValidation = async () => {
    if (tenant?.document) {
      const raw = tenant.document.replace(/\D/g, '');
      if (raw.length > 11) { // CNPJ
        if (!tenant.addressStreet || !tenant.addressNumber || !tenant.addressNeighborhood || !tenant.addressCity || !tenant.addressState || !tenant.cep) {
          toast.error("Para contas PJ (CNPJ), o endereço completo é obrigatório.");
          return;
        }
      }
      const isValid = await validateDocument(tenant.document);
      if (!isValid) {
        toast.error("Corrija os erros no documento antes de salvar.");
        return;
      }
    }
    saveGeneral();
  };

  const handleNewLogoSelect = (url: string) => {
    updateTenantLocal({ logoUrl: url });
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "$1.$2.$3-$4").replace(/(-\d{2})\d+?$/, "$1");
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "$1.$2.$3/$4-$5").replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Dados do Estabelecimento</CardTitle>
          <CardDescription>Essas informações serão exibidas para seus clientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LogoUpload 
            currentLogoUrl={tenant?.logoUrl || tenant?.logo_url}
            onUpload={uploadLogo}
            onDeleteNew={deleteLogo}
            onNewLogoSelect={handleNewLogoSelect}
          />
          
          <BasicInfoForm 
            tenant={tenant}
            updateTenant={updateTenantLocal}
            formatDocument={formatDocument}
            onValidateDocument={() => tenant?.document && validateDocument(tenant.document)}
            docError={docError}
            docValidating={docValidating}
          />

          <AddressForm 
            tenant={tenant}
            updateTenant={updateTenantLocal}
            onCepChange={fetchCep}
          />

          <ServiceLocationForm 
            tenant={tenant}
            updateTenant={updateTenantLocal}
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6">
          <Button onClick={handleSaveWithValidation} disabled={saving || docValidating}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
