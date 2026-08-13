import { XCircle, CreditCard, Lock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";

const changeCardSchema = z.object({
  cardNumber: z.string().min(13, "Número do cartão inválido"),
  cardHolderName: z.string().min(3, "Nome do titular inválido"),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "Validade inválida (MM/AA)"),
  cardCvv: z.string().min(3, "CVV inválido"),
  postalCode: z.string().min(8, "CEP inválido"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido")
});

type ChangeCardValues = z.infer<typeof changeCardSchema>;

import { maskCardNumber, maskCardExpiry, maskCep, maskDocument, maskPhone } from "../utils/masks";

interface ChangeCardModalProps {
  onClose: () => void;
  onSuccess: () => void;
  sessionToken: string;
  tenantId: string;
}

export function ChangeCardModal({ onClose, onSuccess, sessionToken, tenantId }: ChangeCardModalProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<ChangeCardValues>({
    resolver: zodResolver(changeCardSchema)
  });

  const handleFormSubmit = async (data: ChangeCardValues) => {
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl('/api/saas/subscription/payment-method'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'tenant-id': tenantId
        },
        body: JSON.stringify({
          creditCard: {
            holderName: data.cardHolderName,
            number: data.cardNumber.replace(/\D/g, ''),
            expiryMonth: data.cardExpiry.split('/')[0],
            expiryYear: data.cardExpiry.split('/')[1].length === 2 ? `20${data.cardExpiry.split('/')[1]}` : data.cardExpiry.split('/')[1],
            ccv: data.cardCvv
          },
          creditCardHolderInfo: {
            name: data.cardHolderName,
            email: data.email,
            cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
            postalCode: data.postalCode.replace(/\D/g, ''),
            addressNumber: '1',
            phone: data.phone.replace(/\D/g, '')
          }
        })
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Cartão de crédito atualizado com sucesso!");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Falha ao atualizar cartão.");
      }
    } catch (e: any) {
      toast.error("Erro interno ao atualizar método de pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full shadow-2xl border-primary/20 animate-in fade-in zoom-in-95 duration-300 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <XCircle className="w-5 h-5" />
        </button>
        <CardHeader className="text-center pb-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Trocar Cartão de Crédito</CardTitle>
          <CardDescription className="text-xs">Atualize os dados de cobrança da sua assinatura.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Número do Cartão</label>
                <Controller
                  control={control}
                  name="cardNumber"
                  render={({ field: { onChange, value } }) => (
                    <input value={value || ''} onChange={(e) => onChange(maskCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-mono" />
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
                      <input value={value || ''} onChange={(e) => onChange(maskCardExpiry(e.target.value))} placeholder="MM/AA" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
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

              <div className="border-t border-border/50 pt-4 mt-2">
                <p className="text-xs text-muted-foreground mb-3 font-medium">Dados do Titular do Cartão</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">CPF ou CNPJ</label>
                      <Controller
                        control={control}
                        name="cpfCnpj"
                        render={({ field: { onChange, value } }) => (
                          <input value={value || ''} onChange={(e) => onChange(maskDocument(e.target.value))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                        )}
                      />
                      {errors.cpfCnpj && <p className="text-red-500 text-xs mt-1">{errors.cpfCnpj.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">CEP</label>
                      <Controller
                        control={control}
                        name="postalCode"
                        render={({ field: { onChange, value } }) => (
                          <input value={value || ''} onChange={(e) => onChange(maskCep(e.target.value))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                        )}
                      />
                      {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">E-mail</label>
                    <input type="email" {...register("email")} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Telefone</label>
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field: { onChange, value } }) => (
                        <input type="tel" value={value || ''} onChange={(e) => onChange(maskPhone(e.target.value))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                      )}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full mt-4 font-bold py-5 rounded-xl text-[13px] group">
              {loading ? "Atualizando..." : "Salvar Novo Cartão"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
