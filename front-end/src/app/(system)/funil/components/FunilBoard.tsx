import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Stage } from "../types/funil";

interface FunilBoardProps {
  boardRef: React.RefObject<HTMLDivElement | null>;
  totalCards: number;
  stages: Stage[];
  children: React.ReactNode;
  onScroll: (dir: 'left' | 'right') => void;
}

export function FunilBoard({ boardRef, totalCards, stages, children, onScroll }: FunilBoardProps) {
  return (
    <>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-[14px_16px_12px] mb-[18px] transition-colors duration-250">
        <div className="flex items-center justify-between mb-[10px]">
          <span className="text-[10.5px] tracking-[1px] uppercase text-[var(--muted-foreground)] font-semibold">Distribuição do funil</span>
          <span className="font-mono-custom text-[11.5px] text-[var(--muted-foreground)]"><b className="text-[var(--text)] font-medium">{totalCards}</b> leads no total</span>
        </div>
        <div className="relative flex h-[8px] rounded-full overflow-hidden bg-[var(--surface-3)]">
          {stages.map(s => {
            const flexGrow = 1; // Simplificado temporariamente, ou passar via props
            return (
              <div 
                key={s.key} 
                className="relative overflow-hidden transition-[flex-grow] duration-500 min-w-[3px] border-r-[2px] border-r-[var(--surface)] last:border-r-0 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-[rgba(255,255,255,.35)] after:to-transparent after:w-[40%] after:animate-funil-shimmer" 
                style={{ background: s.color, flexGrow: 1 }} 
              />
            );
          })}
        </div>
        <div className="flex gap-[16px] mt-[11px] flex-wrap">
          {stages.map(s => (
            <div key={s.key} className="flex items-center gap-[6px] text-[11.5px] text-[var(--muted-foreground)]">
              <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: s.color }} />
              {s.title}
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <button onClick={() => onScroll('left')} className="absolute top-1/2 -translate-y-1/2 w-[40px] h-[40px] rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-[var(--text)] cursor-pointer z-10 transition-all duration-200 hover:bg-[var(--surface-2)] hover:scale-105 active:scale-95 hidden md:flex left-[-20px]">
          <ChevronLeft />
        </button>
        <button onClick={() => onScroll('right')} className="absolute top-1/2 -translate-y-1/2 w-[40px] h-[40px] rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-[var(--text)] cursor-pointer z-10 transition-all duration-200 hover:bg-[var(--surface-2)] hover:scale-105 active:scale-95 hidden md:flex right-[-20px]">
          <ChevronRight />
        </button>
        <div 
          ref={boardRef} 
          className="flex items-start overflow-x-auto pb-[10px] mx-[-6px] mb-[22px] scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
