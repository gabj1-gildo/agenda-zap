import { Phone, RefreshCw, Pause, Play } from "lucide-react";
import { ChatSession } from "../../types/chats.types";

interface ChatHeaderProps {
  session: ChatSession;
  isSyncing: boolean;
  onSync: () => void;
  onToggleStatus: () => void;
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

export function ChatHeader({ session, isSyncing, onSync, onToggleStatus }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
      <div className="overflow-hidden min-w-0 flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full shrink-0 ${getStatusColor(session.client?.status)}`} title={`Status: ${session.client?.status || 'Ativo'}`} />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate flex items-center gap-2">
              {session.client?.name || (session.client?.whatsappName ? `@${session.client.whatsappName}` : "Desconhecido")}
            </h3>
            {session.client?.funnelStage && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getFunnelBadgeColor(session.client.funnelStage)}`}>
                {session.client.funnelStage.toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground flex items-center mt-1">
            <Phone className="w-3 h-3 mr-1 shrink-0" />
            <span className="truncate">{session.client?.phone}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSync}
          disabled={isSyncing}
          title="Sincronizar mensagens da Evolution API"
          className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
        </button>

        <button
          onClick={onToggleStatus}
          className={`px-4 py-2 rounded-md font-medium text-sm flex items-center transition-colors ${
            session.status === 'ACTIVE'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {session.status === 'ACTIVE' ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Assumir Atendimento
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Devolver para IA
            </>
          )}
        </button>
      </div>
    </div>
  );
}
