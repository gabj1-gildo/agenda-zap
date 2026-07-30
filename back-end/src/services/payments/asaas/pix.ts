import { env } from '@/config/env';

export async function createAsaasPixLink(amount: number, description: string, token: string, expirationDate: Date) {
  // Asaas Link de Pagamento (restrito a PIX)
  const response = await fetch('https://api.asaas.com/v3/paymentLinks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': token
    },
    body: JSON.stringify({
      name: description,
      billingType: 'PIX',
      chargeType: 'DETACHED',
      value: amount,
      dueDateLimitDays: 1 // Limite em dias para o vencimento
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Erro Asaas PIX Link:", data);
    throw new Error("Falha ao gerar link PIX no Asaas");
  }

  return {
    paymentId: data.id,
    checkoutUrl: data.url
  };
}
