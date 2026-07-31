"use client";

const pains = [
  {
    icon: "01",
    title: "Atendimento fora do horário",
    description:
      "Clientes enviam mensagens à noite e nos fins de semana. Sem resposta imediata, a venda não se concretiza.",
  },
  {
    icon: "02",
    title: "Agenda desorganizada",
    description:
      "Agendamentos simultâneos em papel, WhatsApp pessoal e caderno geram conflitos de horário e experiência ruim.",
  },
  {
    icon: "03",
    title: "Alta taxa de faltas",
    description:
      "Sem lembretes automáticos, uma parcela relevante dos horários agendados resulta em no-shows — receita perdida diretamente.",
  },
  {
    icon: "04",
    title: "Falta de visibilidade do negócio",
    description:
      "Sem relatórios, não é possível saber quais serviços performam melhor nem quais horários são mais rentáveis.",
  },
];

export function PainSection() {
  return (
    <section id="dor" className="w-full py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-14">
          <p className="section-label">Os desafios do setor</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-foreground leading-snug">
            Negócios de serviço perdem receita todos os dias por falta de automação.
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            O atendimento manual limita o crescimento. Cada mensagem sem resposta, agendamento perdido ou falta não confirmada representa custo direto para o negócio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {pains.map((pain) => (
            <div key={pain.title} className="card-surface p-7 group">
              <p className="font-display font-bold text-5xl text-primary/10 mb-4 leading-none select-none">
                {pain.icon}
              </p>
              <h3 className="font-semibold text-sm text-foreground mb-2">{pain.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{pain.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground max-w-2xl">
            O AgendaZap resolve cada um desses pontos com uma plataforma unificada de atendimento e agendamento via IA.{" "}
            <span className="text-foreground font-medium">Configure uma vez e o sistema opera de forma autônoma.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
