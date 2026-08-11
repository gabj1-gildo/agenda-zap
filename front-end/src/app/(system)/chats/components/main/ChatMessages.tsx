import { useEffect, useRef } from "react";
import { User, Bot } from "lucide-react";
import { Message } from "../../types/chats.types";

interface ChatMessagesProps {
  history: Message[];
}

export function ChatMessages({ history }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-slate-50/50">
      {history && history.length > 0 ? (
        history.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[70%] sm:max-w-[80%] rounded-2xl px-4 py-2 shadow-sm break-words ${isUser
                  ? 'bg-white border border-slate-200 rounded-tl-sm text-slate-800'
                  : 'bg-primary/10 text-primary-900 border border-primary/20 rounded-tr-sm'
                  }`}
              >
                <div className="flex items-center mb-1 space-x-1 opacity-60">
                  {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {isUser ? 'Cliente' : (msg.role === 'system' ? 'Você / Bot' : 'Bot')}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Sem histórico de mensagens
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
