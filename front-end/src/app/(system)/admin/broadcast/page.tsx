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
        toast.success(json.message || "Disparo concluído!");
        setMessage("");
      } else {
        toast.error(json.message || "Erro ao realizar disparo");
      }
    } catch (error) {
      toast.error("Erro de conexão");
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
        description="Tem certeza que deseja disparar esta mensagem em massa? Esta ação enviará a mensagem para a base selecionada e consumirá recursos da API."
        onConfirm={executeBroadcast}
        confirmText="Disparar"
      />



      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Nova Mensagem
          </h2>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleBroadcast} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Público Alvo</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="ALL">Todos (Empresas e Funcionários)</option>
                <option value="TENANTS">Apenas Empresas (Tenants)</option>
                <option value="USERS">Apenas Funcionários/Usuários</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Mensagem</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Olá! Temos novidades no AgendaZap..."
                required
                rows={6}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none resize-y"
              />
              <p className="text-xs text-muted-foreground">O WhatsApp enviará a mensagem exatamente como formatada aqui.</p>
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
