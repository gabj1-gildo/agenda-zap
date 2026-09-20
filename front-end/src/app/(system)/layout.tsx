import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/swr-config";


export default function SystemLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <SWRConfig value={swrConfig}>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </SWRConfig>
    </AuthProvider>
  );
}
