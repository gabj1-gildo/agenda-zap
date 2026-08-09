"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, RefreshCw, CheckCircle2 } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { getBackendUrl } from "@/lib/api";
import { useSession } from "next-auth/react";

type Props = {
  tenantId: string;
  onClose: () => void;
  onSuccess?: () => void;
  existingInstanceId?: string;
};

type Step = "phone" | "qr" | "connected";

export function TenantPhoneModal({ tenantId, onClose, onSuccess, existingInstanceId }: Props) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const [step, setStep] = useState<Step>(existingInstanceId ? "qr" : "phone");
  const [phone, setPhone] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [polling, setPolling] = useState(!!existingInstanceId);
  const [status, setStatus] = useState("PENDING_QR");
  const [currentPhoneId, setCurrentPhoneId] = useState<string | null>(existingInstanceId || null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName) return alert("Dê um nome para identificar esta conexão");
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl(`/api/settings/whatsapp`), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "tenant-id": tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ phone, evolutionInstanceName: instanceName }),
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.data.qrCode);
        setCurrentPhoneId(data.data.id);
        setStep("qr");
        setPolling(true);
      } else {
        console.error("Erro da API:", data);
        const detailMsg = data.details?.response?.message || data.details?.message || "";
        const msg = detailMsg 
          ? `${data.error}\n\nDetalhes: ${Array.isArray(detailMsg) ? detailMsg.join(', ') : detailMsg}` 
          : (data.error || "Erro ao criar instância");
        alert(msg);
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const refreshQr = async () => {
    if (!currentPhoneId) return;
    try {
      const res = await fetch(getBackendUrl(`/api/settings/whatsapp/${currentPhoneId}`), {
        headers: {
          "tenant-id": tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.data.qrCode);
        setStatus(data.data.evolutionInstanceStatus);
        if (data.data.evolutionInstanceStatus?.toUpperCase() === "OPEN") {
          setStep("connected");
          setPolling(false);
        }
      }
    } catch {}
  };

  // Poll every 3s while waiting for connection
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(refreshQr, 3000);
    return () => clearInterval(interval);
  }, [polling, tenantId]);

  // Auto close when connected
  useEffect(() => {
    if (step === "connected") {
      const timer = setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose(); // Ao invés de recarregar a página toda, só fecha o modal (a página pai já atualiza os dados)
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        style={{ borderColor: "var(--border)", background: "var(--background)" }}
        className="rounded-3xl border shadow-2xl w-full max-w-md p-8 relative transform transition-all scale-100"
      >
        <button
          onClick={onClose}
          style={{ color: "var(--muted-foreground)" }}
          className="absolute top-5 right-5 hover:text-foreground transition-colors bg-muted/50 hover:bg-muted p-1.5 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step: phone entry */}
        {step === "phone" && (
          <div className="flex flex-col transition-all duration-300">
            <div className="mb-6">
              <div
                style={{ background: "rgba(37, 211, 102, 0.1)", color: "#25D366" }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-2xl border border-[#25D366]/20 shadow-sm"
              >
                <Smartphone className="w-7 h-7" />
              </div>
              <h2 className="font-display font-extrabold text-2xl text-foreground">
                Conectar WhatsApp
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Informe o número da sua empresa. Você verá um QR Code logo em seguida para parear o WhatsApp.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Nome da Conexão
                </label>
                <input
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="Ex: WhatsApp Vendas"
                  required
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                  className="w-full border rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#25D366]/30 text-foreground transition-shadow mb-4"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Número de WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder={"+55 (11) 9 9999-9999"}
                  maxLength={21}
                  required
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                  className="w-full border rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#25D366]/30 text-foreground transition-shadow disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading || phone.length < 14}
                style={{ background: "#25D366", color: "#fff" }}
                className="w-full py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[#25D366]/20 disabled:opacity-60 disabled:shadow-none"
              >
                {loading ? "Criando Instância..." : "Gerar QR Code"}
              </button>
            </form>
          </div>
        )}

        {/* Step: QR Code */}
        {step === "qr" && (
          <div className="flex flex-col transition-all duration-300">
            <div className="mb-5">
              <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">
                Escaneie o QR Code
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Abra o WhatsApp no seu celular, vá em <strong>Aparelhos conectados</strong> → <strong>Conectar aparelho</strong> e aponte a câmera.
              </p>
            </div>

            <div
              style={{ borderColor: "var(--border)", background: "var(--background)" }}
              className="border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] shadow-inner relative overflow-hidden"
            >
              {qrCode ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-[#25D366]/5 blur-2xl rounded-full"></div>
                  <img
                    src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    className="max-w-[240px] max-h-[240px] rounded-xl relative z-10 shadow-sm border border-border/50"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="w-10 h-10 border-4 border-muted border-t-[#25D366] rounded-full animate-spin mb-4"></div>
                  <span className="text-sm font-medium">Aguardando QR Code...</span>
                  <span className="text-xs opacity-70 mt-1">Conectando à Evolution API</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-5 bg-muted/30 p-3 rounded-xl border border-line">
              <span className="text-xs font-mono font-medium flex items-center gap-2">
                {status === "OPEN" ? (
                  <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Conectado</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Aguardando leitura</>
                )}
              </span>
              <button
                onClick={refreshQr}
                style={{ color: "var(--foreground)" }}
                className="flex items-center gap-1.5 text-xs font-semibold hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </button>
            </div>
          </div>
        )}

        {/* Step: Connected */}
        {step === "connected" && (
          <div className="text-center py-8 transition-all duration-300">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse"></div>
              <div
                style={{ color: "#fff", background: "#25D366" }}
                className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
              >
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>
            
            <h2 className="font-display font-extrabold text-3xl text-foreground mb-3">
              Conectado!
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-[280px] mx-auto">
              A instância foi criada com sucesso. O modal será fechado automaticamente em instantes...
            </p>
            <div className="w-full bg-muted rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-[#25D366] h-full rounded-full transition-all duration-[3000ms] ease-linear w-full" style={{ animation: "progress 3s linear" }}></div>
            </div>
            <style>{`
              @keyframes progress {
                0% { width: 0%; }
                100% { width: 100%; }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
