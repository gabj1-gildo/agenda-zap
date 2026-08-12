import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { WhatsAppInstance } from "../../../types/settings.types";

interface EvolutionInstanceCardProps {
  instance: WhatsAppInstance;
  onReconnect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function EvolutionInstanceCard({ instance, onReconnect, onRemove }: EvolutionInstanceCardProps) {
  const isOpen = instance.evolutionInstanceStatus === "OPEN";

  return (
    <div className="flex items-center justify-between p-4 border rounded-md relative overflow-hidden">
      <div className="absolute top-0 right-0 p-1 bg-blue-500 text-[9px] font-bold px-2 rounded-bl-lg text-white uppercase tracking-wider">
        Evolution API
      </div>
      <div>
        <div className="font-semibold flex items-center gap-2">
          {instance.evolutionInstanceName?.replace('-AgendaZap', '')?.replace('_AgendaZap', '') || "Instância Padrão"}
          {isOpen ? (
            <Badge className="bg-green-600 hover:bg-green-700 text-white">Conectado</Badge>
          ) : (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white">{instance.evolutionInstanceStatus || "Desconectado"}</Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          {isOpen ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
          Número: {instance.phone}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {!isOpen && (
          <Button variant="outline" size="sm" onClick={() => onReconnect(instance.id)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reconectar
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={() => onRemove(instance.id)}>
          <Trash className="w-4 h-4 mr-2" />
          Remover
        </Button>
      </div>
    </div>
  );
}
