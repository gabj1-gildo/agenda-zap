"use client";

import { Clock, CalendarX, UserX, BarChart3 } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "./FadeIn";

const pains = [
  {
    icon: Clock,
    color: "text-red-500",
    bg: "bg-red-500/8",
    title: "Atendimento fora do horário",
    description:
      "Clientes enviam mensagens à noite e nos fins de semana. Sem resposta imediata, a venda não se concretiza.",
  },
  {
    icon: CalendarX,
    color: "text-amber-500",
    bg: "bg-amber-500/8",
    title: "Agenda desorganizada",
    description:
      "Agendamentos simultâneos em papel, WhatsApp pessoal e caderno geram conflitos de horário e experiência ruim.",
  },
  {
    icon: UserX,
    color: "text-orange-500",
    bg: "bg-orange-500/8",
    title: "Alta taxa de faltas",
    description:
      "Sem lembretes automáticos, uma parcela relevante dos horários agendados resulta em no-shows — receita perdida diretamente.",
  },
  {
    icon: BarChart3,
    color: "text-rose-500",
    bg: "bg-rose-500/8",
    title: "Falta de visibilidade do negócio",
    description:
      "Sem relatórios, não é possível saber quais serviços performam melhor nem quais horários são mais rentáveis.",
  },
];

export function PainSection() {
  return (
    <section id="dor" className="w-full py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="max-w-xl mb-14">
            <p className="section-label">Os desafios do setor</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-foreground leading-snug">
              Negócios de serviço perdem receita todos os dias{" "}
              <span className="text-muted-foreground">por falta de automação.</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-lg">
              O atendimento manual limita o crescimento. Cada mensagem sem resposta, agendamento perdido ou falta não confirmada representa custo direto para o negócio.
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid sm:grid-cols-2 gap-5" staggerDelay={0.1}>
          {pains.map((pain, i) => (
            <StaggerItem key={pain.title}>
              <div className="card-surface p-7 group h-full">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${pain.bg} flex items-center justify-center shrink-0`}>
                    <pain.icon className={`w-5 h-5 ${pain.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-md">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-semibold text-sm text-foreground">{pain.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pain.description}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.4}>
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground max-w-2xl">
              O AgendaZap resolve cada um desses pontos com uma plataforma unificada de atendimento e agendamento via IA.{" "}
              <span className="text-primary font-semibold">Configure uma vez e o sistema opera de forma autônoma.</span>
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
