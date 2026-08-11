import { getBackendUrl } from "@/lib/api";
import { ClientsClient } from "./ClientsClient";

async function fetchInitialData(tenantId: string, token: string) {
  try {
    const [clientsRes, plansRes] = await Promise.all([
      fetch(getBackendUrl(`/api/dashboard/clients?tenantId=${tenantId}`), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(getBackendUrl(`/api/tenant-plans?tenantId=${tenantId}`), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store", // or force-cache depending on needs
      })
    ]);
    
    const clientsData = await clientsRes.json();
    const plansData = await plansRes.json();
    
    return {
      clients: clientsData.success ? clientsData.data : [],
      plans: plansData.success ? plansData.data : [],
    };
  } catch (error) {
    console.error("Error fetching clients initial data:", error);
    return { clients: [], plans: [] };
  }
}

export async function ClientsContent({ tenantId, token }: { tenantId: string, token: string }) {
  const { clients, plans } = await fetchInitialData(tenantId, token);

  return (
    <ClientsClient 
      tenantId={tenantId}
      token={token}
      initialClients={clients}
      availablePlans={plans}
    />
  );
}
