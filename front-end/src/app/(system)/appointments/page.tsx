import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AppointmentsWrapper } from "./components/AppointmentsWrapper";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session as any)?.tenantId;

  if (!token || !tenantId) return <div>Acesso Restrito</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <AppointmentsWrapper tenantId={tenantId} token={token} />
    </div>
  );
}
