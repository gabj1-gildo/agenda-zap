import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ClientsWrapper } from "./components/ClientsWrapper";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session as any)?.tenantId;

  if (!token || !tenantId) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">
          Faça login para acessar os clientes.
        </p>
      </div>
    );
  }

  // Purely structural Server Component. Returns instantly. Data is fetched via SWR on the client.
  return (
    <div className="max-w-7xl mx-auto">
      <ClientsWrapper tenantId={tenantId} token={token} />
    </div>
  );
}
