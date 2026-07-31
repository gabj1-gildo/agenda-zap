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
    <section className="w-full py-10 border-y border-border overflow-hidden bg-[#0A0B16]">
      <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-8">
        Confiado por mais de 500 negócios em todo o Brasil
      </p>
      <div className="relative flex overflow-x-hidden">
        <div className="flex gap-16 items-center animate-[marquee_22s_linear_infinite] whitespace-nowrap">
          {[...logos, ...logos].map((name, i) => (
            <span
              key={i}
              className="text-sm font-medium text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors select-none shrink-0"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
