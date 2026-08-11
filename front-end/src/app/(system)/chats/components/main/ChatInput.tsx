import { useState } from "react";
import { AlertCircle, Send } from "lucide-react";
import { ChatSession } from "../../types/chats.types";

interface ChatInputProps {
  session: ChatSession;
  isSending: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatInput({ session, isSending, onSendMessage }: ChatInputProps) {
  const [inputText, setInputText] = useState("");

  const handleSendMessage = () => {
    if (!inputText.trim() || isSending) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-white">
      {session.status === 'ACTIVE' && (
        <div className="mb-2 text-xs text-orange-600 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Atenção: A IA está ativa. Se você enviar uma mensagem, o cliente vai receber, mas a IA continuará respondendo. Recomendamos "Assumir Atendimento" primeiro.
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem (Enter para enviar, Shift+Enter para quebrar linha)..."
          className="flex-1 min-h-[44px] max-h-32 p-3 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          rows={1}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isSending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shrink-0 h-[44px]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
