import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { fetchAdminMetrics, fetchDashboardMetrics, fetchTenants } from "./actions/dashboard.actions";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { TenantDashboard } from "./components/tenant/TenantDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return null; // ou redirecionar
  }

  const role = (session.user as any)?.role;
  const activeTenantId = (session as any)?.tenantId;
  const userName = (session.user as any)?.name;
  const token = (session.user as any)?.accessToken;

  // Se for Admin do tenant, atendente, ou Superadmin visualizando um tenant
  if (role === "ADMIN" || role === "ATTENDANT" || (role === "SUPERADMIN" && activeTenantId)) {
    
    // Removendo o fetch do lado do servidor para não bloquear a transição de rota (Router).
    // O SWR no lado do cliente (TenantDashboard -> useDashboardMetrics) buscará isso imediatamente.

    const defaultMetrics = {
      faturamento: 0, appointmentsCount: 0, atendimentosPagos: 0, atendimentosPendentes: 0,
      atendimentosCancelados: 0, novosClientes: 0, tokensUsados: 0, ticketMedio: 0, taxaConversao: 0,
      conversasAtivas: 0, chartData: [], kanbanClients: []
    };

    return (
      <TenantDashboard 
        tenantId={activeTenantId}
        role={role}
        userName={userName}
        initialMetrics={defaultMetrics} // Usa os zeros iniciais, SWR faz a primeira busca sem travar a rota
      />
    );
  }

  // Visão nativa do SUPERADMIN (sem tenant selecionado)
  // Também evitamos bloquear com fetch lento aqui.
  const tenants = await fetchTenants(); // Assumindo que essa chamada é super rápida, mas idealmente seria Client-Side
  let adminMetrics = null;
  // if (!activeTenantId) {
  //   adminMetrics = await fetchAdminMetrics();
  // }

  return (
    <AdminDashboard 
      initialTenants={tenants}
      initialMetrics={adminMetrics}
      token={token}
      activeTenantId={activeTenantId}
    />
  );
}
