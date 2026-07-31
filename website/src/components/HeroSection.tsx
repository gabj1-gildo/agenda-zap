"use client";

import { ArrowRight, Play, Users, Clock, Star, Wifi, Battery, Signal, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import { FadeIn } from "./FadeIn";
import { motion } from "framer-motion";

interface HeroSectionProps {
  onScrollToPricing: () => void;
}

const stats = [
  { icon: Users, value: "500+",  label: "negócios ativos" },
  { icon: Clock, value: "24/7",  label: "atendimento automático" },
  { icon: Star,  value: "98%",   label: "satisfação dos clientes" },
];

/* WhatsApp chat: sistema = direita, cliente = esquerda */
const chatMessages: {
  from: "client" | "bot";
  text?: string;
  type?: "card" | "confirmation";
  title?: string;
  subtitle?: string;
  delay: number;
}[] = [
  { from: "client", text: "Olá! Gostaria de agendar um horário para amanhã", delay: 0 },
  { from: "bot",    text: "Claro! Qual serviço você deseja?", delay: 0.2 },
  { from: "bot",    type: "card", title: "Corte de cabelo", subtitle: "30min • R$ 45,00", delay: 0.35 },
  { from: "client", text: "Perfeito! Tem horário sexta às 15h?", delay: 0.5 },
  { from: "bot",    text: "Sim, pode ser!", delay: 0.65 },
  { from: "bot",    type: "confirmation", title: "Agendamento confirmado!", subtitle: "Corte de cabelo\nSexta-feira, 15h00\nR$ 45,00", delay: 0.8 },
];

/* Dashboard mini-data */
const dashboardMetrics = [
  { label: "Agendamentos hoje", value: "24", trend: "+12%" },
  { label: "Taxa de ocupação", value: "87%", trend: "+5%" },
  { label: "Receita do mês", value: "R$ 12.450", trend: "+23%" },
];

const dashboardAppointments = [
  { time: "09:00", client: "Maria S.", service: "Corte + Escova", status: "confirmed" },
  { time: "10:30", client: "João P.", service: "Barba", status: "confirmed" },
  { time: "14:00", client: "Ana L.", service: "Coloração", status: "pending" },
  { time: "15:00", client: "Carlos R.", service: "Corte", status: "confirmed" },
];

export function HeroSection({ onScrollToPricing }: HeroSectionProps) {
  return (
    <section className="relative w-full min-h-[94vh] flex items-center px-6 py-20 overflow-hidden hero-grid">
      {/* Decorative glows */}
      <div className="glow-emerald w-[500px] h-[400px] top-[10%] -left-[100px] opacity-60" />
      <div className="glow-amber w-[300px] h-[300px] bottom-[15%] right-[10%] opacity-40" />
      <div className="glow-emerald w-[200px] h-[200px] top-[50%] left-[45%] opacity-25" />

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-center">
        {/* ═══ LEFT — Copy ═══ */}
        <div className="flex flex-col">
          <FadeIn delay={0}>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary font-semibold text-xs mb-8 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Automatize seu atendimento no WhatsApp
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-[3.25rem] lg:text-[3.75rem] tracking-tight leading-[1.08] text-foreground">
              Agendamentos{" "}
              <br className="hidden sm:block" />
              automáticos.{" "}
              <br className="hidden sm:block" />
              Clientes felizes.{" "}
              <br className="hidden sm:block" />
              <span className="gradient-text">Negócios que crescem.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
              O AgendaZap atende, agenda e confirma pelo WhatsApp 24h por dia, todos os dias.
              Reduza faltas em até <strong className="text-foreground">70%</strong> e aumente seu faturamento sem contratar mais ninguém.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                id="hero-cta"
                onClick={onScrollToPricing}
                className="btn-primary px-7 py-3.5 text-sm flex items-center gap-2"
              >
                Começar agora <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })
                }
                className="btn-secondary px-6 py-3.5 text-sm flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                Ver como funciona
              </button>
            </div>
          </FadeIn>

          {/* Stats bar */}
          <FadeIn delay={0.4}>
            <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-8">
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl text-foreground leading-none">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* ═══ RIGHT — Devices Showcase ═══ */}
        <div className="relative hidden lg:block min-h-[580px]">
          {/* ── Luminous orbs ── */}
          <motion.div
            className="absolute w-[140px] h-[140px] rounded-full bg-primary/20 blur-[50px]"
            style={{ top: "8%", right: "15%" }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[100px] h-[100px] rounded-full bg-accent/20 blur-[40px]"
            style={{ bottom: "15%", left: "5%" }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute w-[80px] h-[80px] rounded-full bg-primary/15 blur-[35px]"
            style={{ top: "45%", left: "0%" }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          {/* Small solid orbs */}
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-primary/40"
            style={{ top: "12%", left: "10%" }}
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-accent/50"
            style={{ top: "75%", right: "5%" }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
          <motion.div
            className="absolute w-2.5 h-2.5 rounded-full bg-primary/30"
            style={{ bottom: "30%", right: "35%" }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />

          {/* ── Monitor / Dashboard ── */}
          <FadeIn delay={0.35} direction="right">
            <div className="absolute top-0 left-0 right-8 z-0">
              {/* Monitor frame */}
              <div className="bg-[#1A1A2E] dark:bg-[#0A0A14] rounded-xl p-[6px] shadow-2xl" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                {/* Screen */}
                <div className="bg-card rounded-lg overflow-hidden">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/80 border-b border-border">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                    </div>
                    <div className="flex-1 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-background/80 rounded-md px-3 py-1 text-[9px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-primary/40" />
                        app.agendazap.com.br/dashboard
                      </div>
                    </div>
                  </div>

                  {/* Dashboard content */}
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                          <Calendar className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <span className="font-display font-bold text-xs text-foreground">AgendaZap</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">Hoje, Sex 01 Ago</span>
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                      {dashboardMetrics.map((m) => (
                        <div key={m.label} className="bg-muted/50 rounded-lg p-2.5 border border-border/50">
                          <p className="text-[8px] text-muted-foreground mb-1">{m.label}</p>
                          <div className="flex items-end gap-1.5">
                            <p className="font-display font-bold text-sm text-foreground leading-none">{m.value}</p>
                            <span className="text-[8px] font-semibold text-emerald-500 mb-0.5">{m.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Appointments table */}
                    <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-border/50">
                        <p className="text-[9px] font-semibold text-foreground">Próximos agendamentos</p>
                      </div>
                      <div className="divide-y divide-border/30">
                        {dashboardAppointments.map((apt, i) => (
                          <div key={i} className="flex items-center gap-3 px-3 py-2">
                            <span className="text-[9px] font-mono text-muted-foreground w-8">{apt.time}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-medium text-foreground truncate">{apt.client}</p>
                              <p className="text-[8px] text-muted-foreground truncate">{apt.service}</p>
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${apt.status === "confirmed" ? "bg-emerald-500" : "bg-amber-400"}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Monitor stand */}
                <div className="flex justify-center mt-1">
                  <div className="w-16 h-1 rounded-full bg-[#2A2A3E]" />
                </div>
              </div>
              {/* Monitor base */}
              <div className="flex justify-center">
                <div className="w-20 h-3 bg-[#1A1A2E] dark:bg-[#0A0A14] rounded-b-lg" style={{ clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)" }} />
              </div>
            </div>
          </FadeIn>

          {/* ── Phone (floating + tilted) ── */}
          <motion.div
            className="absolute bottom-0 right-0 z-10"
            initial={{ opacity: 0, y: 40, rotateY: -8, rotateX: 5 }}
            whileInView={{ opacity: 1, y: 0, rotateY: -8, rotateX: 5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d", transform: "rotateY(-6deg) rotateX(3deg)" }}
            >
              {/* Phone frame */}
              <div className="w-[260px] rounded-[40px] bg-[#1A1A2E] dark:bg-[#0A0A14] p-[8px] shadow-2xl" style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset" }}>
                {/* Side buttons */}
                <div className="absolute -left-[2.5px] top-[90px] w-[2.5px] h-[22px] rounded-l-sm bg-[#2A2A3E]" />
                <div className="absolute -left-[2.5px] top-[130px] w-[2.5px] h-[40px] rounded-l-sm bg-[#2A2A3E]" />
                <div className="absolute -left-[2.5px] top-[180px] w-[2.5px] h-[40px] rounded-l-sm bg-[#2A2A3E]" />
                <div className="absolute -right-[2.5px] top-[120px] w-[2.5px] h-[55px] rounded-r-sm bg-[#2A2A3E]" />

                {/* Screen */}
                <div className="relative rounded-[32px] overflow-hidden bg-card">
                  {/* Status bar + WhatsApp header */}
                  <div className="relative bg-primary px-4 pt-2.5 pb-0">
                    {/* Dynamic Island */}
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-[#1A1A2E] dark:bg-[#0A0A14] rounded-full flex items-center justify-center z-20">
                      <div className="w-[7px] h-[7px] rounded-full bg-[#2A2A3E] ml-5" />
                    </div>
                    {/* Status bar info */}
                    <div className="flex items-center justify-between text-[8px] text-white/50 font-medium px-0.5 mb-2.5">
                      <span>9:41</span>
                      <div className="flex items-center gap-0.5">
                        <Signal className="w-2 h-2" />
                        <Wifi className="w-2 h-2" />
                        <Battery className="w-2.5 h-2" />
                      </div>
                    </div>
                    {/* WhatsApp header */}
                    <div className="flex items-center gap-2.5 pb-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                        <span className="text-white font-bold text-[9px]">AZ</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-[12px] leading-tight">AgendaZap</p>
                        <p className="text-white/50 text-[9px]">online agora</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat area — bot (sistema) = direita, cliente = esquerda */}
                  <div className="px-2.5 py-2.5 space-y-2 min-h-[310px]" style={{ background: "var(--muted)" }}>
                    {chatMessages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: msg.delay + 0.8, ease: "easeOut" }}
                        className={`flex ${msg.from === "bot" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.type === "card" ? (
                          <div className="bg-primary/8 border border-primary/15 rounded-2xl rounded-tr-md px-3 py-2.5 max-w-[82%] shadow-sm">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <div className="w-5 h-5 rounded bg-primary/15 flex items-center justify-center">
                                <span className="text-primary text-[7px] font-bold">✂</span>
                              </div>
                              <p className="text-[10px] font-semibold text-card-foreground">{msg.title}</p>
                            </div>
                            <p className="text-[9px] text-muted-foreground">{msg.subtitle}</p>
                          </div>
                        ) : msg.type === "confirmation" ? (
                          <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-md px-3 py-2.5 max-w-[82%]">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-[9px]">✅</span>
                              <p className="text-[10px] font-bold text-primary">{msg.title}</p>
                            </div>
                            {msg.subtitle?.split("\n").map((line, j) => (
                              <p key={j} className="text-[9px] text-foreground/70 leading-relaxed">{line}</p>
                            ))}
                          </div>
                        ) : (
                          <div
                            className={`max-w-[82%] px-2.5 py-2 text-[11px] leading-relaxed shadow-sm ${
                              msg.from === "bot"
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                                : "bg-card text-card-foreground rounded-2xl rounded-tl-md border border-border"
                            }`}
                          >
                            {msg.text}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Input bar */}
                  <div className="bg-card px-2.5 py-2 border-t border-border flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full px-3 py-1.5 text-[9px] text-muted-foreground">
                      Escreva uma mensagem...
                    </div>
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <ArrowRight className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center py-1.5 bg-card">
                    <div className="w-[80px] h-[3px] rounded-full bg-muted-foreground/20" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
