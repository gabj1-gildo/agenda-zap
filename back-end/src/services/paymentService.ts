import { db } from '@/db';
import { paymentKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

import { createAsaasCheckout } from './payments/asaas';
import { createMercadoPagoCheckout } from './payments/mercadopago';
import { createAbacatePayCheckout } from './payments/abacatepay';

export type PaymentResult = {
  paymentId: string;
  checkoutUrl?: string; // Link para o Checkout Pro ou transparente
  qrCode?: string; // Mantido para compatibilidade com PIX caso necessário
  qrCodeBase64?: string;
};

export async function createCheckoutPayment(
  amount: number, 
  description: string, 
  tenantId: string,
  method: string = 'PIX'
): Promise<PaymentResult> {
  // Pega a chave ativa
  const activeKey = await db.query.paymentKeys.findFirst({
    where: and(eq(paymentKeys.tenantId, tenantId), eq(paymentKeys.isActive, true))
  });

  if (!activeKey) {
    throw new Error('Nenhuma chave de pagamento ativa encontrada para o lojista.');
  }

  // Obter tempo de expiração
  const pixExpirationTime = activeKey.pixExpirationTime || '00:30';
  const [hours, minutes] = pixExpirationTime.split(':').map(Number);
  const totalMinutes = (hours * 60) + minutes;
  const expirationDate = new Date(Date.now() + totalMinutes * 60000);

  if (activeKey.gateway === 'MERCADOPAGO') {
    return await createMercadoPagoCheckout(amount, description, activeKey.token, expirationDate, method);
  } else if (activeKey.gateway === 'ABACATEPAY') {
    return await createAbacatePayCheckout(amount, description, activeKey.token, expirationDate, method);
  } else if (activeKey.gateway === 'ASAAS') {
    return await createAsaasCheckout(amount, description, activeKey.token, expirationDate, method);
  } else {
    throw new Error('Gateway de pagamento não suportado.');
  }
}
