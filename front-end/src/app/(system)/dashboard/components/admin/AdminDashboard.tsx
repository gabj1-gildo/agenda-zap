"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminMetrics, Tenant } from "../../types/dashboard.types";
import { CreateTenantModal } from "./CreateTenantModal";
import { AdminStatCards } from "./AdminStatCards";
import { AdminTokensChart } from "./AdminTokensChart";
import { TenantsTable } from "./TenantsTable";

interface Props {
  initialTenants: Tenant[];
  initialMetrics: AdminMetrics | null;
  token?: string;
  activeTenantId?: string;
}

export function AdminDashboard({ initialTenants, initialMetrics, token, activeTenantId }: Props) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {showModal && (
        <CreateTenantModal
          onClose={() => setShowModal(false)}
          onCreated={(t) => setTenants((prev) => [t, ...prev])}
          token={token}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Administrador da Plataforma
          </p>
          <h1 className="font-display font-extrabold text-4xl text-foreground">Painel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todas as empresas cadastradas na plataforma.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {!activeTenantId && (
        <div
          style={{ borderColor: "var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" }}
          className="border rounded-2xl p-4 flex items-center gap-3"
        >
          <span style={{ color: "var(--warning)" }} className="text-sm font-semibold">
            ⚠ Selecione uma empresa no topo para habilitar Agenda, Conversas e Pagamentos.
          </span>
        </div>
      )}

      <AdminStatCards tenants={tenants} adminMetrics={initialMetrics} />

      <AdminTokensChart adminMetrics={initialMetrics} />

      <TenantsTable 
        tenants={tenants} 
        activeTenantId={activeTenantId} 
        onShowModal={() => setShowModal(true)} 
      />
    </div>
  );
}
