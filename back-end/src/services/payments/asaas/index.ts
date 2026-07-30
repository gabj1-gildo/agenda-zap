import { createAsaasPixLink } from './pix';
import { createAsaasCreditCardLink } from './creditCard';
import { createAsaasBoletoLink } from './bankSlip';

export async function createAsaasCheckout(
  amount: number, 
  description: string, 
  token: string, 
  expirationDate: Date,
  method: string // 'PIX', 'CREDIT_CARD', 'BOLETO'
) {
  if (method === 'PIX') {
    return await createAsaasPixLink(amount, description, token, expirationDate);
  }
  if (method === 'CREDIT_CARD') {
    return await createAsaasCreditCardLink(amount, description, token, expirationDate);
  }
  if (method === 'BOLETO') {
    return await createAsaasBoletoLink(amount, description, token, expirationDate);
  }
  throw new Error(`Método de pagamento Asaas não suportado: ${method}`);
}
