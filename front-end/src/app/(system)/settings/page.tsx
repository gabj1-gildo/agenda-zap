import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SettingsClient } from "./components/SettingsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: { tenant?: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const token = (session?.user as any)?.accessToken;
  const role = (session?.user as any)?.role;
  const isSuperAdmin = role === "SUPERADMIN";
  const tenantId = searchParams?.tenant || (session as any)?.tenantId;

  if (!token) return <div>Acesso Restrito</div>;

  return <SettingsClient targetTenantId={tenantId} isSuperAdmin={isSuperAdmin} />;
}
