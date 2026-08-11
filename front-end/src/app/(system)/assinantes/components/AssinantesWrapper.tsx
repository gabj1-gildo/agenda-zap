"use client";

import { useAssinantes } from "../hooks/useAssinantes";
import { AssinantesHeader } from "./AssinantesHeader";
import { AssinantesList } from "./AssinantesList";

interface AssinantesWrapperProps {
  tenantId: string;
}

export function AssinantesWrapper({ tenantId }: AssinantesWrapperProps) {
  const { plans, isLoading } = useAssinantes(tenantId);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <AssinantesHeader />
      <AssinantesList plans={plans} isLoading={isLoading} />
    </div>
  );
}
