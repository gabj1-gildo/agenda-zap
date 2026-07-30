"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle, XCircle, Clock, Zap, Sparkles, ChevronDown, ChevronUp, CreditCard, ArrowRight } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Compact Plan Card ──────────────────────────────────────────
function PlanCardGroup({ variations, activeSub, onSubscribe, isRecommended }: { variations: any; activeSub: any; onSubscribe: (id: string) => void; isRecommended?: boolean }) {
  const availableCycles = Object.keys(variations);
  const [cycle, setCycle] = useState<string>(
    availableCycles.includes('yearly') ? 'yearly' 
    : availableCycles.includes('quarterly') ? 'quarterly' 
    : 'monthly'
  );
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const plan = variations[cycle] || Object.values(variations)[0];
  if (!plan) return null;

  const isCurrentPlan = activeSub?.planId === plan.id;

  // Show first 4 features, expand for more
  const allFeatures = plan.features || [];
  const visibleFeatures = showAllFeatures ? allFeatures : allFeatures.slice(0, 4);
  const hasMoreFeatures = allFeatures.length > 4;

  // Calculate monthly equivalent for longer cycles
  const monthlyEquivalent = useMemo(() => {
    const price = Number(plan.price);
    if (plan.interval === 'yearly') return (price / 12).toFixed(2);
    if (plan.interval === 'semiannual') return (price / 6).toFixed(2);
    if (plan.interval === 'quarterly') return (price / 3).toFixed(2);
    return null;
  }, [plan.price, plan.interval]);

  const cycleLabels: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    yearly: 'Anual',
  };

  const intervalLabels: Record<string, string> = {
    yearly: 'ano',
    semiannual: 'semestre',
    quarterly: 'trimestre',
    monthly: 'mês',
  };

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden border",
        isRecommended
          ? "border-primary/60 shadow-xl shadow-primary/15 bg-gradient-to-b from-primary/[0.07] via-background to-background ring-1 ring-primary/20"
          : "border-border/50 bg-background/60 backdrop-blur-sm hover:shadow-lg hover:border-border/80",
        isCurrentPlan && "ring-2 ring-primary/30"
      )}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground text-[10px] font-bold uppercase tracking-widest text-center py-1">
          <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" />
          Recomendado
        </div>
      )}

      {/* Trial badge */}
      {plan.trialDays > 0 && (
        <div className={cn(
          "absolute top-5 right-[-32px] rotate-45 bg-blue-600 text-white text-[10px] font-extrabold py-0.5 w-[110px] text-center shadow-md z-20",
          isRecommended && "top-8"
        )}>
          {plan.trialDays} DIAS GRÁTIS
        </div>
      )}

      {/* Header */}
      <div className={cn("px-5 pt-5 pb-3 text-center", isRecommended && "pt-8")}>
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description}</p>

        {/* Cycle toggle */}
        {availableCycles.length > 1 && (
          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center p-0.5 bg-muted/70 rounded-full border border-border/40">
              {availableCycles.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-300",
                    cycle === c
                      ? c === 'yearly'
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setCycle(c)}
                >
                  {cycleLabels[c] || c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="mt-3">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-sm text-muted-foreground font-medium">R$</span>
            <span className="text-3xl font-extrabold text-foreground tracking-tight">{Number(plan.price).toFixed(2).replace('.', ',')}</span>
            <span className="text-xs text-muted-foreground font-medium">/{intervalLabels[plan.interval] || 'mês'}</span>
          </div>
          {monthlyEquivalent && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              equivale a <span className="font-semibold text-foreground/80">R$ {monthlyEquivalent.replace('.', ',')}</span>/mês
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-border/40" />

      {/* Features */}
      <div className="flex-1 px-5 py-3">
        <ul className="space-y-1.5 text-[13px]">
          {/* Core limits */}
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground">Até <strong>{plan.maxUsers}</strong> Usuários / Filial</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground">Até <strong>{plan.maxTenants}</strong> {plan.maxTenants === 1 ? 'Consultório ou Clínica' : 'Consultórios ou Clínicas'}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground"><strong>{plan.includedChats}</strong> Chats de IA / mês</span>
          </li>
          <li className="flex items-center gap-2 opacity-70">
            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">R$ {Number(plan.extraChatPrice).toFixed(2).replace('.', ',')} por chat extra</span>
          </li>

          {/* Plan features */}
          {visibleFeatures.map((f: any, i: number) => {
            const isObj = typeof f === 'object' && f !== null;
            const text = isObj ? f.name : f;
            const included = isObj ? f.included : true;

            return (
              <li key={i} className={cn("flex items-center gap-2", !included && "opacity-40")}>
                {included ? (
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500/50 shrink-0" />
                )}
                <span className={cn("truncate", included ? "text-foreground" : "text-muted-foreground line-through")}>{text}</span>
              </li>
            );
          })}
        </ul>

        {/* Expand/collapse features */}
        {hasMoreFeatures && (
          <button
            className="flex items-center gap-1 text-[11px] text-primary font-medium mt-2 hover:underline mx-auto"
            onClick={() => setShowAllFeatures(!showAllFeatures)}
          >
            {showAllFeatures ? (
              <><ChevronUp className="w-3 h-3" /> Menos detalhes</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> +{allFeatures.length - 4} funcionalidades</>
            )}
          </button>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        {isCurrentPlan ? (
          <Button
            className="w-full text-sm py-2.5 font-semibold bg-muted text-muted-foreground hover:bg-muted cursor-default border border-dashed border-border"
            disabled
          >
            Plano Atual
          </Button>
        ) : (
          <Button
            className={cn(
              "w-full text-sm py-2.5 font-semibold transition-all duration-300",
              isRecommended
                ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 hover:shadow-primary/40"
                : "shadow-sm hover:shadow-md"
            )}
            onClick={() => onSubscribe(plan.id)}
          >
            Assinar {plan.name}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Active Subscription Bar ────────────────────────────────────
function ActiveSubscriptionBar({ activeSub, trialDaysRemaining }: { activeSub: any; trialDaysRemaining: number | null }) {
  if (!activeSub) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/[0.06] to-transparent px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Plano: {activeSub.plan?.name}</span>
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
              activeSub.status === 'ACTIVE'
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", activeSub.status === 'ACTIVE' ? "bg-green-500" : "bg-yellow-500")} />
              {activeSub.status}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {activeSub.plan?.maxTenants} Filiais • {activeSub.plan?.includedChats} Chats IA/mês • R$ {Number(activeSub.plan?.price).toFixed(2).replace('.', ',')}/{activeSub.plan?.interval === 'yearly' ? 'ano' : 'mês'}
          </p>
        </div>
      </div>
      {trialDaysRemaining !== null && (
        <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 font-semibold px-3 py-1.5 rounded-full text-xs border border-blue-500/20">
          <Clock className="w-3.5 h-3.5" />
          Trial: {trialDaysRemaining} dias restantes
        </div>
      )}
    </div>
  );
}

// ─── Pending Invoices Section ───────────────────────────────────
function PendingInvoicesSection({ pendingInvoices, activeSub }: { pendingInvoices: any[]; activeSub: any }) {
  if (!pendingInvoices || pendingInvoices.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/[0.04] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-red-500" />
        <span className="font-bold text-sm text-red-500">Faturas Pendentes</span>
      </div>
      <div className="space-y-2">
        {pendingInvoices.map((inv) => (
          <div key={inv.id} className="flex flex-col sm:flex-row justify-between sm:items-center rounded-lg border border-border/50 bg-background p-3 gap-2">
            <div>
              <p className="font-semibold text-sm">
                {inv.type === 'SUBSCRIPTION' ? 'Renovação do Plano' : `Uso excedente ${inv.month}/${inv.year}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {inv.type === 'SUBSCRIPTION'
                  ? 'Pagamento via PIX/Boleto'
                  : `${inv.extraChats} chats × R$ ${Number(activeSub?.plan?.extraChatPrice || 0).toFixed(2)}`}
              </p>
              {inv.dueDate && (
                <p className="text-[11px] font-semibold text-red-500 mt-0.5">Venc: {new Date(inv.dueDate).toLocaleDateString()}</p>
              )}
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <span className="font-extrabold text-lg">R$ {Number(inv.totalAmount).toFixed(2).replace('.', ',')}</span>
              <Button size="sm" variant="destructive" className="text-xs shadow-sm" onClick={() => window.open(inv.paymentUrl || '#', '_blank')}>
                Pagar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", document: "", phone: "", method: "CREDIT_CARD" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const load = async () => {
        try {
          const token = (session?.user as any)?.accessToken;
          const tenantId = (session?.user as any)?.tenantId;

          // Load Sub
          const subRes = await fetch(getBackendUrl('/api/admin/billing/status'), {
            headers: { 'Authorization': `Bearer ${token}`, 'tenant-id': tenantId }
          });
          const subData = await subRes.json();
          if (subData.success) {
            setActiveSub(subData.data.subscription);
            setPendingInvoices(subData.data.invoices || []);
          }

          // Load Plans
          const plansRes = await fetch(getBackendUrl('/api/admin/plans'), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const plansData = await plansRes.json();
          if (plansData.success) setPlans(plansData.data);

          // Set Initial Form Values
          setForm(prev => ({
            ...prev,
            name: (session?.user as any)?.name || "",
            email: (session?.user as any)?.email || ""
          }));

        } catch (error) {
          toast.error("Erro ao carregar dados de faturamento.");
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [status, router, session]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
      const token = (session?.user as any)?.accessToken;
      const tenantId = (session?.user as any)?.tenantId;

      const res = await fetch(getBackendUrl('/api/saas/checkout'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          planId: selectedPlanId
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        toast.error(data.error || "Erro ao realizar assinatura.");
      }
    } catch (e) {
      toast.error("Falha ao processar assinatura.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Group plans by name
  const groupedPlans = useMemo(() => {
    const groups: Record<string, Record<string, any>> = {};
    plans.forEach(p => {
      if (!groups[p.name]) groups[p.name] = {};
      groups[p.name][p.interval] = p;
    });
    return groups;
  }, [plans]);

  // Determine which plan to recommend (highest price or second plan)
  const planNames = Object.keys(groupedPlans);
  const recommendedPlanName = planNames.length > 1 ? planNames[1] : planNames[0];

  const getTrialRemainingDays = () => {
    if (!activeSub || !activeSub.trialEnd) return null;
    const now = new Date();
    const trialEnd = new Date(activeSub.trialEnd);
    if (trialEnd > now) {
      const diffTime = Math.abs(trialEnd.getTime() - now.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
  };

  const trialDaysRemaining = getTrialRemainingDays();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-6xl mx-auto min-h-0">
      {/* Header — compact */}
      <div className="text-center space-y-1 shrink-0">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Planos que acompanham seu crescimento
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie sua assinatura e escale suas operações de IA com facilidade.
        </p>
      </div>

      {/* Active Subscription — inline bar instead of big card */}
      <ActiveSubscriptionBar activeSub={activeSub} trialDaysRemaining={trialDaysRemaining} />

      {/* Pending Invoices — compact */}
      <PendingInvoicesSection pendingInvoices={pendingInvoices} activeSub={activeSub} />

      {/* Plans or Checkout */}
      {showCheckout ? (
        <Card className="max-w-md mx-auto w-full shadow-2xl border-primary/20 animate-in fade-in zoom-in-95 duration-300 relative">
          <button onClick={() => setShowCheckout(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <XCircle className="w-5 h-5" />
          </button>
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Finalizar Pagamento</CardTitle>
            <CardDescription className="text-xs">Ambiente Seguro.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nome Completo</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">E-mail</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">CPF ou CNPJ</label>
                  <input required type="text" value={form.document} onChange={e => setForm({...form, document: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">WhatsApp</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
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
              <Button type="submit" disabled={checkoutLoading} className="w-full mt-2 font-bold py-5 rounded-xl text-[13px]">
                {checkoutLoading ? "Gerando Link..." : "Ir para Pagamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 flex flex-col justify-center min-h-0">
          <div className={cn(
            "grid gap-4 items-stretch",
            planNames.length === 1 && "max-w-sm mx-auto",
            planNames.length === 2 && "md:grid-cols-2 max-w-3xl mx-auto",
            planNames.length >= 3 && "md:grid-cols-2 lg:grid-cols-3"
          )}>
            {planNames.map(planName => (
              <PlanCardGroup
                key={planName}
                variations={groupedPlans[planName]}
                activeSub={activeSub}
                isRecommended={planName === recommendedPlanName}
                onSubscribe={(id) => {
                  setSelectedPlanId(id);
                  setShowCheckout(true);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
