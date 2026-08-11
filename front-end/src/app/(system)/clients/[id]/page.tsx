import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ClientProfileContent } from "./components/ClientProfileContent";
import { ClientProfileSkeleton } from "./components/ClientProfileSkeleton";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session?.user as any)?.tenantId;

  if (!token || !tenantId) return <div>Acesso negado.</div>;

  return (
    <Suspense fallback={<ClientProfileSkeleton />}>
      <ClientProfileContent tenantId={tenantId} token={token} clientId={params.id} />
    </Suspense>
  );
}
