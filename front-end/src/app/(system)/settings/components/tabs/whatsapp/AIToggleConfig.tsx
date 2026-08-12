import { Switch } from "@/components/ui/switch";

interface AIToggleConfigProps {
  aiEnabled: boolean;
  onToggle: (checked: boolean) => void;
  disabled: boolean;
}

export function AIToggleConfig({ aiEnabled, onToggle, disabled }: AIToggleConfigProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
      <div>
        <div className="font-semibold">Atendimento via IA</div>
        <div className="text-sm text-muted-foreground">O agente de Inteligência Artificial deve responder automaticamente?</div>
      </div>
      <Switch 
        checked={aiEnabled} 
        onCheckedChange={onToggle} 
        disabled={disabled}
      />
    </div>
  );
}
