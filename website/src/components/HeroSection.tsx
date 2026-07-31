"use client";

import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onScrollToPricing: () => void;
}

export function HeroSection({ onScrollToPricing }: HeroSectionProps) {
  return (
    <section className="relative w-full min-h-[88vh] flex flex-col items-center justify-center text-center px-6 py-28 overflow-hidden hero-grid">
      {/* Glow sutil */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/6 rounded-full blur-[120px] pointer-events-none" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary font-medium text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        Inteligência Artificial para gestão de agendamentos
      </div>

      {/* Headline */}
      <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-[3.5rem] lg:text-[4rem] tracking-tight max-w-4xl leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 text-foreground">
        Automatize o atendimento e os agendamentos do seu negócio{" "}
        <span className="gradient-text">via WhatsApp.</span>
      </h1>

      {/* Subtítulo */}
      <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        IA que agenda, confirma e lembra seus clientes — 24 horas por dia, sem contratar mais pessoas e sem trocar de número.
      </p>

      {/* CTAs */}
      <div className="mt-9 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
        <button
          id="hero-cta"
          onClick={onScrollToPricing}
          className="btn-primary px-7 py-3 text-sm flex items-center gap-2"
        >
          Ver planos e preços <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
          className="px-7 py-3 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors hover:border-primary/30 bg-white"
        >
          Como funciona?
        </button>
      </div>
    </section>
  );
}
