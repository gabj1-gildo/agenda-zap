"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";

interface CtaSectionProps {
  onScrollToPricing: () => void;
}

export function CtaSection({ onScrollToPricing }: CtaSectionProps) {
  return (
    <section className="w-full py-24 px-6 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        <div className="divider mb-16" />

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="section-label">Comece hoje</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-snug text-foreground">
              Automatize seu atendimento e escale sem aumentar a equipe.
            </h2>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-md">
              Configuração assistida por nossa equipe de suporte, incluída em todos os planos.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-5">
            <button
              id="final-cta"
              onClick={onScrollToPricing}
              className="btn-primary px-8 py-3.5 text-sm flex items-center gap-2"
            >
              Conhecer planos <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              {[
                "Sem contrato de fidelidade",
                "Cancele quando quiser, sem multa",
                "Suporte de implantação incluso",
              ].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
