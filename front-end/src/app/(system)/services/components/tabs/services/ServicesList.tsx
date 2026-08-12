import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash, Edit } from "lucide-react";

export function ServicesList({
  services,
  minsToTime,
  handleOpenEdit,
  setDeleteId
}: {
  services: any[];
  minsToTime: (mins: string | number) => string;
  handleOpenEdit: (svc: any) => void;
  setDeleteId: (id: string) => void;
}) {
  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-8 text-center text-muted-foreground">
            Nenhum serviço cadastrado. Adicione o seu primeiro serviço para a IA poder agendar.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {services.map((svc: any) => (
            <div key={svc.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{svc.name}</span>
                  {!svc.isActive && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <span>R$ {Number(svc.price).toFixed(2).replace('.', ',')}</span>
                  <span>•</span>
                  <span>{minsToTime(svc.durationMinutes)} h</span>
                </div>
                {svc.description && <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">{svc.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(svc)}>
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(svc.id)}>
                  <Trash className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
