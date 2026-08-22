import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { AdvancedPreset } from "../types";

interface AdvancedPresetsTabProps {
  fieldId: string;
  fieldName: string;
  presets: AdvancedPreset[];
  setAdvancedPresets: React.Dispatch<React.SetStateAction<Record<string, AdvancedPreset[]>>>;
}

export function AdvancedPresetsTab({ fieldId, fieldName, presets, setAdvancedPresets }: AdvancedPresetsTabProps) {
  const handleAdd = () => {
    setAdvancedPresets(prev => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), { label: "Novo Modelo", text: "" }]
    }));
  };

  const handleRemove = (index: number) => {
    setAdvancedPresets(prev => {
      const list = [...(prev[fieldId] || [])];
      list.splice(index, 1);
      return { ...prev, [fieldId]: list };
    });
  };

  const handleUpdate = (index: number, key: 'label' | 'text', value: string) => {
    setAdvancedPresets(prev => {
      const list = [...(prev[fieldId] || [])];
      list[index] = { ...list[index], [key]: value };
      return { ...prev, [fieldId]: list };
    });
  };

  return (
    <div className="space-y-6 outline-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            {fieldName}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estes modelos aparecerão como opções prontas de sugestão para o campo {fieldName}.
          </p>
        </div>
        <Button size="sm" onClick={handleAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Adicionar Modelo
        </Button>
      </div>
      
      {(!presets || presets.length === 0) ? (
        <div className="text-center p-12 border border-dashed rounded-2xl text-muted-foreground bg-card">
          Nenhum modelo configurado para este campo.
        </div>
      ) : (
        /* Grid de 2 cards por linha */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {presets.map((item, idx) => (
            <div key={idx} className="relative bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pr-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                    Modelo #{idx + 1}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemove(idx)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nome do Modelo (Exibido no Menu)
                  </Label>
                  <Input 
                    value={item.label || ""} 
                    onChange={(e) => handleUpdate(idx, 'label', e.target.value)} 
                    placeholder="Ex: Padrão, Rígido, Descontraído..."
                    className="bg-background text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Texto do Template (Conteúdo Injetado)
                  </Label>
                  <Textarea 
                    value={item.text || ""} 
                    onChange={(e) => handleUpdate(idx, 'text', e.target.value)} 
                    placeholder="Ex: Instrução de como a IA deve agir..."
                    className="min-h-[120px] bg-background font-mono text-xs resize-y"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
