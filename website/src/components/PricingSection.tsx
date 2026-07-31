"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";

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
      className={`relative flex flex-col rounded-xl border p-7 transition-all duration-200 ${
        isRecommended
          ? "border-primary/40 bg-white shadow-lg shadow-primary/8"
          : "border-border bg-white hover:border-primary/20 hover:shadow-sm"
      }`}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-3.5 left-6 bg-primary text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Sparkles className="w-2.5 h-2.5" /> Mais popular
        </div>
      )}

      {/* Header */}
      <h3 className="font-semibold text-base text-foreground">{plan.name}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 min-h-[2.5rem] leading-relaxed">
        {plan.description}
      </p>

      {/* Per-plan interval toggle */}
      <div className="mt-5 mb-5 flex p-1 rounded-lg bg-muted gap-0.5">
        {INTERVALS.map(({ value, label, badge }) => {
          const available = !!planVariations[value];
          if (!available) return null;
          return (
            <button
              key={value}
              onClick={() => setInterval(value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                interval === value
                  ? "bg-white text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {badge && (
                <span
                  className={`text-[9px] px-1 py-0.5 rounded font-semibold ${
                    interval === value
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="font-display font-bold text-3xl tracking-tight text-foreground">
            R$ {Number(plan.price).toFixed(2).replace(".", ",")}
          </span>
          <span className="text-muted-foreground text-xs mb-1">
            /{INTERVAL_LABELS[plan.interval] ?? "mês"}
          </span>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-7 flex-1">
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
        className={`w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
          isRecommended
            ? "btn-primary"
            : "border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
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
  const planNames = Object.keys(grouped);

  return (
    <section id="planos" className="w-full py-24 px-6 bg-muted/50">
      <div className="max-w-6xl mx-auto">
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

        {loading ? (
          <div className="flex justify-center p-16">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {planNames.map((name) => {
              const variations = grouped[name];
              const isRecommended =
                (name.toLowerCase().includes("pro")) ||
                (planNames.length > 1 &&
                  name === planNames[1] &&
                  !planNames.some((n) => n.toLowerCase().includes("pro")));
              return (
                <PlanCard
                  key={name}
                  planVariations={variations}
                  isRecommended={isRecommended}
                  onSelectPlan={onSelectPlan}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
