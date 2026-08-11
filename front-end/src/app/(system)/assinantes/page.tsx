import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AssinantesWrapper } from "./components/AssinantesWrapper";

export const dynamic = "force-dynamic";

export default async function AssinantesPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhuma empresa selecionada ou sessão expirada.
      </div>
    );
  }

  // Purely structural Server Component. Returns instantly. Data is fetched via SWR on the client.
  return <AssinantesWrapper tenantId={tenantId} />;
}
