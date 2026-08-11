import { LeadCard, StageKey } from "../types/funil";

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
  onDragStart: (id: string, from: StageKey, e: React.DragEvent) => void;
  onClick: () => void;
}

export function FunilCard({ card, stageKey, onDragStart, onClick }: FunilCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(card.id, stageKey, e)}
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all active:scale-[0.98] relative"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 relative">
          {initials(card.name)}
          {card.status === 'online' && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full"></span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{card.name || 'Sem Nome'}</p>
          <p className="text-xs text-muted-foreground truncate">{card.phone}</p>
        </div>
      </div>
      
      {card.updatedAt && (
        <div className="flex justify-end mt-3 border-t border-border/50 pt-2">
          <span className="text-[10px] text-muted-foreground/70 font-mono-custom tracking-wider">
            {timeAgo(card.updatedAt)}
          </span>
        </div>
      )}
    </div>
  );
}
