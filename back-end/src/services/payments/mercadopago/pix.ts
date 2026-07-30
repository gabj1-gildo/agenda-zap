import { env } from '@/config/env';

export async function createMercadoPagoPixLink(amount: number, description: string, token: string, expirationDate: Date) {
  const response = await fetch(`${env.MERCADOPAGO_API_URL}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: description,
          unit_price: amount,
          quantity: 1,
        }
      ],
      payment_methods: {
        excluded_payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
          { id: "ticket" }
        ],
      },
      back_urls: {
        success: env.FRONTEND_URL ? `${env.FRONTEND_URL}/sucesso` : env.MP_SUCCESS_URL,
        failure: env.FRONTEND_URL ? `${env.FRONTEND_URL}/falha` : env.MP_FAILURE_URL,
        pending: env.FRONTEND_URL ? `${env.FRONTEND_URL}/sucesso` : env.MP_SUCCESS_URL
      },
      auto_return: "approved",
      expires: true,
      expiration_date_to: expirationDate.toISOString()
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Erro no Mercado Pago PIX:", data);
    throw new Error("Falha ao gerar checkout PIX no Mercado Pago.");
  }

  return {
    paymentId: data.id,
    checkoutUrl: data.init_point
  };
}
