"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, Building2, Sparkles, X, CreditCard } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // Form State
  const [form, setForm] = useState({ name: "", email: "", document: "", phone: "", method: "CREDIT_CARD" });
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
  const recommendedPlanName = planNames.length > 1 ? planNames[1] : planNames[0];

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);

    try {
      const res = await fetch(getBackendUrl('/api/saas/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, planId: selectedPlan.id })
      });
      const data = await res.json();
      
      if (data.success && data.data.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = data.data.paymentUrl;
      } else {
        toast.error(data.error || "Erro ao processar checkout");
      }
    } catch (e) {
      toast.error("Erro de conexão ao processar checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* HEADER */}
      <header className="py-6 px-8 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-extrabold text-2xl -rotate-6 shadow-lg shadow-primary/20">
            A
          </div>
          <span className="font-display font-extrabold text-2xl tracking-wide">AgendaZap</span>
        </div>
        <Link href="/login" className="px-6 py-2.5 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-colors">
          Acessar Sistema
        </Link>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight max-w-4xl leading-tight">
          Gestão Inteligente para o seu <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Negócio</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
          Agendamentos, atendimento com IA, disparo de mensagens e funil de vendas. Tudo integrado em uma única plataforma projetada para escalar suas vendas.
        </p>

        {/* PRICING SECTION */}
        <div className="w-full max-w-6xl mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Planos Simples e Transparentes</h2>
            <p className="text-muted-foreground mt-2">Escolha o plano ideal. Cancele quando quiser.</p>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center">
              {planNames.map(name => {
                const isRecommended = name === recommendedPlanName;
                const variations = groupedPlans[name];
                
                // For landing page, we default to showing the Monthly price, or the first available
                const displayPlan = variations['monthly'] || Object.values(variations)[0];
                if (!displayPlan) return null;

                return (
                  <div key={name} className={\`relative flex flex-col p-8 rounded-3xl border \${isRecommended ? 'border-primary shadow-2xl shadow-primary/20 bg-gradient-to-b from-primary/[0.05] to-transparent scale-105 z-10' : 'border-border/50 bg-card hover:border-border'}\`}>
                    {isRecommended && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-blue-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
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
                          <li key={i} className={\`flex items-start gap-3 \${!included ? 'opacity-40' : ''}\`}>
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
                      className={\`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all \${isRecommended ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5' : 'bg-muted text-foreground hover:bg-muted/80'}\`}
                    >
                      Assinar {displayPlan.name} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40">
        <p>AgendaZap &copy; {new Date().getFullYear()}. Todos os direitos reservados.</p>
      </footer>

      {/* CHECKOUT MODAL */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowCheckout(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold mb-1">Finalizar Assinatura</h2>
            <p className="text-sm text-muted-foreground mb-6">Plano <strong>{selectedPlan.name}</strong> por R$ {Number(selectedPlan.price).toFixed(2).replace('.', ',')}</p>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nome Completo</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="João da Silva" />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">E-mail</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="joao@email.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">CPF ou CNPJ</label>
                  <input required type="text" value={form.document} onChange={e => setForm({...form, document: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Apenas números" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">WhatsApp</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: formatPhone(e.target.value)})} maxLength={21} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="(11) 99999-9999" />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm({...form, method: 'CREDIT_CARD'})} className={\`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors \${form.method === 'CREDIT_CARD' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}\`}>
                    <CreditCard className="w-4 h-4" /> Cartão
                  </button>
                  <button type="button" onClick={() => setForm({...form, method: 'PIX'})} className={\`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors \${form.method === 'PIX' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}\`}>
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[10px]">P</div> PIX
                  </button>
                </div>
              </div>

              <button type="submit" disabled={checkoutLoading} className="w-full mt-4 bg-primary text-primary-foreground font-bold rounded-xl py-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                {checkoutLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Ir para Pagamento <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
