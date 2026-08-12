import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { FunilWrapper } from "./components/FunilWrapper";

export const dynamic = "force-dynamic";

export default async function FunilPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session as any)?.tenantId;
  const token = (session?.user as any)?.accessToken;

  if (!tenantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhuma empresa selecionada ou sessão expirada.
      </div>
    );
  }

  return <FunilWrapper tenantId={tenantId} token={token} />;
}
