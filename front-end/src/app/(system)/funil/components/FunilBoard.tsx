import { useRef, useState } from "react";
import { Board, STAGES, StageKey, DBStage } from "../types/funil";
import { FunilColumn } from "./FunilColumn";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FunilBoardProps {
  board: Board;
  showCompleted: boolean;
  onMoveLead: (draggedId: string, from: StageKey, to: StageKey, toDbKey: DBStage) => void;
  onClickCard: (id: string) => void;
}

export function FunilBoard({ board, showCompleted, onMoveLead, onClickCard }: FunilBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<StageKey | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<StageKey | null>(null);
  
  // By default all expanded except maybe if we had localstorage, but we'll use a simple state
  const [expandedColumns, setExpandedColumns] = useState<Record<StageKey, boolean>>({
    espera: true, ia: true, humano: true, pagamento: true, finalizado: true, perdido: true
  });

  const scrollBoard = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
  };

  const toggleExpand = (stageKey: StageKey) => {
    setExpandedColumns(prev => ({ ...prev, [stageKey]: !prev[stageKey] }));
  };

  const handleDragStart = (id: string, from: StageKey, e: React.DragEvent) => {
    setDraggedId(id);
    setDraggedFrom(from);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.target instanceof HTMLElement) e.target.classList.add('opacity-50'); }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) e.target.classList.remove('opacity-50');
    setDraggedId(null);
    setDraggedFrom(null);
    setHoveredColumn(null);
  };

  const handleDragOver = (stageKey: StageKey, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedFrom && draggedFrom !== stageKey) {
      setHoveredColumn(stageKey);
    }
  };

  const handleDrop = (stageKey: StageKey, e: React.DragEvent) => {
    e.preventDefault();
    setHoveredColumn(null);
    if (!draggedId || !draggedFrom || draggedFrom === stageKey) return;

    const stage = STAGES.find(s => s.key === stageKey)!;
    onMoveLead(draggedId, draggedFrom, stageKey, stage.dbKey);
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-background/50 rounded-2xl border border-border p-4 h-[calc(100vh-220px)]" onDragEnd={handleDragEnd}>
      
      {/* Scroll Controls */}
      <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 hidden md:block">
        <button onClick={() => scrollBoard('left')} className="w-10 h-10 rounded-full bg-card border shadow-lg flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>
      <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 hidden md:block">
        <button onClick={() => scrollBoard('right')} className="w-10 h-10 rounded-full bg-card border shadow-lg flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Board Columns */}
      <div 
        ref={scrollRef}
        className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2"
      >
        {STAGES.map(stage => (
          <FunilColumn 
            key={stage.key}
            stage={stage}
            cards={board[stage.key] || []}
            isHovered={hoveredColumn === stage.key}
            isExpanded={expandedColumns[stage.key]}
            showCompleted={showCompleted}
            onToggleExpand={toggleExpand}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClickCard={onClickCard}
          />
        ))}
      </div>
    </div>
  );
}
