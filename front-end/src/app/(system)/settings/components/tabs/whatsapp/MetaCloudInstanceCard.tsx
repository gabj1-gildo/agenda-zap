import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Trash, Wifi } from "lucide-react";

interface MetaCloudInstanceCardProps {
  onConfigure: () => void;
  onRemove: () => void;
}

export function MetaCloudInstanceCard({ onConfigure, onRemove }: MetaCloudInstanceCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-md relative overflow-hidden">
      <div className="absolute top-0 right-0 p-1 bg-green-500 text-[9px] font-bold px-2 rounded-bl-lg text-white uppercase tracking-wider">
        Oficial Meta
      </div>
      <div>
        <div className="font-semibold flex items-center gap-2">
          WhatsApp Principal (Meta Cloud API)
          <Badge className="bg-green-600 hover:bg-green-700 text-white">Conectado</Badge>
        </div>
        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          <Wifi className="w-4 h-4 text-green-600" />
          Status: Pronto para uso
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onConfigure}>
          <Settings className="w-4 h-4 mr-2" />
          Configurar
        </Button>
        <Button variant="destructive" size="sm" onClick={onRemove}>
          <Trash className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
