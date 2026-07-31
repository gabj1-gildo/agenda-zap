"use client";

import { Calendar } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-[#0C1222] text-gray-400 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent mb-10" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand block */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-base text-white tracking-tight">
                Agenda<span className="text-emerald-400">Zap</span>
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Um produto{" "}
              <a
                href="https://gklsystems.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 font-semibold hover:underline underline-offset-2"
              >
                GKL Systems
              </a>
              .
            </p>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6 text-xs">
            <a href="/privacy" className="hover:text-gray-200 transition-colors">Privacidade</a>
            <a href="/terms"   className="hover:text-gray-200 transition-colors">Termos de Uso</a>
            <a href="mailto:suporte@agendazap.com.br" className="hover:text-gray-200 transition-colors">Suporte</a>
          </div>

          <p className="text-xs text-gray-600">
            © {year} GKL Systems. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
