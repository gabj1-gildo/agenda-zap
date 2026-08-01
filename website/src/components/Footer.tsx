"use client";

import { Calendar } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-[#0C1222] text-gray-400 py-6 px-6 border-t border-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand block */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold text-sm text-white tracking-tight">
              Agenda<span className="text-emerald-400">Zap</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <span>Um produto</span>
            <a
              href="https://gklsystems.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity flex items-center gap-1.5"
            >
              <img src="/gkl-logo.png" alt="GKL Systems Logo" className="h-4 w-auto object-contain" />
              <span className="text-emerald-400 font-semibold">GKL Systems</span>
            </a>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-6 text-xs">
          <a href="/privacy" className="hover:text-gray-200 transition-colors">Privacidade</a>
          <a href="/terms" className="hover:text-gray-200 transition-colors">Termos de Uso</a>
          <a href="mailto:suporte@agendazap.com.br" className="hover:text-gray-200 transition-colors">Suporte</a>
        </div>

        <p className="text-xs text-gray-600">
          © {year} GKL Systems
        </p>
      </div>
    </footer>
  );
}
