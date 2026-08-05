import { env } from '@/config/env';

export async function createMercadoPagoSaasPreference(
  email: string,
  name: string,
  cpfCnpj: string,
  amount: number,
  description: string,
  externalReference: string
) {
  const token = env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurada globalmente');

  const payload = {
    items: [
      {
        title: description,
        quantity: 1,
        unit_price: amount,
        currency_id: 'BRL'
      }
    ],
    payer: {
      name,
      email,
      identification: {
        type: cpfCnpj.length > 11 ? 'CNPJ' : 'CPF',
        number: cpfCnpj
      }
    },
    external_reference: externalReference,
    back_urls: {
      success: env.FRONTEND_URL + '/billing?status=success',
      failure: env.FRONTEND_URL + '/billing?status=failure',
      pending: env.FRONTEND_URL + '/billing?status=pending'
    },
    auto_return: 'approved'
  };

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.error || !data.init_point) {
    console.error('Erro MP Preference:', data);
    throw new Error('Falha ao gerar link de pagamento no Mercado Pago');
  }

  return { preferenceId: data.id, initPoint: data.init_point };
}

export async function createMercadoPagoPixPayment(
  email: string,
  firstName: string,
  lastName: string,
  cpfCnpj: string,
  amount: number,
  description: string,
  externalReference: string
) {
  const token = env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurada globalmente');

  const payload = {
    transaction_amount: amount,
    description: description,
    payment_method_id: 'pix',
    payer: {
      email,
      first_name: firstName,
      last_name: lastName,
      identification: {
        type: cpfCnpj.length > 11 ? 'CNPJ' : 'CPF',
        number: cpfCnpj
      }
    },
    external_reference: externalReference,
  };

  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Idempotency-Key': externalReference // Evitar duplicidade de PIX
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  
  if (data.error || !data.point_of_interaction) {
    console.error('Erro MP Pix:', data);
    throw new Error('Falha ao gerar PIX no Mercado Pago');
  }

  return {
    paymentId: data.id,
    qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
    qrCodeString: data.point_of_interaction.transaction_data.qr_code
  };
}

export async function createMercadoPagoSaasSubscription(
  email: string,
  cardTokenId: string,
  preapprovalPlanId: string,
  externalReference: string
) {
  const token = env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurada globalmente');

  const payload = {
    preapproval_plan_id: preapprovalPlanId,
    payer_email: email,
    card_token_id: cardTokenId,
    external_reference: externalReference,
    status: "authorized"
  };

  const res = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  
  if (data.error || !data.id) {
    console.error('Erro MP Subscription:', data);
    throw new Error(data.message || 'Falha ao criar assinatura no Mercado Pago');
  }

  return {
    subscriptionId: data.id,
    status: data.status,
  };
}
