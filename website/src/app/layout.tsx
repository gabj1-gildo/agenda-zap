import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgendaZap — Automatize Agendamentos com IA no WhatsApp",
  description:
    "Atenda clientes 24h por dia com Inteligência Artificial, automatize agendamentos e escale suas vendas sem contratar mais pessoas. Experimente grátis.",
  keywords: "agendamento whatsapp, IA atendimento, bot agendamento, automação whatsapp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${syne.variable} antialiased`}>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
