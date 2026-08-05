import { XCircle, CreditCard, Lock, ArrowRight, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormValues } from "../schemas/checkout.schema";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { initMercadoPago } from "@mercadopago/sdk-react";
import type { Plan } from "../types/billing";

interface CheckoutFormProps {
  loading: boolean;
  plan: Plan | null;
  onClose: () => void;
  onSubmit: (data: CheckoutFormValues & { creditCardToken?: string; creditCardHolderInfo?: any }) => void;
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

const maskCep = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 8) v = v.substring(0, 8);
  if (v.length > 5) v = `${v.substring(0, 5)}-${v.substring(5)}`;
  return v;
};

export function CheckoutForm({ loading, plan, onClose, onSubmit }: CheckoutFormProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpLoading, setOtpLoading] = useState(false);
  const [validatingCep, setValidatingCep] = useState(false);
  const [creditCardToken, setCreditCardToken] = useState("");

  const isMonthly = plan?.interval === "monthly";

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
      initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
    }
  }, []);

  const { register, handleSubmit, control, formState: { errors }, reset, getValues, watch, setValue } = useForm<CheckoutFormValues>({
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

  const selectedMethod = watch("method");
  const currentCep = watch("cep");

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

  const handleCepBlur = async () => {
    if (!currentCep) return;
    const cep = currentCep.replace(/\D/g, "");
    if (cep.length === 8) {
      setValidatingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (data.erro) {
          toast.error("CEP não encontrado");
        } else {
          setValue("street", data.logradouro);
          setValue("neighborhood", data.bairro);
          setValue("city", data.localidade);
          setValue("state", data.uf);
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      } finally {
        setValidatingCep(false);
      }
    }
  };

  const handleFormSubmit = async (data: CheckoutFormValues) => {
    if (data.method === 'PIX' || data.method === 'BOLETO') {
      // PIX ou BOLETO não requer OTP
      onSubmit(data);
    } else {
      // Cartão
      if (!isMonthly && (!data.cep || !data.number)) {
        toast.error("Preencha o endereço de cobrança completo.");
        return;
      }

      if (step === 'form') {
        setOtpLoading(true);
        try {
          // Token do MP se for mensal
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
        // Já no passo OTP
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
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" aria-pressed={value === 'CREDIT_CARD'} onClick={() => onChange('CREDIT_CARD')} className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${value === 'CREDIT_CARD' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                        <CreditCard className="w-3.5 h-3.5" /> Cartão
                      </button>
                      <button type="button" aria-pressed={value === 'PIX'} onClick={() => onChange('PIX')} className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${value === 'PIX' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[9px]">P</div> PIX
                      </button>
                      <button type="button" aria-pressed={value === 'BOLETO'} onClick={() => onChange('BOLETO')} className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${value === 'BOLETO' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                        Boleto
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
                        <input value={value || ""} onChange={(e) => onChange(maskCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-mono" />
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
                          <input value={value || ""} onChange={(e) => onChange(maskCardExpiry(e.target.value))} placeholder="MM/AA" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
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

                  {!isMonthly && plan && (
                    <div className="pt-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Número de Parcelas</label>
                      <Controller
                        control={control}
                        name="installments"
                        render={({ field: { onChange, value } }) => (
                          <select 
                            value={value} 
                            onChange={(e) => onChange(Number(e.target.value))}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>
                                {n}x de R$ {(Number(plan.price) / n).toFixed(2).replace(".", ",")} {n > 1 ? "sem juros" : ""}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>
                  )}

                  {!isMonthly && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-2 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0">Endereço de Cobrança</label>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 relative">
                          <Controller
                            control={control}
                            name="cep"
                            render={({ field: { onChange, value } }) => (
                              <input value={value || ""} onChange={(e) => onChange(maskCep(e.target.value))} onBlur={handleCepBlur} placeholder="CEP" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                            )}
                          />
                          {validatingCep && <div className="absolute right-4 top-3 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                        </div>
                        <input {...register("number")} placeholder="Nº" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <input {...register("street")} placeholder="Rua / Logradouro" className="col-span-3 w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                        <input {...register("neighborhood")} placeholder="Bairro" className="col-span-1 w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                        <input {...register("city")} placeholder="Cidade" className="col-span-1 w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                        <input {...register("state")} placeholder="UF" maxLength={2} className="col-span-1 text-center w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                      </div>
                    </div>
                  )}

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
          
          <Button type="submit" disabled={loading || otpLoading || validatingCep} className="w-full mt-2 font-bold py-5 rounded-xl text-[13px] group">
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
