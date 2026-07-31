"use client";

import { Smartphone, Settings, Zap } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "./FadeIn";

const steps = [
  {
    icon: Smartphone,
    number: "1",
    title: "Conecte seu número",
    description:
      "Vincule o WhatsApp do seu negócio à plataforma. Nenhum número novo necessário, sem configuração técnica.",
    detail: "Suporte para WhatsApp Business e número pessoal.",
  },
  {
    icon: Settings,
    number: "2",
    title: "Configure serviços e agenda",
    description:
      "Cadastre seus serviços, profissionais, horários disponíveis e regras de cancelamento. A IA aprende as regras do seu negócio.",
    detail: "Importação de agenda existente disponível.",
  },
  {
    icon: Zap,
    number: "3",
    title: "Receba agendamentos automaticamente",
    description:
      "Clientes agendam, reagendam e recebem confirmações sem intervenção manual. A IA gerencia toda a comunicação.",
    detail: "Transferência para atendente humano quando necessário.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="w-full py-24 px-6 bg-muted/40">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="max-w-xl mb-16">
            <p className="section-label">Como funciona na prática</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-snug text-foreground">
              Operacional em 3 etapas.{" "}
              <span className="text-muted-foreground">Sem equipe técnica.</span>
            </h2>
          </div>
        </FadeIn>

        {/* Icons row with continuous connecting line */}
        <FadeIn delay={0.1}>
          <div className="hidden md:flex items-center justify-between mb-8 px-4 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.number} className="flex items-center flex-1 last:flex-none">
                {/* Icon circle */}
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg z-10 relative" style={{ boxShadow: "0 4px 20px var(--glow-primary)" }}>
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                {/* Connector line — only between icons, not after the last */}
                {i < steps.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 bg-gradient-to-r from-primary/60 via-primary/30 to-primary/60 rounded-full" />
                )}
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Cards grid */}
        <StaggerContainer className="grid md:grid-cols-3 gap-6" staggerDelay={0.15}>
          {steps.map((step, i) => (
            <StaggerItem key={step.number}>
              <div className="relative flex flex-col h-full">
                {/* Mobile: icon + connector */}
                <div className="flex items-center gap-4 mb-5 md:hidden">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg z-10" style={{ boxShadow: "0 4px 20px var(--glow-primary)" }}>
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-primary/40 to-transparent rounded-full" />
                  )}
                </div>

                {/* Mobile vertical connector */}
                {i < steps.length - 1 && (
                  <div className="md:hidden absolute left-[27px] top-[56px] bottom-[-16px] w-0.5 bg-gradient-to-b from-primary/30 to-transparent rounded-full" />
                )}

                {/* Content card */}
                <div className="card-surface p-6 flex-1 border-l-2 border-l-primary/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-md">
                      ETAPA {step.number}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-base text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>
                  <p className="text-xs text-primary/80 font-medium border-t border-border pt-3">
                    {step.detail}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
