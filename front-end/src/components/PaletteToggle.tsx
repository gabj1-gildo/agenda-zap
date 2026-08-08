"use client";

import * as React from "react";
import { Palette, Check } from "lucide-react";
import { usePalette } from "@/components/PaletteProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const palettes = [
  { id: "default", name: "Padrão",   emoji: "🌟", primary: "#14213D", accent: "#FFB400", bg: "#F6F4EF" },
  { id: "productivity", name: "Produtividade", emoji: "⚡", primary: "#059669", accent: "#4F46E5", bg: "#F8FAFC" },
  { id: "sistema", name: "Sistema",  emoji: "✨", primary: "#8b5cf6", accent: "#f5a524", bg: "#eef1f7" },
  { id: "teal",    name: "Teal",     emoji: "🌿", primary: "#0F6E56", accent: "#378ADD", bg: "#F1EFE8" },
  { id: "blue",    name: "Azul",     emoji: "🌊", primary: "#185FA5", accent: "#534AB7", bg: "#F0F2F5" },
  { id: "purple",  name: "Roxo",     emoji: "🔮", primary: "#534AB7", accent: "#D4537E", bg: "#F2F0F5" },
  { id: "coral",   name: "Coral",    emoji: "🔥", primary: "#D85A30", accent: "#0F6E56", bg: "#F5F0ED" },
] as const;

export function PaletteToggle() {
  const { palette, setPalette } = usePalette();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-all duration-200 focus:outline-none group"
        title="Paleta de Cores"
      >
        <Palette className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="px-2 py-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Paleta de Cores
        </div>
        <div className="mt-1 space-y-0.5">
          {palettes.map((p) => {
            const isActive = palette === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPalette(p.id as any)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {/* Color preview circles */}
                <div className="flex items-center -space-x-1.5 flex-shrink-0">
                  <span
                    className="w-4 h-4 rounded-full border-2 border-card shadow-sm"
                    style={{ backgroundColor: p.primary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border-2 border-card shadow-sm"
                    style={{ backgroundColor: p.accent }}
                  />
                </div>
                <span className="flex-1 text-left">{p.emoji} {p.name}</span>
                {isActive && (
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
