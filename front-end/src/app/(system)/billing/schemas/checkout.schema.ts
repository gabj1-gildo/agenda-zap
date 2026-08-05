import { z } from "zod";

function isValidCpfOrCnpj(val: string): boolean {
  const digits = val.replace(/\D/g, '');
  return digits.length === 11 || digits.length === 14;
}

export const checkoutSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo"),
  email: z.string().email("E-mail inválido"),
  document: z.string().refine(isValidCpfOrCnpj, "CPF ou CNPJ inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  method: z.enum(['CREDIT_CARD', 'PIX', 'BOLETO']),
  
  // Card
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  
  // Address (For Asaas / Non-monthly)
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  
  // Installments
  installments: z.number().optional(),

  otpCode: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.method === 'CREDIT_CARD') {
    if (!data.cardNumber || data.cardNumber.replace(/\D/g, '').length < 13) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número do cartão inválido", path: ["cardNumber"] });
    }
    if (!data.cardHolderName || data.cardHolderName.trim().length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nome do titular inválido", path: ["cardHolderName"] });
    }
    if (!data.cardExpiry || !/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(data.cardExpiry)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Validade inválida (MM/AA)", path: ["cardExpiry"] });
    }
    if (!data.cardCvv || data.cardCvv.length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CVV inválido", path: ["cardCvv"] });
    }
  }
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
