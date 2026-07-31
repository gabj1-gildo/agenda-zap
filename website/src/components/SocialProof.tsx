"use client";

export function SocialProof() {
  const logos = [
    "Barbearia Pro",
    "Clínica Estética",
    "Studio Fitness",
    "Pet Shop VIP",
    "Salão Belle",
    "Consultório Dr. Alves",
    "Academia Pulse",
    "Dermato Center",
  ];

  return (
    <section className="w-full py-8 border-y border-border overflow-hidden bg-muted/50">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-6">
        Confiado por mais de 500 negócios em todo o Brasil
      </p>
      <div className="relative flex overflow-x-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10" style={{ background: "linear-gradient(to right, var(--background), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10" style={{ background: "linear-gradient(to left, var(--background), transparent)" }} />

        <div className="flex gap-6 items-center animate-[marquee_28s_linear_infinite] whitespace-nowrap">
          {[...logos, ...logos].map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground/70 hover:text-muted-foreground hover:border-primary/20 transition-colors select-none shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
