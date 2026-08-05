"use client";

import {
  X, Check, CreditCard, Zap, MessageSquare, Copy, QrCode, ArrowRight, Barcode,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { formatPhone } from "@/lib/utils";
import { initMercadoPago } from "@mercadopago/sdk-react";

interface CheckoutModalProps {
  plan: any;
  loginUrl: string;
  onClose: () => void;
}

export function CheckoutModal({ plan, loginUrl, onClose }: CheckoutModalProps) {
  const [form, setForm] = useState({
    name: "", email: "", document: "", phone: "", method: "CREDIT_CARD", creditCardToken: "",
  });
  const [creditCard, setCreditCard] = useState({
    number: "", holderName: "", expiryMonth: "", expiryYear: "", ccv: "",
  });

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [validatingDoc,   setValidatingDoc]   = useState(false);

  const [otpStep,        setOtpStep]        = useState(false);
  const [otpCode,        setOtpCode]        = useState("");
  const [pixData,        setPixData]        = useState<{ qrCodeBase64: string; qrCodeString: string } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied,         setCopied]         = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
      initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
    }
  }, []);

  // ─── Formatters ───────────────────────────────────────────────────────────
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length <= 11) {
      val = val.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      val = val
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
      if (val.length > 18) val = val.substring(0, 18);
    }
    setForm({ ...form, document: val });
  };

  const handleDocBlur = async () => {
    const doc = form.document.replace(/\D/g, "");
    if (doc.length === 11) {
      setValidatingDoc(true);
      try {
        const res = await fetch(getBackendUrl(`/api/validate/cpf?cpf=${doc}`));
        const data = await res.json();
        if (!data.success) toast.error(data.error || "CPF Inválido");
        else if (data.data?.data?.nome && !form.name) {
          setForm(prev => ({ ...prev, name: data.data.data.nome }));
        }
      } catch { toast.error("Erro ao validar CPF"); }
      finally { setValidatingDoc(false); }
    } else if (doc.length === 14) {
      setValidatingDoc(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${doc}`);
        if (!res.ok) toast.error("CNPJ Inválido ou não encontrado");
        else {
          const data = await res.json();
          if (data.razao_social && !form.name) {
            setForm(prev => ({ ...prev, name: data.razao_social }));
          }
        }
      } catch { toast.error("Erro ao validar CNPJ"); }
      finally { setValidatingDoc(false); }
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = form.document.replace(/\D/g, "");
    if (doc.length !== 11 && doc.length !== 14) { toast.error("Documento inválido"); return; }
    if (form.method === "CREDIT_CARD" && (!creditCard.number || !creditCard.ccv)) {
      toast.error("Preencha todos os dados do cartão"); return;
    }

    if (form.method === "PIX" || form.method === "BOLETO") {
      await executeCheckout();
      return;
    }

    setCheckoutLoading(true);
    try {
      // 1. Gerar Token MP
      // @ts-ignore
      const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
      const cleanCard = creditCard.number.replace(/\D/g, "");
      const cleanYear = creditCard.expiryYear.length === 2 ? `20${creditCard.expiryYear}` : creditCard.expiryYear;

      const tokenPayload = {
        cardNumber: cleanCard,
        cardholderName: creditCard.holderName,
        cardExpirationMonth: creditCard.expiryMonth,
        cardExpirationYear: cleanYear,
        securityCode: creditCard.ccv,
        identificationType: doc.length > 11 ? "CNPJ" : "CPF",
        identificationNumber: doc
      };

      const tokenResponse = await mp.createCardToken(tokenPayload);
      if (tokenResponse.error) {
        console.error("MP Token Error", tokenResponse.error);
        toast.error("Falha ao validar os dados do cartão.");
        setCheckoutLoading(false);
        return;
      }
      form.creditCardToken = tokenResponse.id;

      // 2. Enviar OTP
      const res = await fetch(getBackendUrl("/api/saas/otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, name: form.name }),
      });
      const data = await res.json();
      if (data.success) { 
        setOtpStep(true); 
        if (data.isMock) {
          toast.info("Atenção: Evolution API falhou. O código foi impresso nos logs do back-end no Easypanel para testes.", { duration: 6000 });
        } else {
          toast.success("Código enviado para o seu WhatsApp!"); 
        }
      }
      else toast.error(data.error || "Erro ao enviar código");
    } catch { toast.error("Erro de conexão"); }
    finally { setCheckoutLoading(false); }
  };

  const handleFinalCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) { toast.error("Digite o código de 6 dígitos"); return; }
    await executeCheckout(otpCode);
  };

  const executeCheckout = async (otp?: string) => {
    setCheckoutLoading(true);
    try {
      const payload: any = { ...form, planId: plan.id, otpCode: otp };
      const res = await fetch(getBackendUrl("/api/saas/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (form.method === "PIX") {
          setPixData({ qrCodeBase64: data.data.pix.qrCodeBase64, qrCodeString: data.data.pix.qrCodeString });
        } else if (form.method === "BOLETO") {
          window.location.href = data.data.paymentUrl;
        } else {
          setPaymentSuccess(true);
        }
      } else {
        toast.error(data.error || "Erro ao processar pagamento");
      }
    } catch { toast.error("Erro de conexão ao processar checkout"); }
    finally { setCheckoutLoading(false); }
  };

  const copyPix = () => {
    if (pixData?.qrCodeString) {
      navigator.clipboard.writeText(pixData.qrCodeString);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // ─── Styles ───────────────────────────────────────────────────────────────
  const inputCls = "w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50";
  const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5";

  const intervalLabel = (iv: string) =>
    iv === "yearly" ? "ano" : iv === "semiannual" ? "semestre" : "mês";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto pt-16">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl relative my-auto">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          {/* ── Success ── */}
          {paymentSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-2">Pagamento Aprovado!</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Sua assinatura do plano <strong>{plan.name}</strong> foi ativada com sucesso.
              </p>
              <a href={loginUrl} className="block w-full py-3.5 btn-primary text-center font-semibold rounded-xl">
                Acessar Painel
              </a>
            </div>

          /* ── PIX ── */
          ) : pixData ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-7 h-7" />
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-1">PIX Gerado</h2>
              <p className="text-xs text-muted-foreground mb-6">Escaneie o QR Code ou copie o código para pagar.</p>
              <div className="bg-card border border-border p-4 rounded-xl inline-block mb-5">
                <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-44 h-44" />
              </div>
              <div className="bg-muted border border-border p-4 rounded-xl flex items-center gap-3 text-left">
                <p className="text-xs font-mono break-all line-clamp-2 flex-1 text-muted-foreground">{pixData.qrCodeString}</p>
                <button onClick={copyPix} className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 shrink-0 transition-opacity">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

          /* ── OTP ── */
          ) : otpStep ? (
            <form onSubmit={handleFinalCheckout} className="text-center">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-2">Confirme seu WhatsApp</h2>
              <p className="text-sm text-muted-foreground mb-7">
                Código de 6 dígitos enviado para <strong>{form.phone}</strong>.
              </p>
              <input
                required type="text" maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center tracking-[1em] font-mono font-bold text-2xl bg-muted border border-border rounded-xl px-4 py-4 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none mb-6 transition-all text-foreground"
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={checkoutLoading || otpCode.length < 6}
                className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2"
              >
                {checkoutLoading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "Confirmar e Pagar"}
              </button>
              <button type="button" onClick={() => setOtpStep(false)} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Voltar e editar dados
              </button>
            </form>

          /* ── Checkout form ── */
          ) : (
            <>
              {/* Plan header */}
              <div className="flex items-start justify-between mb-6 pb-5 border-b border-border">
                <div>
                  <h2 className="font-display font-bold text-xl text-foreground">Finalizar Assinatura</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Plano <span className="text-primary font-semibold">{plan.name}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-2xl text-foreground">
                    R$ {Number(plan.price).toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-xs text-muted-foreground">/{intervalLabel(plan.interval)}</p>
                </div>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Dados básicos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nome Completo</label>
                    <input required type="text" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputCls} placeholder="João da Silva" />
                  </div>
                  <div>
                    <label className={labelCls}>E-mail</label>
                    <input required type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputCls} placeholder="joao@email.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className={labelCls}>CPF ou CNPJ</label>
                    <input required type="text" value={form.document}
                      onChange={handleDocChange} onBlur={handleDocBlur}
                      maxLength={18} className={inputCls} placeholder="000.000.000-00" />
                    {validatingDoc && (
                      <div className="absolute right-4 top-9 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp</label>
                    <input required type="tel" value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                      maxLength={21} className={inputCls} placeholder="(11) 99999-9999" />
                  </div>
                </div>

                {/* Forma de pagamento */}
                <div>
                  <label className={labelCls}>Forma de Pagamento</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { method: "CREDIT_CARD", icon: <CreditCard className="w-4 h-4" />, label: "Cartão" },
                      { method: "PIX",         icon: <Zap className="w-4 h-4" />,        label: "PIX" },
                      { method: "BOLETO",      icon: <Barcode className="w-4 h-4" />,    label: "Boleto" },
                    ].map(({ method, icon, label }) => (
                      <button
                        key={method} type="button"
                        onClick={() => setForm({ ...form, method })}
                        className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                          form.method === method
                            ? "border-primary/40 bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/20"
                        }`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dados do cartão */}
                {form.method === "CREDIT_CARD" && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-primary" />
                      <p className={`${labelCls} mb-0`}>Dados do Cartão</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" value={creditCard.number}
                        onChange={(e) => setCreditCard({ ...creditCard, number: e.target.value })}
                        maxLength={19} className={inputCls} placeholder="Número do Cartão" />
                      <input required type="text" value={creditCard.holderName}
                        onChange={(e) => setCreditCard({ ...creditCard, holderName: e.target.value })}
                        className={inputCls} placeholder="Nome no cartão" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <input required type="text" value={creditCard.expiryMonth}
                        onChange={(e) => setCreditCard({ ...creditCard, expiryMonth: e.target.value.replace(/\D/g, "") })}
                        maxLength={2} className={`${inputCls} text-center`} placeholder="Mês (MM)" />
                      <input required type="text" value={creditCard.expiryYear}
                        onChange={(e) => setCreditCard({ ...creditCard, expiryYear: e.target.value.replace(/\D/g, "") })}
                        maxLength={4} className={`${inputCls} text-center`} placeholder="Ano (AA)" />
                      <input required type="text" value={creditCard.ccv}
                        onChange={(e) => setCreditCard({ ...creditCard, ccv: e.target.value.replace(/\D/g, "") })}
                        maxLength={4} className={`${inputCls} text-center`} placeholder="CVV" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={checkoutLoading || validatingDoc}
                  className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2"
                >
                  {checkoutLoading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Continuar</span><ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
