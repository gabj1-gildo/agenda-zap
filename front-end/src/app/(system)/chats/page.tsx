import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ChatLayout } from "./components/ChatLayout";

export default async function ChatsPage() {
  const session = await getServerSession(authOptions);
  
  const tenantId = (session?.user as any)?.tenantId;
  const token = (session?.user as any)?.accessToken;

  if (!token || !tenantId) return <div>Acesso negado.</div>;

  return <ChatLayout tenantId={tenantId} token={token} />;
}