import { createAbacatePayPixLink } from './pix';

export async function createAbacatePayCheckout(
  amount: number, 
  description: string, 
  token: string, 
  expirationDate: Date,
  method: string // 'PIX', 'CREDIT_CARD', 'BOLETO'
) {
  if (method === 'PIX') {
    return await createAbacatePayPixLink(amount, description, token, expirationDate);
  }
  // Se o AbacatePay futuramente suportar outros explicitamente, podemos adicionar aqui.
  // Por padrão ele aceita PIX no nosso SDK configurado.
  throw new Error(`Método de pagamento AbacatePay não suportado ou configurado para: ${method}`);
}
