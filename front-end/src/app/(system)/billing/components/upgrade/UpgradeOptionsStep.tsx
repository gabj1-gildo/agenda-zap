import { Button } from "@/components/ui/button";
import type { Plan } from "../../types/billing";

interface UpgradeOptionsStepProps {
  plan: Plan;
  isUpgrade: boolean;
  onSelectOption: (instant: boolean) => void;
}

export function UpgradeOptionsStep({ plan, isUpgrade, onSelectOption }: UpgradeOptionsStepProps) {
  if (!isUpgrade) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
        <p className="text-sm text-center text-muted-foreground">
          Você está agendando um downgrade para o plano <strong>{plan.name}</strong>.
        </p>
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-xs p-4 rounded-xl text-center">
          <strong>Atenção:</strong> Os limites atuais da sua conta continuarão válidos até o fechamento da fatura já paga. As reduções de limite e de preço só entrarão em vigor no próximo mês.
        </div>
        <Button 
          onClick={() => onSelectOption(false)} 
          className="w-full font-bold mt-4"
        >
          Prosseguir para Confirmação
        </Button>
      </div>
    );
  }

  return (
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
            onClick={() => onSelectOption(true)} 
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
            onClick={() => onSelectOption(false)} 
            className="w-full font-bold"
          >
            Mudar no Próximo Mês
          </Button>
        </div>
      </div>
    </div>
  );
}
