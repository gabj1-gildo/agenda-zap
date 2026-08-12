import React from "react";
import { StageKey, Stage } from "../types/funil";
import { CheckCircle2 } from "lucide-react";

interface FunilColumnProps {
  stage: Stage;
  isDragOver: boolean;
  isExpanded: boolean;
  onDragOver: (stageKey: StageKey, e: React.DragEvent) => void;
  onDragLeave: (stageKey: StageKey, e: React.DragEvent) => void;
  onDrop: (stageKey: StageKey, e: React.DragEvent) => void;
  children: React.ReactNode;
  count: number;
  showCompletedCards: boolean;
}

export function FunilColumn({
  stage,
  isDragOver,
  isExpanded,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
  count,
  showCompletedCards
}: FunilColumnProps) {
  return (
    <div
      onDragOver={(e) => onDragOver(stage.key, e)}
      onDragLeave={(e) => onDragLeave(stage.key, e)}
      onDrop={(e) => onDrop(stage.key, e)}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[15px] w-[262px] shrink-0 min-h-[200px] flex flex-col mx-[6px] overflow-hidden transition-all duration-150 ${
        isDragOver ? "shadow-[0_0_0_1px_var(--seg-line),_0_0_26px_-6px_var(--seg-line)]" : ""
      }`}
      style={{
        '--seg': stage.color,
        '--seg-light': stage.light,
        '--seg-soft': `rgba(${stage.rgb}, 0.08)`,
        '--seg-line': `rgba(${stage.rgb}, 0.5)`
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between p-[12px_13px] border-t-[3px] border-t-[var(--seg)] bg-[var(--seg-soft)]">
        <div className="min-w-0">
          <div className="flex items-center gap-[7px]">
            <span className="font-display font-bold text-[11.5px] tracking-[.3px] whitespace-nowrap overflow-hidden text-ellipsis">
              {stage.title}
            </span>
          </div>
          <div className="text-[10.5px] text-[var(--muted-foreground)] mt-[3px]">
            {stage.sub}
          </div>
        </div>
        <div className={`font-mono-custom text-[11px] font-semibold p-[2px_8px] rounded-full bg-[var(--seg)] text-white min-w-[20px] text-center shrink-0 ml-[8px] ${isDragOver ? 'animate-funil-badgePulse' : ''}`}>
          {count}
        </div>
      </div>

      <div className="flex flex-col gap-[8px] flex-1 min-h-[40px] p-[10px]">
        {count === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-[var(--muted-foreground)] p-[24px_12px] gap-[7px] rounded-[11px] border border-dashed border-[var(--border)] m-[2px]">
            <p className="text-[11.5px] max-w-[140px] leading-[1.4] m-0">
              Nenhum lead nesta etapa ainda
            </p>
          </div>
        ) : stage.key === 'finalizado' && !showCompletedCards ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-[22px_16px] gap-[6px]">
            <div className="w-[56px] h-[56px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,.28),transparent_70%)] flex items-center justify-center relative mb-[6px]">
              <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center shadow-[0_0_22px_-2px_rgba(34,197,94,.6)]">
                <CheckCircle2 className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="absolute text-[#4ade80] opacity-85 animate-funil-sparkle" style={{ top: '-2px', left: '4px', animationDelay: '0s' }}><CheckCircle2 className="w-[10px] h-[10px]" /></span>
              <span className="absolute text-[#4ade80] opacity-85 animate-funil-sparkle" style={{ bottom: '2px', right: '0px', animationDelay: '.7s' }}><CheckCircle2 className="w-[10px] h-[10px]" /></span>
              <span className="absolute text-[#4ade80] opacity-85 animate-funil-sparkle" style={{ top: '14px', right: '-6px', animationDelay: '1.2s' }}><CheckCircle2 className="w-[10px] h-[10px]" /></span>
            </div>
            <h4 className="font-display text-[14.5px] font-bold text-[#22c55e] m-0">+{count} negócios</h4>
            <p className="text-[11.5px] text-[var(--muted-foreground)] leading-[1.4] max-w-[150px] m-0">Ocultos para melhor visualização</p>
          </div>
        ) : (
          children
        )}
      </div>
      
      {stage.key === 'finalizado' && count > 0 && (
        <div className="p-[9px_13px] border-t border-[var(--border-soft)]">
          <button className="flex items-center justify-center gap-[5px] text-[11.5px] font-semibold text-[var(--seg)] bg-transparent border-none w-full cursor-pointer hover:[&>svg]:translate-x-[2px]" onClick={() => {/* handle toggle */}}>
            {showCompletedCards ? 'Ocultar cartões' : 'Ver cartões'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[12px] h-[12px] transition-transform duration-150"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
