import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ClientProfileWrapper } from "./components/ClientProfileWrapper";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session?.user as any)?.tenantId;

  if (!token || !tenantId) return <div>Acesso negado.</div>;

  return (
    <ClientProfileWrapper tenantId={tenantId} token={token} clientId={params.id} />
  );
}
