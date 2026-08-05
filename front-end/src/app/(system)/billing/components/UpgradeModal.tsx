import { useState } from "react";
import { XCircle, Sparkles, Lock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Plan, Subscription } from "../types/billing";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { useSession } from "next-auth/react";

interface UpgradeModalProps {
  plan: Plan;
  isUpgrade: boolean;
  loading: boolean;
  currentSub: Subscription | null;
  onClose: () => void;
  onConfirm: (isInstant: boolean, otpCode: string, cvv: string) => void;
}

export function UpgradeModal({ plan, isUpgrade, loading, currentSub, onClose, onConfirm }: UpgradeModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<'options' | 'security'>('options');
  const [isInstant, setIsInstant] = useState(false);
  const [cvv, setCvv] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const phone = (session?.user as any)?.phone || ""; // Pode não estar no session dependendo de como foi feito, mas no backend ele pega do DB. Se não tiver no session, o backend usa do DB. 
  // Na verdade não precisamos mandar o phone pro backend mandar OTP se já tivermos um endpoint pro usuário logado.
  // Mas vamos tentar usar o mesmo de checkout e enviar phone.
  // Vamos deixar enviar sem phone se o endpoint que usa session (se fizermos um novo).
  // Porém eu modifiquei o /api/saas/subscription/change para não precisar de phone (ele pega do DB user).
  // Mas o /api/saas/otp precisa de phone... Oxe. Eu não mudei o OTP!
  // Sim, o OTP recebe {phone, name}. Como eu não tenho o phone do user aqui necessariamente (depende do next-auth), eu posso criar um novo endpoint pra enviar OTP pra user logado ou apenas pedir pro front mandar o phone dele?
  // Na verdade, o `session.user.phone` existe.

  const handleSelectOption = (instant: boolean) => {
    setIsInstant(instant);
    setStep('security');
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      // Como o /api/saas/otp precisa de phone, vamos tentar mandar o phone do session ou só pedir no backend.
      // Vou mandar o phone do session se tiver. Se não, o backend (na verdade otp foi feito pro checkout e não exige auth, só phone e name).
      // Eu posso simplesmente pedir o phone? Não, melhor: O usuário já está logado. Vamos enviar um request pra um novo route ou usar o auth.
      // Ops, eu não criei rota de OTP pra usuário logado. O otp de checkout pega {phone, name}.
      // Se não tiver phone no session, eu exibo um input?
      // Pela conveniência, vamos assumir que (session?.user as any).phone existe. Se não existir, avisa.
      if (!phone) {
         toast.error("Telefone não encontrado. Atualize seu perfil.");
         setSendingOtp(false);
         return;
      }
      
      const res = await fetch(getBackendUrl('/api/saas/otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: (session?.user as any)?.name })
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Código enviado para o seu WhatsApp!");
        setOtpSent(true);
      } else {
        toast.error(result.error || "Falha ao enviar código");
      }
    } catch (e) {
      toast.error("Erro interno ao solicitar OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = () => {
    if (!cvv || cvv.length < 3) {
      toast.error("Por favor, informe o CVV do cartão.");
      return;
    }
    if (!otpCode || otpCode.length < 6) {
      toast.error("Por favor, digite o código de 6 dígitos.");
      return;
    }
    onConfirm(isInstant, otpCode, cvv);
  };

  return (
    <Card className="max-w-lg mx-auto w-full shadow-2xl border-primary/20 animate-in fade-in zoom-in-95 duration-300 relative mt-4">
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
        <XCircle className="w-5 h-5" />
      </button>
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          {step === 'options' ? (
            <Sparkles className="w-6 h-6 text-primary" />
          ) : (
            <Lock className="w-6 h-6 text-primary" />
          )}
        </div>
        <CardTitle className="text-xl">
          {step === 'options' ? (isUpgrade ? 'Fazer Upgrade' : 'Fazer Downgrade') : 'Confirmação de Segurança'}
        </CardTitle>
        <CardDescription className="text-sm">
          {step === 'options' 
            ? <>Você está alterando seu plano para <strong>{plan.name}</strong>.</>
            : 'Confirme os dados para finalizar a alteração.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'options' && (
          isUpgrade ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
              <p className="text-sm text-center text-muted-foreground">
                Como você deseja fazer o upgrade para o plano <strong>{plan.name}</strong>?
              </p>
              <div className="grid gap-4 mt-4">
                <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
                  <h4 className="font-bold text-foreground">Upgrade Imediato</h4>
                  <p className="text-xs text-muted-foreground">
                    Pague a diferença de valor agora mesmo e libere os novos limites instantaneamente. A próxima fatura já virá com o novo valor total.
                  </p>
                  <Button 
                    onClick={() => handleSelectOption(true)} 
                    className="w-full bg-primary text-primary-foreground font-bold"
                  >
                    Mudar Agora (Recomendado)
                  </Button>
                </div>
                <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
                  <h4 className="font-bold text-foreground">Upgrade Programado</h4>
                  <p className="text-xs text-muted-foreground">
                    Agende o upgrade para o próximo mês. Nenhuma cobrança é feita hoje. Os novos limites serão liberados somente após o pagamento da próxima fatura.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => handleSelectOption(false)} 
                    className="w-full font-bold"
                  >
                    Mudar no Próximo Mês
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
              <p className="text-sm text-center text-muted-foreground">
                Você está agendando um downgrade para o plano <strong>{plan.name}</strong>.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-xs p-4 rounded-xl text-center">
                <strong>Atenção:</strong> Os limites atuais da sua conta continuarão válidos até o fechamento da fatura já paga. As reduções de limite e de preço só entrarão em vigor no próximo mês.
              </div>
              <Button 
                onClick={() => handleSelectOption(false)} 
                className="w-full font-bold mt-4"
              >
                Prosseguir para Confirmação
              </Button>
            </div>
          )
        )}

        {step === 'security' && (
          <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-right-4">
            <div className="bg-muted p-4 rounded-xl text-center border border-border space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Cartão Atual</p>
              <p className="font-bold text-foreground">
                {currentSub?.cardLast4 ? `Cartão final ${currentSub.cardLast4}` : 'Cartão final ****'}
              </p>
              {currentSub?.cardBrand && currentSub.cardBrand !== 'unknown' && (
                <p className="text-[10px] text-muted-foreground uppercase">{currentSub.cardBrand}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 text-center">CVV do Cartão</label>
              <input 
                type="password" 
                maxLength={4} 
                value={cvv}
                onChange={e => setCvv(e.target.value)}
                placeholder="123"
                className="w-full max-w-[120px] mx-auto block bg-background border border-border rounded-xl px-4 py-2.5 text-center text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
              />
              <p className="text-[10px] text-center text-muted-foreground mt-1">Como medida de segurança, confirme o código CVV (atrás do cartão).</p>
            </div>

            {!otpSent ? (
               <div className="text-center pt-2">
                 <Button 
                    type="button"
                    onClick={handleSendOtp} 
                    disabled={sendingOtp}
                    variant="outline"
                    className="w-full font-bold"
                  >
                    {sendingOtp ? "Enviando..." : "Enviar Código WhatsApp"}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-2">Um código de 6 dígitos será enviado para o seu WhatsApp para confirmar a transação.</p>
               </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300">
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 text-center">Código de Verificação (WhatsApp)</label>
                <input 
                  type="text" 
                  maxLength={6} 
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="000000"
                  className="w-full max-w-[200px] mx-auto block bg-background border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-primary/20 outline-none" 
                />
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <button type="button" onClick={() => setStep('options')} className="text-xs text-muted-foreground hover:text-foreground font-medium">
                Voltar
              </button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !otpSent}
                className="font-bold"
              >
                {loading ? "Processando..." : "Confirmar Alteração"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
