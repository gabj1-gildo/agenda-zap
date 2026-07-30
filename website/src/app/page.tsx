"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  CheckCircle2, XCircle, ArrowRight, Sparkles, X, CreditCard, 
  MessageSquare, CalendarCheck, TrendingUp, Clock, ShieldCheck, 
  Bot, PhoneForwarded, Target, Zap, ChevronDown, Copy, Check, MapPin, QrCode
} from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";
import { FadeIn } from "@/components/FadeIn";

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-2xl bg-card overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left font-bold text-foreground hover:bg-muted/50 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`px-5 transition-all duration-300 ${open ? 'pb-5 opacity-100 max-h-48' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <p className="text-sm text-muted-foreground">{answer}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'semiannual' | 'yearly'>('monthly');
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // Form State
  const [form, setForm] = useState({ name: "", email: "", document: "", phone: "", method: "CREDIT_CARD" });
  const [creditCard, setCreditCard] = useState({ number: '', holderName: '', expiryMonth: '', expiryYear: '', ccv: '' });
  const [address, setAddress] = useState({ cep: '', number: '' });
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Validation States
  const [validatingDoc, setValidatingDoc] = useState(false);
  const [validatingCep, setValidatingCep] = useState(false);

  // OTP and Pix State
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pixData, setPixData] = useState<{qrCodeBase64: string, qrCodeString: string} | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const [loginUrl, setLoginUrl] = useState("/login");

  useEffect(() => {
    fetch(getBackendUrl('/api/public/plans'))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlans(data.data);
        }
      })
      .catch(() => toast.error("Falha ao carregar planos"))
      .finally(() => setLoading(false));

    if (typeof window !== 'undefined') {
      const host = window.location.host;
      if (host.startsWith('planos.')) {
        setLoginUrl(`${window.location.protocol}//${host.replace('planos.', '')}/login`);
      }
    }
  }, []);

  const groupedPlans = useMemo(() => {
    const groups: Record<string, Record<string, any>> = {};
    plans.forEach(p => {
      if (!groups[p.name]) groups[p.name] = {};
      groups[p.name][p.interval] = p;
    });
    return groups;
  }, [plans]);
  
  const planNames = Object.keys(groupedPlans);
  
  // Formata Documento
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length <= 11) {
      val = val.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      val = val.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
      if (val.length > 18) val = val.substring(0, 18);
    }
    setForm({...form, document: val});
  };

  const handleDocBlur = async () => {
    const doc = form.document.replace(/\D/g, '');
    if (doc.length === 11) {
      setValidatingDoc(true);
      try {
        const res = await fetch(getBackendUrl(`/api/validate/cpf?cpf=${doc}`));
        const data = await res.json();
        if (!data.success) toast.error(data.error || "CPF Inválido");
      } catch {
        toast.error("Erro ao validar CPF");
      } finally {
        setValidatingDoc(false);
      }
    } else if (doc.length === 14) {
      setValidatingDoc(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${doc}`);
        if (!res.ok) toast.error("CNPJ Inválido ou não encontrado");
      } catch {
        toast.error("Erro ao validar CNPJ");
      } finally {
        setValidatingDoc(false);
      }
    }
  };

  const handleCepBlur = async () => {
    const cep = address.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      setValidatingCep(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
        if (!res.ok) toast.error("CEP não encontrado");
        else toast.success("Endereço localizado via CEP");
      } catch {
        toast.error("Erro ao buscar CEP");
      } finally {
        setValidatingCep(false);
      }
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = form.document.replace(/\D/g, '');
    if (doc.length !== 11 && doc.length !== 14) {
      toast.error("Documento inválido"); return;
    }
    if (form.method === 'CREDIT_CARD' && (address.cep.length < 8 || !address.number || !creditCard.number || !creditCard.ccv)) {
      toast.error("Preencha todos os dados do cartão e endereço"); return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch(getBackendUrl('/api/saas/otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, name: form.name })
      });
      const data = await res.json();
      if (data.success) {
        setOtpStep(true);
        toast.success("Código enviado para o seu WhatsApp!");
      } else {
        toast.error(data.error || "Erro ao enviar código de validação");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleFinalCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error("Digite o código de 6 dígitos"); return;
    }
    
    setCheckoutLoading(true);
    try {
      const payload: any = {
        ...form,
        planId: selectedPlan.id,
        otpCode,
      };
      
      if (form.method === 'CREDIT_CARD') {
        payload.creditCard = {
          holderName: creditCard.holderName,
          number: creditCard.number.replace(/\D/g, ''),
          expiryMonth: creditCard.expiryMonth,
          expiryYear: creditCard.expiryYear,
          ccv: creditCard.ccv
        };
        payload.creditCardHolderInfo = {
          name: form.name,
          email: form.email,
          cpfCnpj: form.document.replace(/\D/g, ''),
          postalCode: address.cep.replace(/\D/g, ''),
          addressNumber: address.number,
          phone: form.phone.replace(/\D/g, '')
        };
      }

      const res = await fetch(getBackendUrl('/api/saas/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        if (form.method === 'PIX') {
          setPixData({
            qrCodeBase64: data.data.pix.qrCodeBase64,
            qrCodeString: data.data.pix.qrCodeString
          });
        } else {
          setPaymentSuccess(true);
        }
      } else {
        toast.error(data.error || "Erro ao processar pagamento");
      }
    } catch (e) {
      toast.error("Erro de conexão ao processar checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const copyPix = () => {
    if (pixData?.qrCodeString) {
      navigator.clipboard.writeText(pixData.qrCodeString);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const scrollToPricing = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* HEADER */}
      <header className="py-5 px-6 md:px-12 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-extrabold text-2xl -rotate-6 shadow-lg shadow-primary/20">
            A
          </div>
          <span className="font-display font-extrabold text-2xl tracking-wide hidden sm:block">AgendaZap</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
          <button onClick={() => document.getElementById('dor')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Problema</button>
          <button onClick={() => document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Benefícios</button>
          <button onClick={scrollToPricing} className="hover:text-foreground transition-colors">Planos</button>
          <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">FAQ</button>
        </nav>
        <a href={loginUrl} className="px-6 py-2.5 bg-primary/10 text-primary text-sm font-bold rounded-full hover:bg-primary/20 transition-colors">
          Acessar Sistema
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center w-full">
        
        {/* HERO SECTION */}
        <section className="w-full px-4 py-24 md:py-32 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50" />
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Sparkles className="w-4 h-4" /> A revolução da gestão e atendimento.
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight max-w-5xl leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
            O fim do atendimento manual e da <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">agenda bagunçada.</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            Atenda clientes 24h por dia com Inteligência Artificial, automatize seus agendamentos e escale suas vendas sem precisar contratar mais pessoas. Tudo em uma única plataforma.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <button onClick={scrollToPricing} className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full text-lg flex items-center gap-2 hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-primary/25">
              Começar Agora <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="planos" className="w-full px-4 py-24 bg-card border-y border-border/50">
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold">Planos Simples e Transparentes</h2>
              <p className="text-muted-foreground mt-3 text-lg">Escolha o plano ideal. Cancele quando quiser, sem taxas surpresas.</p>
            </div>

            <div className="flex justify-center mb-12">
              <div className="inline-flex items-center p-1.5 bg-background border border-border rounded-full">
                <button onClick={() => setBillingInterval('monthly')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${billingInterval === 'monthly' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Mensal</button>
                <button onClick={() => setBillingInterval('semiannual')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${billingInterval === 'semiannual' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Semestral <span className="text-[10px] bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full ml-1">-10%</span></button>
                <button onClick={() => setBillingInterval('yearly')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${billingInterval === 'yearly' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Anual <span className="text-[10px] bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full ml-1">-20%</span></button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center">
                {planNames.map(name => {
                  const variations = groupedPlans[name];
                  const displayPlan = variations[billingInterval] || variations['monthly'] || Object.values(variations)[0];
                  if (!displayPlan) return null;
                  
                  // Destaque o PRO no mensal (ou se for o segundo plano)
                  const isRecommended = (billingInterval === 'monthly' && name.toLowerCase().includes('pro')) || (planNames.length > 1 && name === planNames[1] && !planNames.some(n => n.toLowerCase().includes('pro')));

                  return (
                    <div key={name} className={`relative flex flex-col p-8 rounded-3xl border ${isRecommended ? 'border-primary shadow-2xl shadow-primary/20 bg-gradient-to-b from-primary/[0.05] to-transparent scale-105 z-10' : 'border-border/50 bg-card hover:border-border'}`}>
                      {isRecommended && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-blue-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                          <Sparkles className="w-3.5 h-3.5" /> O Mais Escolhido
                        </div>
                      )}
                      
                      <h3 className="text-2xl font-bold">{displayPlan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-2 h-10">{displayPlan.description}</p>
                      
                      <div className="mt-6 mb-8 flex items-end gap-1">
                        <span className="text-4xl font-extrabold tracking-tight">R$ {Number(displayPlan.price).toFixed(2).replace('.', ',')}</span>
                        <span className="text-muted-foreground font-medium mb-1">/{displayPlan.interval === 'yearly' ? 'ano' : displayPlan.interval === 'semiannual' ? 'semestre' : 'mês'}</span>
                      </div>

                      <ul className="space-y-4 mb-8 flex-1 text-sm">
                        <li className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                          <span>Até <strong>{displayPlan.maxUsers}</strong> Usuários</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                          <span>Até <strong>{displayPlan.maxTenants}</strong> Filiais</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                          <span><strong>{displayPlan.includedChats}</strong> Chats com IA/mês</span>
                        </li>
                        {displayPlan.features?.map((f: any, i: number) => {
                          const isObj = typeof f === 'object' && f !== null;
                          const text = isObj ? f.name : f;
                          const included = isObj ? f.included : true;
                          return (
                            <li key={i} className={`flex items-start gap-3 ${!included ? 'opacity-40' : ''}`}>
                              {included ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />}
                              <span className={!included ? 'line-through' : ''}>{text}</span>
                            </li>
                          )
                        })}
                      </ul>

                      <button
                        onClick={() => {
                          setSelectedPlan(displayPlan);
                          setShowCheckout(true);
                        }}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isRecommended ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                      >
                        Assinar {displayPlan.name} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full py-12 px-6 border-t border-border/40 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AgendaZap. Todos os direitos reservados.
        </p>
      </footer>

      {/* CHECKOUT MODAL */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto pt-20">
          <div className="bg-card border border-border rounded-3xl w-full max-w-xl p-8 shadow-2xl relative my-auto">
            <button onClick={() => { setShowCheckout(false); setOtpStep(false); setPixData(null); setPaymentSuccess(false); }} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            {paymentSuccess ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Pagamento Aprovado!</h2>
                <p className="text-muted-foreground mb-8">Sua assinatura do plano <strong>{selectedPlan.name}</strong> foi ativada com sucesso.</p>
                <a href={loginUrl} className="w-full block bg-primary text-primary-foreground font-bold rounded-xl py-4 hover:opacity-90 transition-opacity">
                  Acessar Painel
                </a>
              </div>
            ) : pixData ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">PIX Gerado com Sucesso</h2>
                <p className="text-sm text-muted-foreground mb-6">Escaneie o QR Code abaixo ou copie o código para pagar no seu banco.</p>
                
                <div className="bg-white p-4 rounded-xl inline-block mb-6 border border-border">
                  <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48" />
                </div>

                <div className="bg-muted p-4 rounded-xl flex items-center gap-3 text-left">
                  <p className="text-xs font-mono break-all line-clamp-2 flex-1 text-muted-foreground">{pixData.qrCodeString}</p>
                  <button onClick={copyPix} className="p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 shrink-0">
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-6">Enviamos o código PIX também para o seu WhatsApp e E-mail.</p>
              </div>
            ) : otpStep ? (
              <form onSubmit={handleFinalCheckout} className="py-4 text-center">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Confirme seu WhatsApp</h2>
                <p className="text-sm text-muted-foreground mb-8">Enviamos um código de 6 dígitos para <strong>{form.phone}</strong>.</p>
                
                <input required type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center tracking-[1em] font-mono font-bold text-2xl bg-background border border-border rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary/20 outline-none mb-6" placeholder="000000" />
                
                <button type="submit" disabled={checkoutLoading || otpCode.length < 6} className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                  {checkoutLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar e Pagar'}
                </button>
                <button type="button" onClick={() => setOtpStep(false)} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
                  Voltar e editar dados
                </button>
              </form>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1">Finalizar Assinatura</h2>
                <p className="text-sm text-muted-foreground mb-6">Plano <strong>{selectedPlan.name}</strong> por R$ {Number(selectedPlan.price).toFixed(2).replace('.', ',')}</p>
                
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Dados Básicos */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nome Completo</label>
                      <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="João da Silva" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">E-mail</label>
                      <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="joao@email.com" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">CPF ou CNPJ</label>
                      <input required type="text" value={form.document} onChange={handleDocChange} onBlur={handleDocBlur} maxLength={18} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="000.000.000-00" />
                      {validatingDoc && <div className="absolute right-4 top-9 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">WhatsApp</label>
                      <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: formatPhone(e.target.value)})} maxLength={21} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="(11) 99999-9999" />
                    </div>
                  </div>

                  {/* Metodo de Pagamento */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Forma de Pagamento</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setForm({...form, method: 'CREDIT_CARD'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${form.method === 'CREDIT_CARD' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                        <CreditCard className="w-4 h-4" /> Cartão de Crédito
                      </button>
                      <button type="button" onClick={() => setForm({...form, method: 'PIX'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${form.method === 'PIX' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                        <Zap className="w-4 h-4" /> PIX
                      </button>
                    </div>
                  </div>

                  {/* Dados do Cartão (Só se Cartão) */}
                  {form.method === 'CREDIT_CARD' && (
                    <div className="space-y-4 pt-4 border-t border-border mt-4 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2"><CreditCard className="w-3 h-3 inline mr-1"/> Dados do Cartão</label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <input required type="text" value={creditCard.number} onChange={e => setCreditCard({...creditCard, number: e.target.value})} maxLength={19} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Número do Cartão" />
                        </div>
                        <div>
                          <input required type="text" value={creditCard.holderName} onChange={e => setCreditCard({...creditCard, holderName: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Nome impresso no cartão" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <input required type="text" value={creditCard.expiryMonth} onChange={e => setCreditCard({...creditCard, expiryMonth: e.target.value.replace(/\D/g, '')})} maxLength={2} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary text-center" placeholder="Mês (Ex: 12)" />
                        <input required type="text" value={creditCard.expiryYear} onChange={e => setCreditCard({...creditCard, expiryYear: e.target.value.replace(/\D/g, '')})} maxLength={4} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary text-center" placeholder="Ano (Ex: 2029)" />
                        <input required type="text" value={creditCard.ccv} onChange={e => setCreditCard({...creditCard, ccv: e.target.value.replace(/\D/g, '')})} maxLength={4} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary text-center" placeholder="CVV" />
                      </div>
                      
                      <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 mt-4"><MapPin className="w-3 h-3 inline mr-1"/> Endereço de Cobrança</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 relative">
                          <input required type="text" value={address.cep} onChange={e => setAddress({...address, cep: e.target.value})} onBlur={handleCepBlur} maxLength={9} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="CEP" />
                          {validatingCep && <div className="absolute right-4 top-3.5 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                        </div>
                        <input required type="text" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Número" />
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={checkoutLoading || validatingDoc || validatingCep} className="w-full mt-6 bg-primary text-primary-foreground font-bold rounded-xl py-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                    {checkoutLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continuar <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
