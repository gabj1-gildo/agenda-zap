import { XCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Plan } from "../types/billing";

interface UpgradeModalProps {
  plan: Plan;
  isUpgrade: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (isInstant: boolean) => void;
}

export function UpgradeModal({ plan, isUpgrade, loading, onClose, onConfirm }: UpgradeModalProps) {
  return (
    <Card className="max-w-lg mx-auto w-full shadow-2xl border-primary/20 animate-in fade-in zoom-in-95 duration-300 relative mt-4">
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
        <XCircle className="w-5 h-5" />
      </button>
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-xl">
          {isUpgrade ? 'Fazer Upgrade' : 'Fazer Downgrade'}
        </CardTitle>
        <CardDescription className="text-sm">
          Você está alterando seu plano para <strong>{plan.name}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isUpgrade ? (
          <div className="space-y-4">
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
                  onClick={() => onConfirm(true)} 
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-bold"
                >
                  {loading ? "Processando..." : "Mudar Agora (Recomendado)"}
                </Button>
              </div>
              <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
                <h4 className="font-bold text-foreground">Upgrade Programado</h4>
                <p className="text-xs text-muted-foreground">
                  Agende o upgrade para o próximo mês. Nenhuma cobrança é feita hoje. Os novos limites serão liberados somente após o pagamento da próxima fatura.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => onConfirm(false)} 
                  disabled={loading}
                  className="w-full font-bold"
                >
                  {loading ? "Processando..." : "Mudar no Próximo Mês"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Você está agendando um downgrade para o plano <strong>{plan.name}</strong>.
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-xs p-4 rounded-xl text-center">
              <strong>Atenção:</strong> Os limites atuais da sua conta continuarão válidos até o fechamento da fatura já paga. As reduções de limite e de preço só entrarão em vigor no próximo mês.
            </div>
            <Button 
              onClick={() => onConfirm(false)} 
              disabled={loading}
              className="w-full font-bold mt-4"
            >
              {loading ? "Processando..." : "Confirmar Downgrade"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
