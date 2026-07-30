import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { PaletteProvider } from "@/components/PaletteProvider";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgendaZap Painel Administrativo",
  description: "Painel de controle inteligente para gerenciar agendamentos, clientes e pagamentos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex bg-background transition-colors duration-300">
        <AuthProvider>
          <PaletteProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <Sidebar />
              <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                  {children}
                </main>
              </div>
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </PaletteProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
