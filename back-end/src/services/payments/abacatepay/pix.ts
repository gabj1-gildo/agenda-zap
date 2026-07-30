import AbacatePay from 'abacatepay-nodejs-sdk';
import { env } from '@/config/env';

export async function createAbacatePayPixLink(amount: number, description: string, token: string, expirationDate: Date) {
  const abacatePay = new (AbacatePay as any)(token);
  
  const billing = await abacatePay.billing.create({
    frequency: "ONE_TIME",
    methods: ["PIX"],
    products: [
      {
        name: description,
        description: "Agendamento de serviço",
        quantity: 1,
        price: Math.round(amount * 100), 
      }
    ],
    returnUrl: env.FRONTEND_URL ? `${env.FRONTEND_URL}/sucesso` : env.MP_SUCCESS_URL,
    completionUrl: env.FRONTEND_URL ? `${env.FRONTEND_URL}/sucesso` : env.MP_SUCCESS_URL,
    expireAt: expirationDate.toISOString()
  });

  return {
    paymentId: billing.id,
    checkoutUrl: billing.url
  };
}
