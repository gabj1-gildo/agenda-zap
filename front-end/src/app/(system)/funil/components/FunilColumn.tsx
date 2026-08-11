import { Stage, LeadCard, StageKey } from "../types/funil";
import { FunilCard } from "./FunilCard";

interface FunilColumnProps {
  stage: Stage;
  cards: LeadCard[];
  isHovered: boolean;
  isExpanded: boolean;
  onDragOver: (stageKey: StageKey, e: React.DragEvent) => void;
  onDrop: (stageKey: StageKey, e: React.DragEvent) => void;
  onDragStart: (id: string, from: StageKey, e: React.DragEvent) => void;
  onClickCard: (id: string) => void;
  onToggleExpand: (stageKey: StageKey) => void;
  showCompleted: boolean;
}

export function FunilColumn({ 
  stage, cards, isHovered, isExpanded, 
  onDragOver, onDrop, onDragStart, onClickCard, onToggleExpand, showCompleted 
}: FunilColumnProps) {
  
  if (['finalizado', 'perdido'].includes(stage.key) && !showCompleted) {
    return null;
  }

  // Se não estiver expandido, renderizar apenas o header girado e a contagem.
  // Mas por simplicidade no Kanban web, muitas vezes colunas apenas recolhem.
  // Vamos implementar um visual simplificado se não expandido.
  if (!isExpanded) {
    return (
      <div 
        className="flex flex-col w-[60px] h-full shrink-0 bg-muted/30 border border-border rounded-2xl items-center py-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onToggleExpand(stage.key)}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: stage.light, color: stage.color }}>
          {cards.length}
        </div>
        <div className="mt-4 writing-vertical-rl rotate-180 text-sm font-semibold whitespace-nowrap text-muted-foreground">
          {stage.title}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col w-[320px] shrink-0 h-full max-h-full rounded-2xl border transition-colors ${isHovered ? 'bg-muted/50 border-violet-500/50' : 'bg-muted/20 border-border'}`}
      onDragOver={(e) => onDragOver(stage.key, e)}
      onDrop={(e) => onDrop(stage.key, e)}
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between border-b border-border/50 bg-card rounded-t-2xl cursor-pointer"
        onClick={() => onToggleExpand(stage.key)}
      >
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ background: stage.color, boxShadow: `0 0 10px rgba(${stage.rgb}, 0.5)` }}></div>
          <div>
            <h3 className="font-bold text-sm text-foreground">{stage.title}</h3>
            <p className="text-[10px] text-muted-foreground leading-tight">{stage.sub}</p>
          </div>
        </div>
        <div className="bg-muted px-2 py-1 rounded-md text-xs font-bold text-muted-foreground">
          {cards.length}
        </div>
      </div>

      {/* Cards Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[150px]">
        {cards.map(card => (
          <FunilCard 
            key={card.id} 
            card={card} 
            stageKey={stage.key} 
            onDragStart={onDragStart} 
            onClick={() => onClickCard(card.id)} 
          />
        ))}
        {cards.length === 0 && (
          <div className="h-24 border-2 border-dashed border-border/60 rounded-xl flex items-center justify-center text-xs text-muted-foreground/60">
            Arraste um lead para cá
          </div>
        )}
      </div>
    </div>
  );
}
