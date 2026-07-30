"use client";

import { CardPayment } from '@mercadopago/sdk-react';

interface CreditCardProps {
  amount: number;
  onPaymentSuccess: (token: string, payerEmail: string) => Promise<void>;
  onCancel: () => void;
}

export function CreditCard({ amount, onPaymentSuccess, onCancel }: CreditCardProps) {
  return (
    <div className="w-full">
      <CardPayment
        initialization={{ amount }}
        onSubmit={async (param) => {
          const { token, payer } = param;
          await onPaymentSuccess(token || '', payer?.email || '');
        }}
        locale="pt-BR"
        customization={{
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
