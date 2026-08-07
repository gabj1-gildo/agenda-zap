import { db } from '@/db';
import { tenantPlans, paymentKeys, clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function generateCheckoutLink(tenantId: string, planId: string, clientId: string): Promise<string> {
  try {
    // 1. Buscar o plano
    const plan = await db.query.tenantPlans.findFirst({
      where: and(eq(tenantPlans.id, planId), eq(tenantPlans.tenantId, tenantId))
    });

    if (!plan) return "Erro: Plano não encontrado.";

    // 2. Buscar a chave de pagamento ativa
    const activeKey = await db.query.paymentKeys.findFirst({
      where: and(eq(paymentKeys.tenantId, tenantId), eq(paymentKeys.isActive, true))
    });

    if (!activeKey) return "Erro: A empresa não possui um gateway de pagamento ativo configurado.";

    // 3. Buscar o cliente para preencher dados no gateway
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId)
    });

    // Simulando a geração do link de acordo com o Gateway
    // Numa implementação real para produção, chamaríamos a API do MercadoPago (Preferences) ou Asaas (Payments) aqui.
    const price = Number(plan.price);
    let checkoutUrl = '';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (activeKey.gateway === 'MERCADOPAGO') {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeKey.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: [
            {
              id: plan.id,
              title: plan.name,
              quantity: 1,
              unit_price: price
            }
          ],
          payer: {
            name: client?.name || 'Cliente',
          },
          metadata: {
            client_id: client?.id,
            tenant_id: tenantId,
            plan_id: plan.id,
            type: 'PLAN_SUBSCRIPTION'
          },
          back_urls: {
            success: `${appUrl}/success`,
            failure: `${appUrl}/failure`,
            pending: `${appUrl}/pending`
          },
          notification_url: `${appUrl}/api/webhooks/mercadopago?tenantId=${tenantId}`,
          auto_return: "approved"
        })
      });
      const data = await response.json();
      if (data.init_point) {
        checkoutUrl = data.init_point;
      } else {
        console.error("MercadoPago erro:", data);
        return "Erro: Falha ao gerar link Mercado Pago.";
      }
    } else if (activeKey.gateway === 'ASAAS') {
      const isSandbox = activeKey.token.startsWith('$aact_YTU5YTE0M2M2N'); // prefixo sandbox asaas
      const baseUrl = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
      
      const response = await fetch(`${baseUrl}/paymentLinks`, {
        method: "POST",
        headers: {
          "access_token": activeKey.token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: `Plano: ${plan.name}`,
          description: `Assinatura do plano ${plan.name}`,
          chargeType: "DETACHED",
          value: price,
          dueDateLimitDays: 2,
          maxInstallmentCount: plan.maxInstallments || 1
        })
      });
      const data = await response.json();
      if (data.url) {
        checkoutUrl = data.url;
      } else {
        console.error("Asaas erro:", data);
        return "Erro: Falha ao gerar link Asaas.";
      }
    } else {
      return "Erro: Gateway não suportado para geração automática.";
    }

    return checkoutUrl;

  } catch (e) {
    console.error("Erro ao gerar link de pagamento:", e);
    return "Erro ao processar o link de pagamento. Tente novamente mais tarde.";
  }
}
