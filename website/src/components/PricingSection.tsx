"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "./FadeIn";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number | string;
  interval: string;
  maxUsers: number;
  maxTenants: number;
  includedChats: number;
  features: Array<string | { name: string; included: boolean }>;
}

type Interval = "monthly" | "semiannual" | "yearly";

const INTERVALS: { value: Interval; label: string; badge?: string }[] = [
  { value: "monthly",    label: "Mensal" },
  { value: "semiannual", label: "Semestral", badge: "−10%" },
  { value: "yearly",     label: "Anual",     badge: "−20%" },
];

const INTERVAL_LABELS: Record<string, string> = {
  yearly:     "ano",
  semiannual: "semestre",
  monthly:    "mês",
};

interface PlanCardProps {
  planVariations: Record<string, Plan>;
  isRecommended: boolean;
  onSelectPlan: (plan: Plan) => void;
}

function PlanCard({ planVariations, isRecommended, onSelectPlan }: PlanCardProps) {
  const [interval, setInterval] = useState<Interval>("monthly");

  const plan =
    planVariations[interval] ||
    planVariations["monthly"] ||
    (Object.values(planVariations)[0] as Plan);

  if (!plan) return null;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-300 ${
        isRecommended
          ? "border-primary/40 bg-card shadow-lg ring-1 ring-primary/10"
          : "border-border bg-card hover:border-primary/20 hover:shadow-md"
      }`}
      style={isRecommended ? { boxShadow: "0 8px 40px var(--glow-primary)" } : undefined}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-3.5 left-6 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
          <Sparkles className="w-3 h-3" /> Mais popular
        </div>
      )}

      {/* Header */}
      <h3 className="font-display font-semibold text-lg text-foreground">{plan.name}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 min-h-[2.5rem] leading-relaxed">
        {plan.description}
      </p>

      {/* Per-plan interval toggle */}
      <div className="mt-5 mb-5 flex p-1 rounded-xl bg-muted gap-0.5">
        {INTERVALS.map(({ value, label, badge }) => {
          const available = !!planVariations[value];
          if (!available) return null;
          return (
            <button
              key={value}
              onClick={() => setInterval(value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                interval === value
                  ? "bg-card text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-end gap-1.5">
          <span className="font-display font-extrabold text-4xl tracking-tight text-foreground">
            R$ {Number(plan.price).toFixed(2).replace(".", ",")}
          </span>
          <span className="text-muted-foreground text-sm mb-1.5 font-medium">
            /{INTERVAL_LABELS[plan.interval] ?? "mês"}
          </span>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-7 flex-1">
        <li className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="text-sm">Até <strong>{plan.maxUsers}</strong> usuários</span>
        </li>
        <li className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="text-sm">Até <strong>{plan.maxTenants}</strong> filiais</span>
        </li>
        <li className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="text-sm"><strong>{plan.includedChats}</strong> chats com IA/mês</span>
        </li>
        {plan.features?.map((f: any, i: number) => {
          const isObj = typeof f === "object" && f !== null;
          const text = isObj ? f.name : f;
          const included = isObj ? f.included : true;
          return (
            <li key={i} className={`flex items-start gap-2.5 ${!included ? "opacity-40" : ""}`}>
              {included ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${!included ? "line-through" : ""}`}>{text}</span>
            </li>
          );
        })}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onSelectPlan(plan)}
        id={`plan-cta-${plan.name.toLowerCase().replace(/\s/g, "-")}`}
        className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
          isRecommended
            ? "btn-primary"
            : "btn-secondary"
        }`}
      >
        Assinar {plan.name} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface PricingSectionProps {
  plans: Plan[];
  loading: boolean;
  onSelectPlan: (plan: Plan) => void;
}

export function PricingSection({ plans, loading, onSelectPlan }: PricingSectionProps) {
  // Group plans by name
  const grouped: Record<string, Record<string, Plan>> = {};
  plans.forEach((p) => {
    if (!grouped[p.name]) grouped[p.name] = {};
    grouped[p.name][p.interval] = p;
  });
  const planNames = Object.keys(grouped).sort((a, b) => {
    const planA = grouped[a].monthly || Object.values(grouped[a])[0];
    const planB = grouped[b].monthly || Object.values(grouped[b])[0];
    return Number(planA.price) - Number(planB.price);
  });

  return (
    <section id="planos" className="w-full py-24 px-6 bg-muted/40">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="max-w-xl mb-12">
            <p className="section-label">Planos</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-snug text-foreground">
              Preço transparente.{" "}
              <span className="text-muted-foreground">Sem taxas surpresas.</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Escolha o período de cobrança individualmente em cada plano. Cancele quando quiser.
            </p>
          </div>
        </FadeIn>

        {loading ? (
          <div className="flex justify-center p-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start" staggerDelay={0.12}>
            {planNames.map((name) => {
              const variations = grouped[name];
              const isRecommended =
                (name.toLowerCase().includes("pro")) ||
                (planNames.length > 1 &&
                  name === planNames[1] &&
                  !planNames.some((n) => n.toLowerCase().includes("pro")));
              return (
                <StaggerItem key={name}>
                  <PlanCard
                    planVariations={variations}
                    isRecommended={isRecommended}
                    onSelectPlan={onSelectPlan}
                  />
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}
