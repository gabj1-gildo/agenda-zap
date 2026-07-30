import { createMercadoPagoPixLink } from './pix';
import { createMercadoPagoCreditCardLink } from './creditCard';
import { createMercadoPagoBoletoLink } from './bankSlip';

export async function createMercadoPagoCheckout(
  amount: number, 
  description: string, 
  token: string, 
  expirationDate: Date,
  method: string // 'PIX', 'CREDIT_CARD', 'BOLETO'
) {
  if (method === 'PIX') {
    return await createMercadoPagoPixLink(amount, description, token, expirationDate);
  }
  if (method === 'CREDIT_CARD') {
    return await createMercadoPagoCreditCardLink(amount, description, token, expirationDate);
  }
  if (method === 'BOLETO') {
    return await createMercadoPagoBoletoLink(amount, description, token, expirationDate);
  }
  throw new Error(`Método de pagamento MercadoPago não suportado: ${method}`);
}
