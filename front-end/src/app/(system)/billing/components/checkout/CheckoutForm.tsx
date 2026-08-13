import { XCircle, Lock, CreditCard, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { initMercadoPago } from "@mercadopago/sdk-react";

import { checkoutSchema, type CheckoutFormValues } from "../../schemas/checkout.schema";
import type { Plan } from "../../types/billing";

import { PersonalDataSection } from "./PersonalDataSection";
import { PaymentMethodSection } from "./PaymentMethodSection";
import { CreditCardSection } from "./CreditCardSection";
import { AddressSection } from "./AddressSection";
import { OTPSection } from "./OTPSection";

interface CheckoutFormProps {
  loading: boolean;
  plan: Plan | null;
  onClose: () => void;
  onSubmit: (data: CheckoutFormValues & { creditCardToken?: string; creditCardHolderInfo?: any }) => void;
}

export function CheckoutForm({ loading, plan, onClose, onSubmit }: CheckoutFormProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpLoading, setOtpLoading] = useState(false);
  const [creditCardToken, setCreditCardToken] = useState("");

  const isMonthly = plan?.interval === "monthly";

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
      initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
    }
  }, []);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      email: "",
      document: "",
      phone: "",
      method: "CREDIT_CARD",
      cardNumber: "",
      cardHolderName: "",
      cardExpiry: "",
      cardCvv: "",
      otpCode: "",
      installments: 1,
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
    }
  });

  const { handleSubmit, reset, watch, getValues } = form;
  const selectedMethod = watch("method");

  useEffect(() => {
    if (session?.user) {
      reset({
        name: (session.user as any)?.name || "",
        email: (session.user as any)?.email || "",
        document: "",
        phone: "",
        method: "CREDIT_CARD",
        installments: 1,
      });
    }
  }, [session, reset]);

  const handleFormSubmit = async (data: CheckoutFormValues) => {
    if (data.method === 'PIX' || data.method === 'BOLETO') {
      onSubmit(data);
    } else {
      if (!isMonthly && (!data.cep || !data.number)) {
        toast.error("Preencha o endereço de cobrança completo.");
        return;
      }

      if (step === 'form') {
        setOtpLoading(true);
        try {
          let token = "";
          if (isMonthly) {
            // @ts-ignore
            const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
            const cleanCard = data.cardNumber?.replace(/\D/g, "");
            const [mm, yy] = (data.cardExpiry || "").split("/");
            const cleanYear = yy && yy.length === 2 ? `20${yy}` : yy;
            const doc = data.document.replace(/\D/g, "");
            
            const tokenPayload = {
              cardNumber: cleanCard,
              cardholderName: data.cardHolderName,
              cardExpirationMonth: mm,
              cardExpirationYear: cleanYear,
              securityCode: data.cardCvv,
              identificationType: doc.length > 11 ? "CNPJ" : "CPF",
              identificationNumber: doc
            };

            const tokenResponse = await mp.createCardToken(tokenPayload);
            if (tokenResponse.error) {
              console.error("MP Token Error", tokenResponse.error);
              toast.error("Falha ao validar o cartão no Mercado Pago.");
              setOtpLoading(false);
              return;
            }
            token = tokenResponse.id;
            setCreditCardToken(token);
          }

          const res = await fetch(getBackendUrl('/api/saas/otp'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: data.phone, name: data.name })
          });
          const result = await res.json();
          if (result.success) {
            toast.success("Código enviado para o seu WhatsApp!");
            setStep('otp');
          } else {
            toast.error(result.error || "Falha ao enviar código");
          }
        } catch (e: any) {
          toast.error("Erro interno ao solicitar OTP");
        } finally {
          setOtpLoading(false);
        }
      } else {
        if (!data.otpCode || data.otpCode.length < 6) {
          toast.error("Por favor, digite o código de 6 dígitos.");
          return;
        }

        const payload: any = { ...data };
        if (isMonthly) {
          payload.creditCardToken = creditCardToken;
        } else {
          payload.creditCardHolderInfo = {
            name: data.name, email: data.email,
            cpfCnpj: data.document.replace(/\D/g, ""),
            postalCode: (data.cep || "").replace(/\D/g, ""),
            addressNumber: data.number,
            phone: data.phone.replace(/\D/g, ""),
          };
          payload.creditCard = {
            holderName: data.cardHolderName,
            number: (data.cardNumber || "").replace(/\D/g, ""),
            expiryMonth: (data.cardExpiry || "").split("/")[0],
            expiryYear: `20${(data.cardExpiry || "").split("/")[1]}`,
            ccv: data.cardCvv,
          };
        }

        onSubmit(payload);
      }
    }
  };

  return (
    <Card className="max-w-md mx-auto w-full shadow-2xl border-primary/20 animate-in fade-in zoom-in-95 duration-300 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
        <XCircle className="w-5 h-5" />
      </button>
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          {step === 'otp' ? <Lock className="w-6 h-6 text-primary" /> : <CreditCard className="w-6 h-6 text-primary" />}
        </div>
        <CardTitle className="text-xl">
          {step === 'otp' ? 'Verificação de Segurança' : 'Finalizar Pagamento'}
        </CardTitle>
        <CardDescription className="text-xs">
          {step === 'otp' 
            ? 'Digite o código enviado no seu WhatsApp para confirmar a transação.' 
            : 'Ambiente Seguro.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          
          {step === 'form' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 h-96 overflow-y-auto pr-2 pb-2 scrollbar-thin">
              <PersonalDataSection form={form} />
              <PaymentMethodSection form={form} />

              {selectedMethod === 'CREDIT_CARD' && (
                <div className="space-y-4 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2">
                  <CreditCardSection form={form} plan={plan} isMonthly={isMonthly} />
                  {!isMonthly && <AddressSection form={form} />}
                </div>
              )}
            </div>
          )}

          {step === 'otp' && (
            <OTPSection form={form} onBack={() => setStep('form')} />
          )}
          
          <Button type="submit" disabled={loading || otpLoading} className="w-full mt-2 font-bold py-5 rounded-xl text-[13px] group">
            {loading || otpLoading ? (
              "Processando..."
            ) : step === 'otp' ? (
              "Confirmar e Pagar"
            ) : selectedMethod === 'CREDIT_CARD' ? (
              <span className="flex items-center">Avançar para Verificação <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
            ) : (
              `Gerar ${selectedMethod === 'PIX' ? 'PIX' : 'Boleto'}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
