"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, XCircle, ArrowRight, Sparkles, X, CreditCard, 
  MessageSquare, CalendarCheck, TrendingUp, Clock, ShieldCheck, 
  Bot, PhoneForwarded, Target, Zap, ChevronDown
} from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";
import { FadeIn } from "@/components/FadeIn";

// --- FAQ Component ---
function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-2xl bg-card overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left font-bold text-foreground hover:bg-muted/50 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 \${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`px-5 transition-all duration-300 \${open ? 'pb-5 opacity-100 max-h-48' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <p className="text-sm text-muted-foreground">{answer}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // Form State
  const [form, setForm] = useState({ name: "", email: "", document: "", phone: "", method: "CREDIT_CARD" });
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

    // Calculate main domain for login
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      if (host.startsWith('planos.')) {
        setLoginUrl(`\${window.location.protocol}//\${host.replace('planos.', '')}/login`);
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
        
        {/* 1. HERO SECTION */}
        <section className="w-full px-4 py-24 md:py-32 flex flex-col items-center text-center relative overflow-hidden">
          {/* Background effects */}
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
            <button onClick={() => document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-muted text-foreground font-bold rounded-full text-lg hover:bg-muted/80 transition-all">
              Conhecer Funcionalidades
            </button>
          </div>
        </section>

        {/* 2. A DOR / PROBLEMAS */}
        <section id="dor" className="w-full px-4 py-24 bg-card border-y border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Você se identifica com essas situações?</h2>
              <p className="text-muted-foreground text-lg">Gerenciar um negócio não deveria ser sinônimo de perder noites de sono.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-background border border-border/50 shadow-sm">
                <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Perda de Clientes pela Demora</h3>
                <p className="text-muted-foreground">Você está executando o serviço e não pode responder o WhatsApp. Quando responde, o cliente já fechou com a concorrência.</p>
              </div>
              <div className="p-8 rounded-3xl bg-background border border-border/50 shadow-sm">
                <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Esquecimento e Inadimplência</h3>
                <p className="text-muted-foreground">Agendar no papel ou em planilhas te faz esquecer de cobrar sinal ou de lembrar o cliente, gerando faltas e prejuízos.</p>
              </div>
              <div className="p-8 rounded-3xl bg-background border border-border/50 shadow-sm">
                <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
                  <PhoneForwarded className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">O(a) Empreendedor(a) "Secretária"</h3>
                <p className="text-muted-foreground">Você passa mais tempo organizando horários, respondendo dúvidas básicas e remarcando agendas do que fazendo o seu serviço principal.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENEFÍCIOS / FUNCIONALIDADES */}
        <section id="beneficios" className="w-full px-4 py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">O sistema que trabalha por você.</h2>
              <p className="text-muted-foreground text-lg">Descubra como o AgendaZap transforma o seu negócio no piloto automático.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-bold text-sm">
                  <Bot className="w-4 h-4" /> Atendimento 24/7
                </div>
                <h3 className="text-3xl font-extrabold leading-tight">Sua própria Inteligência Artificial respondendo no WhatsApp.</h3>
                <p className="text-lg text-muted-foreground">
                  Treine nossa IA com as informações do seu negócio. Ela responderá dúvidas sobre preços, localização, serviços e fará o atendimento humano de forma impecável, encaminhando o cliente para o agendamento sem que você precise tocar no celular.
                </p>
                <ul className="space-y-3 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Respostas instantâneas e naturais.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Funciona mesmo quando você está dormindo.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Transbordo para atendimento humano a qualquer momento.</li>
                </ul>
              </div>
              <div className="relative h-[400px] rounded-3xl bg-gradient-to-br from-blue-500/5 to-primary/10 border border-border/50 flex items-center justify-center p-8 overflow-hidden">
                {/* Mockup visual ilustrativo */}
                <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border/50 p-4">
                  <div className="flex items-center gap-3 border-b border-border/50 pb-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white"><Bot className="w-4 h-4"/></div>
                    <div>
                      <div className="text-sm font-bold">Assistente AgendaZap</div>
                      <div className="text-xs text-emerald-500">Online</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm ml-8 opacity-80">Olá! Quero saber o valor do corte.</div>
                    <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm text-sm mr-8 shadow-md">
                      Olá! O valor do corte tradicional é R$ 50,00 e o corte com barba é R$ 80,00. Gostaria de agendar um horário para esta semana? Temos vagas amanhã à tarde!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center flex-col-reverse lg:flex-row-reverse mb-24">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                  <CalendarCheck className="w-4 h-4" /> Agenda Inteligente
                </div>
                <h3 className="text-3xl font-extrabold leading-tight">Agendamentos integrados e envios de lembretes.</h3>
                <p className="text-lg text-muted-foreground">
                  Seu cliente escolhe o serviço e o horário através de um link prático, ou conversando com a IA. O sistema organiza tudo em um calendário visual e dispara mensagens automáticas no WhatsApp para lembrar o cliente do compromisso, reduzindo drasticamente as faltas.
                </p>
                <ul className="space-y-3 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Calendário visual fácil de usar.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Lembretes de agendamento automáticos.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Prevenção de conflito de horários.</li>
                </ul>
              </div>
              <div className="relative h-[400px] rounded-3xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-border/50 flex items-center justify-center p-8 overflow-hidden">
                 <div className="w-full h-full bg-card rounded-2xl shadow-2xl border border-border/50 p-6 flex flex-col gap-3 relative">
                    <div className="h-6 w-32 bg-muted rounded-md mb-4" />
                    {[1,2,3].map(i => (
                      <div key={i} className="flex gap-4 items-center">
                        <div className="w-12 text-xs text-muted-foreground font-bold">14:00</div>
                        <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-3 rounded-xl text-sm font-semibold flex justify-between">
                          <span>João Silva</span>
                          <span>Corte de Cabelo</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 font-bold text-sm">
                  <Target className="w-4 h-4" /> CRM & Funil de Vendas
                </div>
                <h3 className="text-3xl font-extrabold leading-tight">Organize contatos, dispare campanhas e multiplique vendas.</h3>
                <p className="text-lg text-muted-foreground">
                  Transforme simples contatos em clientes recorrentes. Organize os interessados em um Funil de Vendas estilo Kanban e crie campanhas de disparo em massa no WhatsApp para promover promoções, novidades ou recuperar clientes sumidos.
                </p>
                <ul className="space-y-3 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Funil de vendas arrastar-e-soltar.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Histórico unificado de conversas.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Disparos em massa segmentados.</li>
                </ul>
              </div>
              <div className="relative h-[400px] rounded-3xl bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-border/50 flex items-center justify-center p-8 overflow-hidden">
                <div className="w-full h-full flex gap-4">
                  {[1,2].map(col => (
                    <div key={col} className="flex-1 bg-muted/50 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="h-4 w-20 bg-muted-foreground/20 rounded-md mb-2" />
                      {[1,2].map(card => (
                        <div key={card} className="bg-card p-4 rounded-xl shadow-sm border border-border/50 space-y-2">
                          <div className="h-3 w-3/4 bg-muted rounded-full" />
                          <div className="h-3 w-1/2 bg-muted rounded-full" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. COMO FUNCIONA */}
        <section className="w-full px-4 py-24 bg-card border-y border-border/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-16">Tão fácil que parece mágica.</h2>
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Linha conectora desktop */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-border via-primary/50 to-border -z-10" />
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-card shadow-xl flex items-center justify-center mb-6 text-3xl font-display font-extrabold text-primary relative z-10">
                  1
                </div>
                <h4 className="text-xl font-bold mb-2">Conecte o WhatsApp</h4>
                <p className="text-muted-foreground text-sm">Escaneie o QR Code dentro do painel e seu número estará integrado na hora.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-card shadow-xl flex items-center justify-center mb-6 text-3xl font-display font-extrabold text-primary relative z-10">
                  2
                </div>
                <h4 className="text-xl font-bold mb-2">Treine a Inteligência</h4>
                <p className="text-muted-foreground text-sm">Adicione suas regras, preços e horários com um texto simples. A IA aprende instantaneamente.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-card shadow-xl flex items-center justify-center mb-6 text-3xl font-display font-extrabold text-primary relative z-10">
                  3
                </div>
                <h4 className="text-xl font-bold mb-2">Comece a Lucrar</h4>
                <p className="text-muted-foreground text-sm">Divulgue seu número e deixe o sistema atender, agendar e cobrar por você automaticamente.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. PRICING SECTION */}
        <section id="planos" className="w-full px-4 py-24">
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold">Planos Simples e Transparentes</h2>
              <p className="text-muted-foreground mt-3 text-lg">Escolha o plano ideal. Cancele quando quiser, sem taxas surpresas.</p>
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
                  const displayPlan = variations['monthly'] || Object.values(variations)[0];
                  if (!displayPlan) return null;

                  return (
                    <div key={name} className={`relative flex flex-col p-8 rounded-3xl border \${isRecommended ? 'border-primary shadow-2xl shadow-primary/20 bg-gradient-to-b from-primary/[0.05] to-transparent scale-105 z-10' : 'border-border/50 bg-card hover:border-border'}`}>
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
                            <li key={i} className={`flex items-start gap-3 \${!included ? 'opacity-40' : ''}`}>
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
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all \${isRecommended ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                      >
                        Assinar {displayPlan.name} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-12 flex items-center justify-center gap-6 text-sm font-semibold text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Pagamento 100% Seguro</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Liberação Imediata</div>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section id="faq" className="w-full px-4 py-24 bg-card/50 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Dúvidas Frequentes</h2>
              <p className="text-muted-foreground">Tudo o que você precisa saber antes de assinar.</p>
            </div>
            <div className="space-y-4">
              <FaqItem 
                question="Preciso baixar algum aplicativo no celular ou computador?" 
                answer="Não! O AgendaZap é 100% em nuvem e funciona direto no navegador do seu celular, tablet ou computador. Basta acessar, conectar seu WhatsApp através do QR Code (igual ao WhatsApp Web) e o sistema já começa a funcionar." 
              />
              <FaqItem 
                question="A Inteligência Artificial pode responder coisas erradas para o cliente?" 
                answer="Nossa IA é baseada nas instruções que você fornece! Você escreve as regras do seu negócio, tabela de preços e o que ela NÃO deve responder. Em caso de dúvidas complexas, a IA avisa o cliente que um atendente humano irá assumir a conversa." 
              />
              <FaqItem 
                question="Posso usar meu próprio número de WhatsApp?" 
                answer="Sim! Você conecta o seu próprio número de WhatsApp escaneando o QR Code na nossa plataforma. Não usamos números terceirizados. Seus clientes vão conversar diretamente com o seu número oficial." 
              />
              <FaqItem 
                question="Existe fidelidade ou multa de cancelamento?" 
                answer="De forma alguma. O serviço é pré-pago no formato assinatura mensal. Você pode cancelar a qualquer momento diretamente pelo painel e não haverá nenhuma cobrança futura." 
              />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-12 px-6 border-t border-border/40 text-center">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 opacity-80">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center text-background font-display font-extrabold text-xl -rotate-6">
              A
            </div>
            <span className="font-display font-extrabold text-xl tracking-wide">AgendaZap</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AgendaZap. Plataforma de gestão inovadora. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-semibold">
            <a href="#" className="hover:text-foreground">Termos de Uso</a>
            <a href="#" className="hover:text-foreground">Privacidade</a>
          </div>
        </div>
      </footer>

      {/* CHECKOUT MODAL (Keep Existing Logic) */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowCheckout(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
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
                  <button type="button" onClick={() => setForm({...form, method: 'CREDIT_CARD'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors \${form.method === 'CREDIT_CARD' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                    <CreditCard className="w-4 h-4" /> Cartão
                  </button>
                  <button type="button" onClick={() => setForm({...form, method: 'PIX'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors \${form.method === 'PIX' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
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
