import type { BillingInterval, Plan, GroupedPlans } from "../types/billing";

/**
 * Replica `Number(x).toFixed(2).replace('.', ',')`
 */
export function formatMoney(value: number | string): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return '0,00';
  return numericValue.toFixed(2).replace('.', ',');
}

/**
 * Calcula o equivalente mensal para ciclos maiores.
 */
export function calculateMonthlyEquivalent(price: number | string, interval: BillingInterval): string | null {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return null;

  if (interval === 'yearly') return (numericPrice / 12).toFixed(2);
  if (interval === 'semiannual') return (numericPrice / 6).toFixed(2);
  if (interval === 'quarterly') return (numericPrice / 3).toFixed(2);
  return null;
}

/**
 * Calcula quantos dias faltam para o fim do trial.
 */
export function calculateTrialRemainingDays(trialEnd: string | null): number | null {
  if (!trialEnd) return null;
  const now = new Date();
  const endDate = new Date(trialEnd);
  
  // Limpar a hora para comparar apenas a data (opcional, dependendo de como a API envia)
  if (endDate > now) {
    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
}

/**
 * Dicionários de labels para ciclos e intervalos.
 */
export const cycleLabels: Record<string, string> = {
  monthly: 'Mensal',
  mensal: 'Mensal',
  quarterly: 'Trimestral',
  trimestral: 'Trimestral',
  semiannual: 'Semestral',
  semestral: 'Semestral',
  yearly: 'Anual',
  anual: 'Anual',
};

export const intervalLabels: Record<string, string> = {
  yearly: 'ano',
  anual: 'ano',
  semiannual: 'semestre',
  semestral: 'semestre',
  quarterly: 'trimestre',
  trimestral: 'trimestre',
  monthly: 'mês',
  mensal: 'mês',
};

export function formatInterval(interval: BillingInterval | string): string {
  if (!interval) return 'mês';
  return intervalLabels[interval.toLowerCase()] || 'mês';
}

/**
 * Agrupa planos pelo nome.
 * LIMITAÇÃO: agrupamento por nome é frágil (colisão de nomes, i18n). 
 * Backend deveria fornecer um groupId estável.
 */
export function groupPlans(plans: Plan[]): GroupedPlans {
  const groups: GroupedPlans = {};
  plans.forEach(p => {
    if (!groups[p.name]) groups[p.name] = {};
    groups[p.name][p.interval] = p;
  });
  return groups;
}

/**
 * Verifica se a mudança para o `targetPlan` a partir do `currentPlan` é um upgrade.
 * LIMITAÇÃO: comparação por preço não reflete necessariamente "mais recursos". 
 * Backend deveria expor plan.level/priority.
 */
export function isUpgrade(currentPlan: Plan | null, targetPlan: Plan): boolean {
  if (!currentPlan) return true; // Se não tem plano, assinar qualquer um é "upgrade"
  
  const getMonthlyPrice = (p: Plan) => {
    const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
    if (isNaN(price)) return 0;
    if (p.interval === 'yearly') return price / 12;
    if (p.interval === 'semiannual') return price / 6;
    if (p.interval === 'quarterly') return price / 3;
    return price;
  };

  const currentPrice = getMonthlyPrice(currentPlan);
  const targetPrice = getMonthlyPrice(targetPlan);
  
  // Se o valor mensal for o mesmo, vamos comparar o total anual para não dizer que é downgrade
  if (targetPrice === currentPrice) {
    const getRaw = (p: Plan) => typeof p.price === 'string' ? parseFloat(p.price) : p.price;
    return getRaw(targetPlan) >= getRaw(currentPlan);
  }

  return targetPrice >= currentPrice;
}

/**
 * Retorna a chave do plano recomendado do grupo de planos.
 * LIMITAÇÃO: "segundo nome da lista, ou o primeiro se só houver um". 
 * Backend deveria fornecer uma flag plan.recommended explícita.
 */
export function getRecommendedPlanKey(groupedPlans: GroupedPlans): string {
  const planNames = Object.keys(groupedPlans);
  return planNames.length > 1 ? planNames[1] : planNames[0];
}
