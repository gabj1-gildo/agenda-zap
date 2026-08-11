import { MessageSquare, AlertTriangle } from "lucide-react";
import { ChatSession } from "../../types/chats.types";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatContextPanel } from "./ChatContextPanel";
import { Button } from "@/components/ui/button";

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
  isDisconnected?: boolean;
  isCheckingConnection?: boolean;
  onConnect?: () => void;
  onCheckConnection?: () => void;
  userRole?: string;
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
  onEditName,
  isDisconnected,
  isCheckingConnection,
  onConnect,
  onCheckConnection,
  userRole
}: ChatMainAreaProps) {

  const disconnectedBanner = !isCheckingConnection && isDisconnected && (
    <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-lg flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="w-5 h-5" />
        <span>Seu WhatsApp não está conectado. Conecte para poder enviar mensagens e atualizar as conversas.</span>
      </div>
      {userRole !== "ATTENDANT" && onConnect && (
        <Button size="sm" variant="destructive" onClick={onConnect} className="shrink-0">
          Conectar Agora
        </Button>
      )}
    </div>
  );

  if (!session) {
    return (
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {disconnectedBanner}
        <div className="flex-1 bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-sm min-w-0">
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 bg-slate-50/50">
            <MessageSquare className="w-16 h-16 mb-4 text-slate-300" />
            <p>Selecione uma conversa para visualizar o histórico</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 min-w-0">
      {disconnectedBanner}
      <div className="flex-1 flex gap-4 min-w-0 min-h-0">
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
            isDisconnected={isDisconnected}
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
    </div>
  );
}
