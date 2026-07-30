import { AuthProvider } from "@/components/AuthProvider";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="w-full flex-1">
        {children}
      </div>
    </AuthProvider>
  );
}
