import React from "react";
import { Zap } from "lucide-react";
import { LeadCard, StageKey } from "../types/funil";

function initials(name?: string) {
  const clean = (name || '').replace(/[().]/g, '').trim();
  if (!clean) return '•';
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

interface FunilCardProps {
  item: LeadCard;
  stageKey: StageKey;
  stageDbKey: string;
  onDragStart: (id: string, from: StageKey, e: React.DragEvent) => void;
}

export function FunilCard({ item, stageKey, stageDbKey, onDragStart }: FunilCardProps) {
  return (
    <div
      draggable
      onClick={() => window.location.href = `/chats?clientId=${item.id}`}
      onDragStart={(e) => {
        e.currentTarget.classList.add('opacity-35');
        document.body.classList.add('dragging-card');
        onDragStart(item.id, stageKey, e);
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('opacity-35');
        document.body.classList.remove('dragging-card');
      }}
      className="bg-[var(--surface-2)] border-[1px] border-[var(--border-soft)] rounded-[11px] p-[11px_12px] cursor-grab active:cursor-grabbing animate-funil-cardIn transition-all duration-150 hover:-translate-y-[2px] hover:border-[var(--border)] hover:bg-[var(--surface-3)] hover:shadow-[var(--shadow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--seg)] focus-visible:outline-offset-2"
    >
      <div className="flex items-start gap-[9px]">
        <div className="w-[30px] h-[30px] rounded-[9px] shrink-0 flex items-center justify-center font-display font-semibold text-[11.5px] text-[var(--avatar-text)] bg-gradient-to-br from-[var(--seg)] to-[var(--seg-light)]">
          {initials(item.name || item.phone)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
            {item.name || 'Sem nome'}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] font-mono-custom mt-[1px] whitespace-nowrap overflow-hidden text-ellipsis">
            {item.phone}
          </div>
        </div>
        {stageDbKey === 'atendimento_ia' && (
          <span className="flex items-center gap-[3px] text-[9px] font-bold tracking-[.3px] text-[var(--seg)] bg-[var(--seg-soft)] p-[2px_6px_2px_5px] rounded-full shrink-0 uppercase ml-[6px]">
            <Zap className="w-[8px] h-[8px]" fill="currentColor" />IA
          </span>
        )}
        <span className="text-[10.5px] text-[var(--muted-foreground)] shrink-0 whitespace-nowrap ml-[6px]">
          {timeAgo(item.updatedAt)}
        </span>
      </div>

      {stageDbKey === 'atendimento_ia' && item.status === 'online' && (
        <div className="flex items-center justify-between mt-[8px] gap-[8px]">
          <span className="flex items-center gap-[6px] text-[11px] text-[#22c55e] font-medium">
            <span className="w-[6px] h-[6px] rounded-full bg-[#22c55e] relative shrink-0 before:content-[''] before:absolute before:inset-[-3px] before:rounded-full before:border-[1.5px] before:border-[#22c55e] before:animate-funil-ringPulse"></span>
            Online
          </span>
        </div>
      )}
    </div>
  );
}
