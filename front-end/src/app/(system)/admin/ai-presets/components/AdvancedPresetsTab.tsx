import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">{fieldName}</h2>
          <p className="text-sm text-muted-foreground">Estes modelos aparecerão como opções prontas para este campo.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Adicionar Modelo
        </Button>
      </div>
      
      {(!presets || presets.length === 0) ? (
        <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
          Nenhum modelo configurado para este campo.
        </div>
      ) : (
        presets.map((item, idx) => (
          <div key={idx} className="relative bg-muted/30 border rounded-lg p-4 space-y-4">
            <div className="absolute top-4 right-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemove(idx)}
                className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 pr-12">
              <Label>Nome do Modelo (Exibido no Menu)</Label>
              <Input 
                value={item.label || ""} 
                onChange={(e) => handleUpdate(idx, 'label', e.target.value)} 
                placeholder="Ex: Padrão, Rígido, Descontraído..."
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Texto do Template (Conteúdo Injetado)</Label>
              <Textarea 
                value={item.text || ""} 
                onChange={(e) => handleUpdate(idx, 'text', e.target.value)} 
                placeholder="Ex: Instrução de como a IA deve agir..."
                className="min-h-[100px] bg-background font-mono text-sm"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
