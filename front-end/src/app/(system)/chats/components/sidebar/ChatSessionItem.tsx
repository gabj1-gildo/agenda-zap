import { Phone } from "lucide-react";
import { ChatSession } from "../../types/chats.types";

interface ChatSessionItemProps {
  session: ChatSession;
  isSelected: boolean;
  onSelect: (session: ChatSession) => void;
}

const getFunnelBadgeColor = (stage?: string) => {
  switch (stage?.toUpperCase()) {
    case 'LEAD': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ATENDIMENTO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'AGENDADO': return 'bg-green-100 text-green-800 border-green-200';
    case 'CONCLUÍDO': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const getStatusColor = (status?: string) => {
  return status?.toUpperCase() === 'INATIVO' ? 'bg-rose-500' : 'bg-emerald-500';
};

export function ChatSessionItem({ session, isSelected, onSelect }: ChatSessionItemProps) {
  return (
    <button
      onClick={() => onSelect(session)}
      className={`w-full text-left p-4 hover:bg-accent transition-colors focus:outline-none ${
        isSelected ? "bg-accent border-l-4 border-primary" : "border-l-4 border-transparent"
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2 truncate pr-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(session.client?.status)}`} />
          <span className={`font-medium truncate ${session.hasUnread ? 'text-blue-500 font-bold' : ''}`}>
            {session.client?.name || (session.client?.whatsappName ? `@${session.client.whatsappName}` : "Desconhecido")}
          </span>
          {session.hasUnread && (
            <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
          {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="text-sm flex items-center justify-between mt-1">
        <div className="text-muted-foreground flex items-center">
          <Phone className="w-3 h-3 mr-1" />
          {session.client?.phone}
        </div>
        <div className="flex gap-1">
          {session.client?.funnelStage && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getFunnelBadgeColor(session.client.funnelStage)}`}>
              {session.client.funnelStage.toUpperCase()}
            </span>
          )}
          {session.status === 'HUMAN' && (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
              HUMANO
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
