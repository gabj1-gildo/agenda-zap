import { MessageSquare } from "lucide-react";
import { ChatSession } from "../../types/chats.types";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatContextPanel } from "./ChatContextPanel";

interface ChatMainAreaProps {
  session: ChatSession | null;
  tenantId: string;
  token: string;
  isSyncing: boolean;
  onSync: () => void;
  onToggleStatus: () => void;
  isSending: boolean;
  onSendMessage: (message: string) => void;
  onEditName: () => void;
}

export function ChatMainArea({
  session,
  tenantId,
  token,
  isSyncing,
  onSync,
  onToggleStatus,
  isSending,
  onSendMessage,
  onEditName
}: ChatMainAreaProps) {
  if (!session) {
    return (
      <div className="flex-1 bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-sm min-w-0">
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 bg-slate-50/50">
          <MessageSquare className="w-16 h-16 mb-4 text-slate-300" />
          <p>Selecione uma conversa para visualizar o histórico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-4 min-w-0">
      {/* Visualizador do Chat */}
      <div className="flex-1 bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-sm min-w-0">
        <ChatHeader 
          session={session}
          isSyncing={isSyncing}
          onSync={onSync}
          onToggleStatus={onToggleStatus}
        />
        <ChatMessages history={session.history} />
        <ChatInput 
          session={session}
          isSending={isSending}
          onSendMessage={onSendMessage}
        />
      </div>

      {/* Sidebar do Cliente */}
      <ChatContextPanel 
        session={session}
        tenantId={tenantId}
        token={token}
        onEditName={onEditName}
      />
    </div>
  );
}
