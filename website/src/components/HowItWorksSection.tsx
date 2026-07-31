"use client";

const steps = [
  {
    number: "1",
    title: "Conecte seu número",
    description:
      "Vincule o WhatsApp do seu negócio à plataforma. Nenhum número novo necessário, sem configuração técnica.",
    detail: "Suporte para WhatsApp Business e número pessoal.",
  },
  {
    number: "2",
    title: "Configure serviços e agenda",
    description:
      "Cadastre seus serviços, profissionais, horários disponíveis e regras de cancelamento. A IA aprende as regras do seu negócio.",
    detail: "Importação de agenda existente disponível.",
  },
  {
    number: "3",
    title: "Receba agendamentos automaticamente",
    description:
      "Clientes agendam, reagendam e recebem confirmações sem intervenção manual. A IA gerencia toda a comunicação.",
    detail: "Transferência para atendente humano quando necessário.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="w-full py-24 px-6 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-16">
          <p className="section-label">Implementação</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-snug text-foreground">
            Operacional em 3 etapas.{" "}
            <span className="text-muted-foreground">Sem equipe técnica.</span>
          </h2>
        </div>

        {/* Timeline horizontal (desktop) / vertical (mobile) */}
        <div className="relative">
          {/* Linha conectora (desktop) */}
          <div className="hidden md:flex absolute top-[28px] left-[calc(50%/3)] right-[calc(50%/3)] items-center pointer-events-none" style={{ left: '4.5rem', right: '4.5rem' }}>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col">
                {/* Mobile connector */}
                {i < steps.length - 1 && (
                  <div className="md:hidden absolute left-[27px] top-[56px] bottom-[-24px] w-px bg-gradient-to-b from-primary/40 to-transparent" />
                )}

                {/* Step indicator */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20 z-10">
                    <span className="font-display font-bold text-xl text-white">{step.number}</span>
                  </div>
                  {/* Desktop connector line após indicator */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent" />
                  )}
                </div>

                {/* Content card */}
                <div className="card-surface p-6 flex-1">
                  <h3 className="font-semibold text-base text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>
                  <p className="text-xs text-primary/70 font-medium border-t border-border pt-3">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
