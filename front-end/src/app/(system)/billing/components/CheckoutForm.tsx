import { XCircle, CreditCard, Lock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormValues } from "../schemas/checkout.schema";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";

interface CheckoutFormProps {
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: CheckoutFormValues) => void;
}

// Utils de máscara manuais
const maskPhone = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
  if (v.length > 9) v = `${v.substring(0, 9)}-${v.substring(9)}`;
  return v;
};

const maskDocument = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 14) v = v.substring(0, 14);
  if (v.length <= 11) {
    if (v.length > 3) v = `${v.substring(0, 3)}.${v.substring(3)}`;
    if (v.length > 7) v = `${v.substring(0, 7)}.${v.substring(7)}`;
    if (v.length > 11) v = `${v.substring(0, 11)}-${v.substring(11)}`;
  } else {
    if (v.length > 2) v = `${v.substring(0, 2)}.${v.substring(2)}`;
    if (v.length > 6) v = `${v.substring(0, 6)}.${v.substring(6)}`;
    if (v.length > 10) v = `${v.substring(0, 10)}/${v.substring(10)}`;
    if (v.length > 15) v = `${v.substring(0, 15)}-${v.substring(15)}`;
  }
  return v;
};

const maskCardNumber = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 16) v = v.substring(0, 16);
  v = v.replace(/(\d{4})/g, "$1 ").trim();
  return v;
};

const maskCardExpiry = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 4) v = v.substring(0, 4);
  if (v.length > 2) v = `${v.substring(0, 2)}/${v.substring(2)}`;
  return v;
};

export function CheckoutForm({ loading, onClose, onSubmit }: CheckoutFormProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpLoading, setOtpLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, reset, getValues, watch } = useForm<CheckoutFormValues>({
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
      otpCode: ""
    }
  });

  const selectedMethod = watch("method");

  useEffect(() => {
    if (session?.user) {
      reset({
        name: (session.user as any)?.name || "",
        email: (session.user as any)?.email || "",
        document: "",
        phone: "",
        method: "CREDIT_CARD",
      });
    }
  }, [session, reset]);

  const handleFormSubmit = async (data: CheckoutFormValues) => {
    if (data.method === 'PIX') {
      // PIX não requer OTP, vai direto
      onSubmit(data);
    } else {
      // Cartão requer OTP
      if (step === 'form') {
        setOtpLoading(true);
        try {
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
        // Já no passo OTP
        if (!data.otpCode || data.otpCode.length < 6) {
          toast.error("Por favor, digite o código de 6 dígitos.");
          return;
        }
        onSubmit(data);
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
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nome Completo</label>
                <input {...register("name")} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">E-mail</label>
                <input type="email" {...register("email")} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">CPF ou CNPJ</label>
                  <Controller
                    control={control}
                    name="document"
                    render={({ field: { onChange, value } }) => (
                      <input value={value} onChange={(e) => onChange(maskDocument(e.target.value))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    )}
                  />
                  {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">WhatsApp</label>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, value } }) => (
                      <input type="tel" value={value} onChange={(e) => onChange(maskPhone(e.target.value))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    )}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Forma de Pagamento</label>
                <Controller
                  control={control}
                  name="method"
                  render={({ field: { onChange, value } }) => (
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" aria-pressed={value === 'CREDIT_CARD'} onClick={() => onChange('CREDIT_CARD')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${value === 'CREDIT_CARD' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                        <CreditCard className="w-4 h-4" /> Cartão
                      </button>
                      <button type="button" aria-pressed={value === 'PIX'} onClick={() => onChange('PIX')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${value === 'PIX' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[10px]">P</div> PIX
                      </button>
                    </div>
                  )}
                />
              </div>

              {selectedMethod === 'CREDIT_CARD' && (
                <div className="space-y-4 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Número do Cartão</label>
                    <Controller
                      control={control}
                      name="cardNumber"
                      render={({ field: { onChange, value } }) => (
                        <input value={value} onChange={(e) => onChange(maskCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-mono" />
                      )}
                    />
                    {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nome no Cartão</label>
                    <input {...register("cardHolderName")} placeholder="Como impresso no cartão" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none uppercase" />
                    {errors.cardHolderName && <p className="text-red-500 text-xs mt-1">{errors.cardHolderName.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Validade</label>
                      <Controller
                        control={control}
                        name="cardExpiry"
                        render={({ field: { onChange, value } }) => (
                          <input value={value} onChange={(e) => onChange(maskCardExpiry(e.target.value))} placeholder="MM/AA" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                        )}
                      />
                      {errors.cardExpiry && <p className="text-red-500 text-xs mt-1">{errors.cardExpiry.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">CVV</label>
                      <input type="password" maxLength={4} {...register("cardCvv")} placeholder="123" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                      {errors.cardCvv && <p className="text-red-500 text-xs mt-1">{errors.cardCvv.message}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-right-4">
              <div className="text-center space-y-2 mb-6">
                <p className="text-sm text-muted-foreground">
                  Enviamos um código de 6 dígitos para o WhatsApp <strong>{getValues("phone")}</strong>.
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 text-center">
                  Código de Verificação
                </label>
                <input 
                  type="text" 
                  maxLength={6} 
                  {...register("otpCode")} 
                  className="w-full max-w-[200px] mx-auto block bg-background border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="000000"
                />
                {errors.otpCode && <p className="text-red-500 text-xs mt-1 text-center">{errors.otpCode.message}</p>}
              </div>

              <div className="flex justify-center pt-2">
                <button type="button" onClick={() => setStep('form')} className="text-xs text-primary hover:underline font-medium">
                  Voltar e editar dados
                </button>
              </div>
            </div>
          )}
          
          <Button type="submit" disabled={loading || otpLoading} className="w-full mt-2 font-bold py-5 rounded-xl text-[13px] group">
            {loading || otpLoading ? (
              "Processando..."
            ) : step === 'otp' ? (
              "Confirmar e Pagar"
            ) : selectedMethod === 'CREDIT_CARD' ? (
              <span className="flex items-center">Avançar para Verificação <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
            ) : (
              "Gerar PIX"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
