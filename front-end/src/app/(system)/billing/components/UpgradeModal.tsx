import { useState } from "react";
import { XCircle, Sparkles, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Plan, Subscription } from "../types/billing";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { UpgradeOptionsStep } from "./upgrade/UpgradeOptionsStep";
import { UpgradeSecurityStep } from "./upgrade/UpgradeSecurityStep";

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

  const phone = (session?.user as any)?.phone || ""; 

  const handleSelectOption = (instant: boolean) => {
    setIsInstant(instant);
    setStep('security');
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] p-0 border-none bg-transparent shadow-none overflow-visible">
        <DialogTitle className="sr-only">Confirmação de alteração de plano</DialogTitle>
        <DialogDescription className="sr-only">Confirme sua senha ou as opções para mudar de plano</DialogDescription>
        <Card className="w-full shadow-2xl border-primary/20">
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
              <UpgradeOptionsStep 
                plan={plan} 
                isUpgrade={isUpgrade} 
                onSelectOption={handleSelectOption} 
              />
            )}

            {step === 'security' && (
              <UpgradeSecurityStep 
                currentSub={currentSub}
                cvv={cvv}
                setCvv={setCvv}
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                otpSent={otpSent}
                sendingOtp={sendingOtp}
                loading={loading}
                onSendOtp={handleSendOtp}
                onBack={() => setStep('options')}
                onSubmit={handleSubmit}
              />
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
