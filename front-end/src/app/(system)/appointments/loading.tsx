import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] space-y-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <div className="text-center">
        <h3 className="text-lg font-bold text-foreground font-display">Carregando agendamentos...</h3>
        <p className="text-sm text-muted-foreground mt-1">Buscando os registros mais recentes.</p>
      </div>
    </div>
  );
}
