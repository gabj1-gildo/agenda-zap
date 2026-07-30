"use client"

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard, QrCode, X, CheckCircle2 } from "lucide-react";
import { getBackendUrl } from "@/lib/api";

export function ChargeButton({ appointmentId, status }: { appointmentId: string, status: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'link' | 'pix' | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedPix, setGeneratedPix] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  if (status === "Pago" || status === "PAGO") {
    return (
      <button
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        className="text-xs font-semibold px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors opacity-50"
      >
        Ver recibo
      </button>
    );
  }

  if (status === "Cancelado" || status === "CANCELADO") {
    return (
      <button
        style={{ borderColor: "var(--border)", color: "var(--destructive)" }}
        className="text-xs font-semibold px-3 py-1.5 border rounded-lg opacity-50 cursor-not-allowed"
        disabled
      >
        Cancelado
      </button>
    );
  }

  const handleCharge = async () => {
    if (!method) return;
    
    setLoading(true);
    setSuccess(false);
    
    try {
      const res = await fetch(getBackendUrl('/api/payments/charge'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, paymentMethod: method })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Cobrança gerada com sucesso!");
        setGeneratedPix(data.pixCode || null);
        setGeneratedLink(data.paymentLink || null);
        setSuccess(true);
      } else {
        toast.error(data.error || "Erro ao gerar cobrança");
      }
    } catch (err) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        className="text-xs font-semibold px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors"
      >
        Cobrar
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold font-display">Enviar Cobrança</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-muted rounded-md transition-colors" disabled={loading}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {success ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">Gerado com sucesso!</h3>
                  <p className="text-sm text-muted-foreground">O cliente deve receber no WhatsApp em instantes.</p>
                  
                  {generatedPix && (
                    <div className="w-full text-left space-y-2 mt-4 bg-muted/50 p-4 rounded-xl border">
                      <p className="text-xs font-semibold text-muted-foreground">Pix Copia e Cola:</p>
                      <div className="p-3 bg-background border rounded-lg text-xs break-all text-foreground font-mono max-h-32 overflow-y-auto">
                        {generatedPix}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPix);
                          toast.success("Pix copiado!");
                        }}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90"
                      >
                        Copiar Pix
                      </button>
                    </div>
                  )}

                  {generatedLink && (
                    <div className="w-full text-left space-y-2 mt-4 bg-muted/50 p-4 rounded-xl border">
                      <p className="text-xs font-semibold text-muted-foreground">Link de Pagamento:</p>
                      <div className="p-3 bg-background border rounded-lg text-xs break-all text-foreground">
                        {generatedLink}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          toast.success("Link copiado!");
                        }}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90"
                      >
                        Copiar Link
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setModalOpen(false);
                      setSuccess(false);
                      setMethod(null);
                      setGeneratedPix(null);
                      setGeneratedLink(null);
                    }}
                    className="w-full mt-2 py-2 border rounded-xl text-sm font-medium hover:bg-muted"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Como você deseja gerar e enviar a cobrança para o cliente?
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMethod('link')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === 'link' ? 'border-primary bg-muted/50' : 'border-transparent bg-muted hover:bg-muted/80'}`}
                      disabled={loading}
                    >
                      <CreditCard className={`w-6 h-6 mb-2 ${method === 'link' ? 'text-foreground' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-bold">Cartão / Boleto</span>
                      <span className="text-[10px] text-muted-foreground mt-1">Enviar link</span>
                    </button>
                    
                    <button
                      onClick={() => setMethod('pix')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === 'pix' ? 'border-primary bg-muted/50' : 'border-transparent bg-muted hover:bg-muted/80'}`}
                      disabled={loading}
                    >
                      <QrCode className={`w-6 h-6 mb-2 ${method === 'pix' ? 'text-foreground' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-bold">Apenas Pix</span>
                      <span className="text-[10px] text-muted-foreground mt-1">Copia e Cola</span>
                    </button>
                  </div>

                  <div className="pt-4 mt-2">
                    <button
                      onClick={handleCharge}
                      disabled={!method || loading}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando e enviando...
                        </>
                      ) : (
                        "Confirmar Envio"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
