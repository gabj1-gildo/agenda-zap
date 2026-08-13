import { Button } from "@/components/ui/button";
import type { Subscription } from "../../types/billing";

interface UpgradeSecurityStepProps {
  currentSub: Subscription | null;
  cvv: string;
  setCvv: (cvv: string) => void;
  otpCode: string;
  setOtpCode: (otpCode: string) => void;
  otpSent: boolean;
  sendingOtp: boolean;
  loading: boolean;
  onSendOtp: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function UpgradeSecurityStep({
  currentSub, cvv, setCvv, otpCode, setOtpCode, otpSent, sendingOtp, loading, onSendOtp, onBack, onSubmit
}: UpgradeSecurityStepProps) {
  return (
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
            onClick={onSendOtp} 
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
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground font-medium">
          Voltar
        </button>
        <Button 
          onClick={onSubmit} 
          disabled={loading || !otpSent}
          className="font-bold"
        >
          {loading ? "Processando..." : "Confirmar Alteração"}
        </Button>
      </div>
    </div>
  );
}
