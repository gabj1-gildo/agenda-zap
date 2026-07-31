"use client";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border bg-white py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand block */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-white text-xs leading-none">A</span>
              </div>
              <span className="font-display font-semibold text-sm text-foreground">AgendaZap</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Um produto{" "}
              <a
                href="https://gklsystems.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
              >
                GKL Systems
              </a>
              .
            </p>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="/terms"   className="hover:text-foreground transition-colors">Termos de Uso</a>
            <a href="mailto:suporte@agendazap.com.br" className="hover:text-foreground transition-colors">Suporte</a>
          </div>

          <p className="text-xs text-muted-foreground">
            © {year} GKL Systems. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
