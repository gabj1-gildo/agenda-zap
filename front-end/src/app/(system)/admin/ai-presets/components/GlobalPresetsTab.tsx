import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { GlobalPreset, PRESET_FIELDS } from "../types";

interface GlobalPresetsTabProps {
  globalPresets: GlobalPreset[];
  setGlobalPresets: React.Dispatch<React.SetStateAction<GlobalPreset[]>>;
}

export function GlobalPresetsTab({ globalPresets, setGlobalPresets }: GlobalPresetsTabProps) {
  const handleAdd = () => {
    setGlobalPresets(prev => [
      ...prev,
      { id: `pacote_${prev.length + 1}`, label: "Novo Pacote", desc: "", config: {} }
    ]);
  };

  const handleRemove = (index: number) => {
    setGlobalPresets(prev => {
      const list = [...prev];
      list.splice(index, 1);
      return list;
    });
  };

  const updateItem = (index: number, key: keyof GlobalPreset, value: any) => {
    setGlobalPresets(prev => {
      const list = [...prev];
      list[index] = { ...list[index], [key]: value };
      return list;
    });
  };

  const updateConfig = (index: number, configKey: string, value: string) => {
    setGlobalPresets(prev => {
      const list = [...prev];
      list[index] = { 
        ...list[index], 
        config: { ...list[index].config, [configKey]: value } 
      };
      return list;
    });
  };

  return (
    <div className="space-y-6 outline-none">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Pacotes Globais</h2>
          <p className="text-sm text-muted-foreground">Estes modelos aparecerão como opções prontas de pacotes para a IA.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Adicionar Pacote
        </Button>
      </div>

      {globalPresets.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
          Nenhum pacote global configurado.
        </div>
      ) : (
        globalPresets.map((item, idx) => (
          <div key={idx} className="relative bg-muted/30 border rounded-lg p-4 space-y-4">
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={() => handleRemove(idx)} className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 pr-12">
              <Label>ID do Pacote (Apenas Letras/Números, sem espaço)</Label>
              <Input 
                value={item.id || ""} 
                onChange={(e) => updateItem(idx, 'id', e.target.value)} 
                placeholder="ex: salao_beleza" 
                className="bg-background" 
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Pacote</Label>
              <Input 
                value={item.label || ""} 
                onChange={(e) => updateItem(idx, 'label', e.target.value)} 
                placeholder="ex: Salão / Barbearia" 
                className="bg-background" 
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição Curta</Label>
              <Input 
                value={item.desc || ""} 
                onChange={(e) => updateItem(idx, 'desc', e.target.value)} 
                placeholder="ex: Tom amigável..." 
                className="bg-background" 
              />
            </div>
            
            <div className="p-4 border rounded-md mt-4 space-y-4 bg-background/50">
              <h3 className="font-semibold text-sm">Textos Injetados pelo Pacote:</h3>
              {PRESET_FIELDS.map(f => (
                <div key={f.id} className="space-y-1">
                  <Label className="text-xs">{f.name}</Label>
                  <Textarea 
                    value={item.config?.[f.id] || ""} 
                    onChange={(e) => updateConfig(idx, f.id, e.target.value)} 
                    className="min-h-[60px] text-xs font-mono bg-background"
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
