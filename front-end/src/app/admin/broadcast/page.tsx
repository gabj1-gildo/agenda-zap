"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Megaphone, Send } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function AdminBroadcastPage() {
  const { data: session } = useSession();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("ALL");
  const [showConfirm, setShowConfirm] = useState(false);

  const token = (session?.user as any)?.accessToken;

  const executeBroadcast = async () => {
    if (!token) return;
    setSending(true);
    try {
      const res = await fetch(getBackendUrl("/api/admin/broadcast-whatsapp"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message, target })
      });
      
      const json = await res.json();

      if (res.ok && json.success) {
        toast.success(json.message || "Disparo concluÃ­do!");
        setMessage("");
      } else {
        toast.error(json.message || "Erro ao realizar disparo");
      }
    } catch (error) {
      toast.error("Erro de conexÃ£o");
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setShowConfirm(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmar Disparo Global"
        description="Tem certeza que deseja disparar esta mensagem em massa? Esta aÃ§Ã£o enviarÃ¡ a mensagem para a base selecionada e consumirÃ¡ recursos da API."
        onConfirm={executeBroadcast}
        confirmText="Disparar"
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-blue-500" />
          Disparo Global (Broadcast)
        </h1>
        <p className="text-muted-foreground mt-1">Envie mensagens via WhatsApp para as empresas e usuÃ¡rios da plataforma utilizando a instÃ¢ncia padrÃ£o.</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Nova Mensagem
          </h2>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleBroadcast} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">PÃºblico Alvo</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="ALL">Todos (Empresas e FuncionÃ¡rios)</option>
                <option value="TENANTS">Apenas Empresas (Tenants)</option>
                <option value="USERS">Apenas FuncionÃ¡rios/UsuÃ¡rios</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Mensagem</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="OlÃ¡! Temos novidades no AgendaZap..."
                required
                rows={6}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none resize-y"
              />
              <p className="text-xs text-muted-foreground">O WhatsApp enviarÃ¡ a mensagem exatamente como formatada aqui.</p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? "Disparando..." : "Disparar Mensagem"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
