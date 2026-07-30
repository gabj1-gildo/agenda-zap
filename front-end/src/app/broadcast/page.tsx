"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Megaphone, Send, Smartphone } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TenantPhoneModal } from "@/components/TenantPhoneModal";
import { Button } from "@/components/ui/button";

export default function BroadcastPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("ALL_CLIENTS");
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const tenantId = (session as any)?.tenantId;

  const loadTenant = async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(getBackendUrl('/api/settings/tenant'), { 
        headers: { 
          'tenant-id': tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        } 
      });
      const data = await res.json();
      if (data.success) setTenant(data.data);
    } catch (err) {
      toast.error("Erro ao carregar dados da empresa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, [tenantId]);

  const executeBroadcast = async () => {
    setSending(true);
    try {
      const res = await fetch(getBackendUrl("/api/broadcast"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "tenant-id": tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message, target })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Disparo concluído!");
        setMessage("");
      } else {
        toast.error(json.error || json.message || "Erro ao realizar disparo");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      toast.error("Nenhuma empresa selecionada.");
      return;
    }
    setShowConfirm(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmar Disparo"
        description="Tem certeza que deseja disparar esta mensagem em massa para todos os seus clientes? Esta ação não pode ser desfeita e consumirá os recursos de disparo do seu WhatsApp."
        onConfirm={executeBroadcast}
        confirmText="Disparar"
      />

      {showPhoneModal && (
        <TenantPhoneModal 
          tenantId={tenantId} 
          onClose={() => {
            setShowPhoneModal(false);
            loadTenant();
          }} 
        />
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-blue-500" />
          Disparos em Massa
        </h1>
        <p className="text-muted-foreground mt-1">Envie mensagens via WhatsApp para os clientes da sua empresa.</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Nova Mensagem
          </h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : tenant?.evolutionInstanceStatus !== "OPEN" ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-2">
                <Smartphone className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">WhatsApp Desconectado</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Para enviar mensagens em massa, é necessário que o WhatsApp do seu estabelecimento esteja pareado com o sistema.
              </p>
              <Button onClick={() => setShowPhoneModal(true)} className="mt-4">
                Conectar WhatsApp Agora
              </Button>
            </div>
          ) : (
            <form onSubmit={handleBroadcast} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Público Alvo</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="ALL_CLIENTS">Todos os Clientes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Mensagem</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Olá! Temos novidades..."
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
                  {sending ? "Preparando..." : "Disparar Mensagem"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
