"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { FadeIn } from "./FadeIn";

interface CtaSectionProps {
  onScrollToPricing: () => void;
}

export function CtaSection({ onScrollToPricing }: CtaSectionProps) {
  return (
    <section className="w-full py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="cta-gradient relative rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20">
          {/* Decorative circles */}
          <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute top-[50%] right-[20%] w-[80px] h-[80px] rounded-full bg-white/3 pointer-events-none" />

          <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
            <FadeIn>
              <div>
                <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-snug text-white">
                  Automatize seu atendimento e escale sem aumentar a equipe.
                </h2>
                <p className="mt-5 text-sm text-white/70 leading-relaxed max-w-md">
                  Configuração assistida por nossa equipe de suporte, incluída em todos os planos.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="flex flex-col items-start md:items-end gap-5">
                <button
                  id="final-cta"
                  onClick={onScrollToPricing}
                  className="px-8 py-4 bg-white text-emerald-700 dark:text-emerald-800 font-bold text-sm rounded-xl flex items-center gap-2 hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Conhecer planos <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex flex-col gap-2.5 text-xs text-white/60">
                  {[
                    "Sem contrato de fidelidade",
                    "Cancele quando quiser, sem multa",
                    "Suporte de implantação incluso",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-white/50 shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
