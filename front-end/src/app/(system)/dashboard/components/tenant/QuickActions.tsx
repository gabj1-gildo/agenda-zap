"use client";

import Link from "next/link";
import { Plus, MessageSquare, Megaphone, FileText } from "lucide-react";

interface Props {
  pending: number;
}

const quickItems = [
  { href: "/calendar", label: "Novo contato", icon: Plus },
  { href: "/chats", label: "Abrir conversas", icon: MessageSquare },
  { href: "/broadcast", label: "Enviar campanha", icon: Megaphone },
  { href: "/reports", label: "Ver relatório", icon: FileText },
];

export function QuickActions({ pending }: Props) {
  return (
    <aside className="space-y-5">
      <section className="bg-card border rounded-xl p-4 shadow-sm" style={{ borderColor: "var(--line)" }}>
        <h2 className="section-title">Acesso rápido</h2>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {quickItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="min-h-[62px] rounded-lg border px-3 py-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted/50"
              style={{ borderColor: "var(--line)" }}
            >
              <Icon className="w-4 h-4 mb-1.5" style={{ color: "var(--sage)" }} />
              <span className="block">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {pending > 0 && (
        <section
          className="bg-card border rounded-xl p-4 shadow-sm border-l-[3px]"
          style={{ borderColor: "var(--line)", borderLeftColor: "var(--yellow)" }}
        >
          <h2 className="section-title">{pending} confirmações pendentes</h2>
          <p className="text-xs mt-1" style={{ color: "var(--muted-text)" }}>
            Envie um lembrete para manter sua agenda organizada.
          </p>
          <Link
            href="/appointments"
            className="inline-block mt-2 text-xs font-bold"
            style={{ color: "var(--sage)" }}
          >
            Ver pendências →
          </Link>
        </section>
      )}
    </aside>
  );
}