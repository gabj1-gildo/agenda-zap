import { LeadCard, StageKey, Stage } from "../types/funil";
import { Sparkles } from "lucide-react";

function initials(name?: string) {
  const clean = (name || '').replace(/[().]/g, '').trim();
  if (!clean) return '•';
  const parts = clean.split(' ').filter(Boolean);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

interface FunilCardProps {
  card: LeadCard;
  stageKey: StageKey;
  stage: Stage;
  onDragStart: (id: string, from: StageKey, e: React.DragEvent) => void;
  onClick: () => void;
}

export function FunilCard({ card, stageKey, stage, onDragStart, onClick }: FunilCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(card.id, stageKey, e)}
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-3.5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all relative group"
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3 min-w-0">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: stage.light, color: stage.color === '#ffffff' ? '#000' : '#000' }}
          >
            {initials(card.name)}
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-[13px] font-bold text-foreground truncate max-w-[120px]">{card.name || 'Sem Nome'}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{card.phone}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {timeAgo(card.updatedAt)}
          </span>
          {stageKey === 'ia' && (
            <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5"/> IA
            </span>
          )}
        </div>
      </div>

      {card.status === 'online' && (
        <div className="flex items-center gap-1.5 mt-3 border-t border-border/40 pt-2">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span>
          <span className="text-[11px] text-green-600 font-medium">Online</span>
        </div>
      )}
    </div>
  );
}
