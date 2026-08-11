import { useState } from "react";
import { Plus, Search, Filter, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChatSession } from "../../types/chats.types";
import { ChatSessionItem } from "./ChatSessionItem";

interface ChatSidebarProps {
  sessions: ChatSession[];
  isLoading: boolean;
  selectedSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ sessions, isLoading, selectedSessionId, onSelectSession, onNewChat }: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredSessions = sessions.filter(session => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      session.client.name?.toLowerCase().includes(term) ||
      session.client.phone.includes(term) ||
      session.history?.some(msg => msg.content.toLowerCase().includes(term))
    );

    let matchesRead = true;
    if (readFilter === "unread") {
      matchesRead = session.hasUnread === true;
    }

    return matchesSearch && matchesRead;
  });

  const unreadCount = sessions.filter(s => s.hasUnread).length;

  return (
    <div className="w-80 min-w-[320px] bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-sm shrink-0">
      <div className="p-4 border-b border-border bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-foreground">
              Conversas
            </h2>
            <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-widest">
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onNewChat}
            title="Nova Conversa"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 relative">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar cliente..."
                className="pl-9 h-9 border-muted bg-background/50 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              title="Filtros"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-colors shrink-0 ${
                showFilterMenu ? 'bg-muted border-muted' : 'border-muted hover:bg-muted/50'
              }`}
            >
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>

            {showFilterMenu && (
              <div className="absolute top-11 right-0 w-56 bg-card border border-muted rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground">Filtrar por</div>
                <div className="flex flex-col">
                  <button className="px-3 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors flex justify-between items-center">
                    <span>👥 Atendentes</span>
                    <span className="text-muted-foreground text-xs">{'>'}</span>
                  </button>
                  <button className="px-3 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors flex justify-between items-center">
                    <span>🏷️ Tags</span>
                    <span className="text-muted-foreground text-xs">{'>'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setReadFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                readFilter === 'all' 
                  ? 'bg-blue-600/10 text-blue-500 border border-blue-500/30' 
                  : 'border border-muted text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setReadFilter('unread')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                readFilter === 'unread' 
                  ? 'bg-blue-600/10 text-blue-500 border border-blue-500/30' 
                  : 'border border-muted text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Não lidas
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && sessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex justify-center items-center h-full">
            Carregando...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
            Nenhuma conversa encontrada
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredSessions.map((session) => (
              <ChatSessionItem 
                key={session.id} 
                session={session} 
                isSelected={selectedSessionId === session.id}
                onSelect={onSelectSession} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
