import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Smartphone, Settings } from "lucide-react";

interface ProviderSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEvolution: () => void;
  onSelectMeta: () => void;
}

export function ProviderSelectModal({ open, onOpenChange, onSelectEvolution, onSelectMeta }: ProviderSelectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
          <DialogDescription>
            Selecione o provedor que deseja utilizar para conectar este número.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div 
            onClick={onSelectEvolution}
            className="border rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors flex flex-col items-center text-center gap-3"
          >
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-full">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-semibold">Evolution API</h4>
              <p className="text-xs text-muted-foreground mt-1">Lê o QR Code com seu celular. Ideal para o seu número pessoal ou de vendas atual.</p>
            </div>
          </div>

          <div 
            onClick={onSelectMeta}
            className="border rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors flex flex-col items-center text-center gap-3"
          >
            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-full">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-semibold">Oficial Meta Cloud</h4>
              <p className="text-xs text-muted-foreground mt-1">Integração oficial (Business API). Requer configuração no painel de desenvolvedores da Meta.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
