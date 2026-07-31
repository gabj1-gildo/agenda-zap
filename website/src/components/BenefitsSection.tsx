"use client";

import {
  Bot, CalendarCheck, TrendingUp, Clock,
  ShieldCheck, PhoneForwarded, MessageSquare, Target,
} from "lucide-react";

const benefits = [
  {
    icon: Bot,
    title: "IA adaptada ao seu negócio",
    description: "O assistente aprende seus serviços, preços, horários e o tom de comunicação da sua marca.",
  },
  {
    icon: CalendarCheck,
    title: "Agendamento automatizado",
    description: "Clientes agendam, reagendam e cancelam de forma autônoma, sem intervenção manual.",
  },
  {
    icon: PhoneForwarded,
    title: "Confirmações e lembretes",
    description: "Mensagens automáticas de confirmação e lembrete reduzem significativamente as faltas.",
  },
  {
    icon: TrendingUp,
    title: "Relatórios e métricas",
    description: "Acompanhe faturamento, serviços mais demandados, taxa de ocupação e retenção de clientes.",
  },
  {
    icon: Clock,
    title: "Atendimento contínuo",
    description: "Agendamentos chegam fora do horário comercial sem custo de pessoal adicional.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança e conformidade",
    description: "Infraestrutura com criptografia e conformidade com a LGPD.",
  },
  {
    icon: MessageSquare,
    title: "Transferência para atendente",
    description: "A IA encaminha a conversa para um humano quando necessário, preservando o contexto.",
  },
  {
    icon: Target,
    title: "Múltiplas filiais",
    description: "Gerencie todas as unidades do negócio em um único painel centralizado.",
  },
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="w-full py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-14">
          <p className="section-label">Funcionalidades</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-snug text-foreground">
            Tudo que seu negócio precisa,{" "}
            <span className="text-muted-foreground">em uma plataforma.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card-surface p-6 group cursor-default">
              <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mb-5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-2">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
