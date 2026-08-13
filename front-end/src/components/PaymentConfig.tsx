"use client";

import { useState, useEffect } from "react";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { Clock, CreditCard } from "lucide-react";

export function PaymentConfig({ tenantId, token }: { tenantId: string; token?: string }) {
  const [pixTime, setPixTime] = useState("");
  const [cardTime, setCardTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(getBackendUrl('/api/payments/config'), {
          headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) }
        });
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.pixExpirationTime) setPixTime(json.data.pixExpirationTime);
          if (json.data.cardExpirationTime) setCardTime(json.data.cardExpirationTime);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações de pagamento", err);
      } finally {
        setFetching(false);
      }
    }
    if (tenantId) loadConfig();
  }, [tenantId]);

  const handleSave = async () => {
    if (!pixTime && !cardTime) return;
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl('/api/payments/config'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ 
          pixExpirationTime: pixTime,
          cardExpirationTime: cardTime 
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Tempo de expiração atualizado com sucesso!");
      } else {
        toast.error(json.error || "Erro ao atualizar");
      }
    } catch (err) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return null;

  return (
    <div className="flex flex-col gap-4 bg-card border rounded-2xl p-6" style={{ borderColor: "var(--border)" }}>
      <div className="mt-4">
        <h3 className="font-semibold text-lg mb-1">Tempo de Expiração</h3>
        <p className="text-sm text-muted-foreground">Configure quanto tempo o link de pagamento ou PIX ficarão válidos após serem gerados pela IA.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PIX */}
        <div className="flex items-center justify-between p-4 border rounded-xl" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Tempo PIX</div>
              <div className="text-xs text-muted-foreground">Ex: 00:30 (meia hora)</div>
            </div>
          </div>
          <input 
            type="text"
            value={pixTime}
            onChange={e => setPixTime(e.target.value)}
            placeholder="00:30"
            className="h-10 w-24 rounded-lg border px-3 text-sm text-center outline-none focus:ring-2 focus:ring-foreground/20"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
          />
        </div>

        {/* Card Link */}
        <div className="flex items-center justify-between p-4 border rounded-xl" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/10 text-green-500">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Tempo Cartão</div>
              <div className="text-xs text-muted-foreground">Ex: 24:00 (1 dia)</div>
            </div>
          </div>
          <input 
            type="text"
            value={cardTime}
            onChange={e => setCardTime(e.target.value)}
            placeholder="24:00"
            className="h-10 w-24 rounded-lg border px-3 text-sm text-center outline-none focus:ring-2 focus:ring-foreground/20"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
          />
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <button 
          onClick={handleSave}
          disabled={loading || (!pixTime && !cardTime)}
          className="h-10 px-6 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          {loading ? "Salvando..." : "Salvar Prazos"}
        </button>
      </div>
    </div>
  );
}
