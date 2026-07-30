"use client";

import { Payment } from '@mercadopago/sdk-react';

interface PaymentBrickProps {
  amount: number;
  interval: 'monthly' | 'quarterly' | 'semiannual' | 'yearly';
  onPaymentSuccess: (formData: any) => Promise<void>;
  onCancel: () => void;
}

export function PaymentBrick({ amount, interval, onPaymentSuccess, onCancel }: PaymentBrickProps) {
  
  // Rule: Monthly -> PIX + Card. Others -> PIX + Boleto + Card
  const paymentMethods: any = {
    bankTransfer: 'all',
    creditCard: 'all',
    maxInstallments: 1
  };
  
  if (interval !== 'monthly') {
    paymentMethods.ticket = 'all';
  }

  return (
    <div className="w-full">
      <Payment
        initialization={{ amount }}
        onSubmit={async (param) => {
          // param = { formData: { token, payment_method_id, payer, ... }, additionalData }
          // Send full param so backend can normalize the structure
          await onPaymentSuccess(param);
        }}
        locale="pt-BR"
        customization={{
          paymentMethods,
          visual: {
            style: {
              theme: 'default',
            }
          }
        }}
      />
      <button 
        className="w-full mt-4 py-2 border rounded-md text-sm font-medium hover:bg-muted"
        onClick={onCancel}
      >
        Cancelar
      </button>
    </div>
  );
}
