"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Palette = "default" | "teal" | "blue" | "purple" | "coral" | "productivity";

interface PaletteContextType {
  palette: Palette;
  setPalette: (p: Palette) => void;
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined);

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>("default");

  useEffect(() => {
    // Carrega a preferência salva ao iniciar
    const saved = localStorage.getItem("agenda-zap-palette") as Palette;
    if (saved) {
      setPaletteState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const setPalette = (p: Palette) => {
    setPaletteState(p);
    localStorage.setItem("agenda-zap-palette", p);
    if (p === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", p);
    }
  };

  return (
    <PaletteContext.Provider value={{ palette, setPalette }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const context = useContext(PaletteContext);
  if (context === undefined) {
    throw new Error("usePalette must be used within a PaletteProvider");
  }
  return context;
}
