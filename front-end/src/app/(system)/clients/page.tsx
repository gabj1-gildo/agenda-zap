import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ClientsContent } from "./components/ClientsContent";
import { ClientsSkeleton } from "./components/ClientsSkeleton";

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

  // The Header is removed from here because the ClientsClient already contains its own header for the layout to look good.
  // Wait, if ClientsClient contains the header ("Clientes" and "Novo Cliente"), then the skeleton must NOT have it,
  // OR the skeleton DOES have it, and it just gets replaced.
  // Actually, the skeleton doesn't have the "Clientes" header, let me check `ClientsClient`.
  // `ClientsClient` has the "Clientes" h1 inside it!
  // It's better to move the header out to `ClientsPage` so it renders instantly, or just keep it in `ClientsClient`.
  // Wait, if it's in `ClientsClient` which is INSIDE `<Suspense>`, then the header won't be visible until data loads!
  // Let me just wrap the `ClientsContent` in Suspense.
  return (
    <div className="max-w-7xl mx-auto">
      {/* We can place the Suspsense boundary directly. The skeleton handles the fake layout. */}
      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsContent tenantId={tenantId} token={token} />
      </Suspense>
    </div>
  );
}
