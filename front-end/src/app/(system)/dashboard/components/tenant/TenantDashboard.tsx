"use client";

import { DashboardMetrics } from "../../types/dashboard.types";
import { DashboardHeader } from "../shared/DashboardHeader";
import { TenantStatCards } from "./TenantStatCards";
import { MetricsChart } from "./MetricsChart";
import { MiniAgenda } from "./MiniAgenda";
import { QuickActions } from "./QuickActions";
import { useDashboardMetrics } from "../../hooks/useDashboardMetrics";

interface Props {
  tenantId: string;
  role?: string;
  userName?: string;
  initialMetrics: DashboardMetrics;
}

export function TenantDashboard({ tenantId, role, userName, initialMetrics }: Props) {
  const { dateRange, setDateRange, metrics, isRefreshing } = useDashboardMetrics(tenantId, initialMetrics);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <DashboardHeader
        role={role}
        userName={userName}
        dateRange={dateRange}
        setDateRange={setDateRange}
        isRefreshing={isRefreshing}
      />

      <TenantStatCards metrics={metrics} role={role} />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_290px] gap-5">
        <div className="space-y-5">
          <MiniAgenda tenantId={tenantId} />
          <MetricsChart metrics={metrics} role={role} />
        </div>
        <QuickActions pending={metrics.atendimentosPendentes} />
      </div>
    </div>
  );
}
