"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FadeIn } from "./FadeIn";

const faqs = [
  {
    question: "Preciso trocar meu número do WhatsApp?",
    answer:
      "Não. Você conecta o número que já utiliza no negócio. O AgendaZap funciona como uma camada inteligente sobre o WhatsApp — seus clientes continuam falando no mesmo número que já conhecem.",
  },
  {
    question: "E se meu cliente quiser falar com um atendente?",
    answer:
      "A IA identifica quando a situação exige atendimento humano e transfere a conversa para sua equipe, mantendo todo o contexto da interação.",
  },
  {
    question: "Para quais tipos de negócio o AgendaZap é indicado?",
    answer:
      "Qualquer negócio baseado em agendamentos: clínicas, salões, barbearias, academias, studios, consultórios, pet shops e similares.",
  },
  {
    question: "Quanto tempo leva para entrar em operação?",
    answer:
      "A configuração inicial é concluída em minutos. Nossa equipe de suporte oferece auxílio na implantação sem custo adicional.",
  },
  {
    question: "Como funciona o cancelamento?",
    answer:
      "Você pode cancelar a qualquer momento, sem multa ou fidelidade contratual. O cancelamento é feito diretamente pelo painel.",
  },
  {
    question: "O que acontece se o limite de chats for atingido?",
    answer:
      "Você será notificado antes de atingir o limite e poderá adquirir créditos adicionais ou fazer upgrade de plano sem interrupção do serviço.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-6 group"
      >
        <span className={`text-sm font-medium transition-colors duration-200 ${open ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
          {question}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${open ? "bg-primary/10 rotate-180" : "bg-muted"}`}>
          <ChevronDown className={`w-4 h-4 transition-colors ${open ? "text-primary" : "text-muted-foreground"}`} />
        </div>
      </button>
      <div className={`faq-answer ${open ? "open" : ""}`}>
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed pb-5 pr-12">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="w-full py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-[1fr_1.8fr] gap-16 items-start">
          <FadeIn>
            <div className="md:sticky md:top-28">
              <p className="section-label">FAQ</p>
              <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-snug text-foreground">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Não encontrou o que procura?{" "}
                <a href="mailto:suporte@agendazap.com.br" className="text-primary font-semibold hover:underline underline-offset-2">
                  Fale com nosso time.
                </a>
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="card-surface p-1 sm:p-2">
              <div className="px-5 sm:px-6">
                {faqs.map((faq) => <FaqItem key={faq.question} {...faq} />)}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
