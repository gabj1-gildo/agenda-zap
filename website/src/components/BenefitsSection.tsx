"use client";

import {
  Bot, CalendarCheck, TrendingUp, Clock,
  ShieldCheck, PhoneForwarded, MessageSquare, Target,
} from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "./FadeIn";

const benefits = [
  {
    icon: Bot,
    title: "IA adaptada ao seu negócio",
    description: "O assistente aprende seus serviços, preços, horários e o tom de comunicação da sua marca.",
    featured: true,
  },
  {
    icon: CalendarCheck,
    title: "Agendamento automatizado",
    description: "Clientes agendam, reagendam e cancelam de forma autônoma, sem intervenção manual.",
    featured: true,
  },
  {
    icon: PhoneForwarded,
    title: "Confirmações e lembretes",
    description: "Mensagens automáticas de confirmação e lembrete reduzem significativamente as faltas.",
    featured: false,
  },
  {
    icon: TrendingUp,
    title: "Relatórios e métricas",
    description: "Acompanhe faturamento, serviços mais demandados, taxa de ocupação e retenção de clientes.",
    featured: false,
  },
  {
    icon: Clock,
    title: "Atendimento contínuo",
    description: "Agendamentos chegam fora do horário comercial sem custo de pessoal adicional.",
    featured: false,
  },
  {
    icon: ShieldCheck,
    title: "Segurança e conformidade",
    description: "Infraestrutura com criptografia e conformidade com a LGPD.",
    featured: false,
  },
  {
    icon: MessageSquare,
    title: "Transferência para atendente",
    description: "A IA encaminha a conversa para um humano quando necessário, preservando o contexto.",
    featured: false,
  },
  {
    icon: Target,
    title: "Múltiplas filiais",
    description: "Gerencie todas as unidades do negócio em um único painel centralizado.",
    featured: false,
  },
];

const featuredBenefits = benefits.filter((b) => b.featured);
const regularBenefits  = benefits.filter((b) => !b.featured);

export function BenefitsSection() {
  return (
    <section id="beneficios" className="w-full py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="max-w-xl mb-14">
            <p className="section-label">Funcionalidades</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-snug text-foreground">
              Tudo que seu negócio precisa,{" "}
              <span className="text-muted-foreground">em uma plataforma.</span>
            </h2>
          </div>
        </FadeIn>

        {/* Featured cards — large */}
        <StaggerContainer className="grid sm:grid-cols-2 gap-5 mb-5" staggerDelay={0.1}>
          {featuredBenefits.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title}>
              <div className="card-surface p-8 group cursor-default h-full">
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-6 group-hover:bg-primary/12 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-3">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Regular cards — compact grid */}
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {regularBenefits.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title}>
              <div className="card-surface p-6 group cursor-default h-full">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
