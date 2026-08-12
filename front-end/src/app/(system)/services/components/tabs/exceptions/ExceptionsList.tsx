import { Button } from "@/components/ui/button";
import { Trash, Edit } from "lucide-react";

export function ExceptionsList({
  exceptions,
  handleOpenEdit,
  setDeleteId
}: {
  exceptions: any[];
  handleOpenEdit: (exc: any) => void;
  setDeleteId: (id: string) => void;
}) {
  if (exceptions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhuma exceção cadastrada.
      </div>
    );
  }

  return (
    <div className="divide-y">
      {exceptions.map((exc: any) => (
        <div key={exc.id} className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">{new Date(exc.date + "T12:00:00").toLocaleDateString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground">
              {exc.isClosed ? "Fechado" : `Horário Customizado: ${exc.customStartTime} às ${exc.customEndTime}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(exc)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(exc.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
