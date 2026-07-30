"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, CheckCircle2, Server } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { useSession } from "next-auth/react";

type Props = {
  instanceName: string;
  onClose: () => void;
};

type Step = "qr" | "connected";

export function SystemPhoneModal({ instanceName, onClose }: Props) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  
  const [step, setStep] = useState<Step>("qr");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [status, setStatus] = useState("PENDING_QR");
  const [initializing, setInitializing] = useState(true);

  // Criar instância logo que o modal abrir
  useEffect(() => {
    if (!token) return;

    async function initInstance() {
      try {
        const res = await fetch(getBackendUrl(`/api/admin/system-settings/phone`), {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          },
          body: JSON.stringify({ instanceName }),
        });
        const data = await res.json();
        
        if (data.success) {
          setQrCode(data.data.qrCode);
          setStatus(data.data.status);
          setPolling(true);
        } else {
          alert(data.message || "Erro ao criar instância");
        }
      } catch (error) {
        alert("Erro de conexão com o servidor ao inicializar");
      } finally {
        setInitializing(false);
      }
    }
    
    initInstance();
  }, [instanceName, token]);

  const refreshQr = async () => {
    if (!token) return;
    try {
      const res = await fetch(getBackendUrl(`/api/admin/system-settings/phone`), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.data.qrCode);
        setStatus(data.data.status);
        if (data.data.status?.toUpperCase() === "OPEN") {
          setStep("connected");
          setPolling(false);
        }
      }
    } catch {}
  };

  // Poll every 5s while waiting for connection
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(refreshQr, 5000);
    return () => clearInterval(interval);
  }, [polling, token]);

  // Auto close when connected
  useEffect(() => {
    if (step === "connected") {
      const timer = setTimeout(() => {
        onClose();
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

        {/* Step: QR Code */}
        {step === "qr" && (
          <div className="flex flex-col transition-all duration-300">
            <div className="mb-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-2xl border bg-primary/10 text-primary border-primary/20 shadow-sm"
              >
                <Server className="w-7 h-7" />
              </div>
              <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">
                Conectar WhatsApp do Sistema
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Abra o WhatsApp no celular que enviará as mensagens do sistema, vá em <strong>Aparelhos conectados</strong> → <strong>Conectar aparelho</strong> e aponte a câmera.
              </p>
            </div>

            <div
              style={{ borderColor: "var(--border)", background: "var(--background)" }}
              className="border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] shadow-inner relative overflow-hidden"
            >
              {initializing ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
                  <span className="text-sm font-medium">Inicializando instância...</span>
                </div>
              ) : qrCode ? (
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
                  <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
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
                disabled={initializing}
                style={{ color: "var(--foreground)" }}
                className="flex items-center gap-1.5 text-xs font-semibold hover:bg-muted px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
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
              A instância global do sistema foi configurada com sucesso. Fechando...
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
