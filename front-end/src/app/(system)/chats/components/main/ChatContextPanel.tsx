import { useState, useEffect, useRef } from "react";
import { Phone, Pencil, RefreshCw } from "lucide-react";
import { ChatSession } from "../../types/chats.types";
import { ClientTags } from "@/components/ClientTags";
import { getBackendUrl } from "@/lib/api";

interface ChatContextPanelProps {
  session: ChatSession;
  tenantId: string;
  token: string;
  onEditName: () => void;
}

export function ChatContextPanel({ session, tenantId, token, onEditName }: ChatContextPanelProps) {
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const saveNotesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (session) {
      setNotes(session.context?.notes || "");
    }
  }, [session?.id]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    
    // Auto-save logic
    if (saveNotesTimeoutRef.current) {
      clearTimeout(saveNotesTimeoutRef.current);
    }
    
    saveNotesTimeoutRef.current = setTimeout(async () => {
      if (!session) return;
      setIsSavingNotes(true);
      try {
        await fetch(getBackendUrl(`/api/chats/${session.id}/notes`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ notes: newNotes })
        });
      } catch (err) {
        console.error("Erro ao salvar anotações:", err);
      } finally {
        setIsSavingNotes(false);
      }
    }, 1000);
  };

  return (
    <div className="w-72 bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-sm shrink-0">
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-display font-extrabold text-lg flex items-center justify-between">
          Detalhes
          <button onClick={onEditName} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Editar nome">
            <Pencil className="w-4 h-4" />
          </button>
        </h3>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome do Cliente</label>
            <p className="font-semibold">{session.client?.name || (session.client?.whatsappName ? `@${session.client.whatsappName}` : "Desconhecido")}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp</label>
            <p className="flex items-center text-sm"><Phone className="w-3 h-3 mr-1" /> {session.client?.phone}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Etiquetas (Tags)</label>
          <ClientTags 
            clientId={session.client.id}
            tenantId={tenantId}
            token={token}
            initialTags={session.client.clientTags?.map((ct: any) => ct.tag) || []}
          />
        </div>

        {/* Anotações Dinâmicas */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Anotações Exclusivas</label>
            {isSavingNotes && <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />}
          </div>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Escreva anotações sobre este cliente aqui..."
            className="w-full h-32 p-3 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
          <p className="text-[10px] text-muted-foreground">Salvo automaticamente enquanto você digita.</p>
        </div>
      </div>
    </div>
  );
}
