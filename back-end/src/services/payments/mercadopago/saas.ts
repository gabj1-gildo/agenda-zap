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

  // Cria uma Preferência no Mercado Pago para gerar o checkout
  // Isso suporta PIX, Boleto e Cartão na tela do MP.
  // Porém o nosso roteamento vai forçar que, se o usuário escolher Cartão, vá para o Asaas.
  // Então esse link do MP será usado se o usuário escolheu PIX (abaixo do teto) ou Boleto (se ativado).

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
