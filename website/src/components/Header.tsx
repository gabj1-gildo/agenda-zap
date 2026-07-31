"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  loginUrl: string;
}

const NAV_LINKS = [
  { label: "Problema",      id: "dor" },
  { label: "Como Funciona", id: "como-funciona" },
  { label: "Benefícios",    id: "beneficios" },
  { label: "Planos",        id: "planos" },
  { label: "FAQ",           id: "faq" },
];

export function Header({ loginUrl }: HeaderProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId]     = useState<string>("");

  /* Scroll blur */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Active section via IntersectionObserver */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        {
          rootMargin: "-30% 0px -60% 0px",
          threshold: 0,
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="font-display font-bold text-white text-sm leading-none">A</span>
          </div>
          <span className="font-display font-semibold text-base text-foreground hidden sm:block tracking-tight">
            AgendaZap
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ id, label }) => {
            const isActive = activeId === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a
            href={loginUrl}
            className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Entrar
          </a>
          <button
            onClick={() => scrollTo("planos")}
            className="btn-primary px-4 py-2 text-sm"
          >
            Ver planos
          </button>
          <button
            className="md:hidden text-muted-foreground hover:text-foreground ml-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-border px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`text-sm text-left px-3 py-2 rounded-md font-medium transition-colors ${
                activeId === id
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
          <a
            href={loginUrl}
            className="text-sm px-3 py-2 text-muted-foreground hover:text-foreground"
          >
            Entrar
          </a>
        </div>
      )}
    </header>
  );
}
