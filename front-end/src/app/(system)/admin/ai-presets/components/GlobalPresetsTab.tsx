import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Package } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Pacotes Globais
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estes modelos aparecerão como opções prontas de pacotes de IA para as empresas.
          </p>
        </div>
        <Button size="sm" onClick={handleAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Adicionar Pacote
        </Button>
      </div>

      {globalPresets.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-2xl text-muted-foreground bg-card">
          Nenhum pacote global configurado.
        </div>
      ) : (
        /* Grid de 2 cards por linha */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {globalPresets.map((item, idx) => (
            <div key={idx} className="relative bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pr-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                    Pacote #{idx + 1}
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
                    ID do Pacote (Apenas letras e números)
                  </Label>
                  <Input 
                    value={item.id || ""} 
                    onChange={(e) => updateItem(idx, 'id', e.target.value)} 
                    placeholder="ex: salao_beleza" 
                    className="bg-background font-mono text-sm" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nome do Pacote
                  </Label>
                  <Input 
                    value={item.label || ""} 
                    onChange={(e) => updateItem(idx, 'label', e.target.value)} 
                    placeholder="ex: Salão / Barbearia" 
                    className="bg-background text-sm font-semibold" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Descrição Curta
                  </Label>
                  <Input 
                    value={item.desc || ""} 
                    onChange={(e) => updateItem(idx, 'desc', e.target.value)} 
                    placeholder="ex: Tom de voz amigável para serviços..." 
                    className="bg-background text-xs" 
                  />
                </div>
                
                <div className="p-3.5 border border-border rounded-xl mt-4 space-y-3 bg-muted/20">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">Textos Injetados pelo Pacote:</h3>
                  {PRESET_FIELDS.map(f => (
                    <div key={f.id} className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">{f.name}</Label>
                      <Textarea 
                        value={item.config?.[f.id] || ""} 
                        onChange={(e) => updateConfig(idx, f.id, e.target.value)} 
                        className="min-h-[50px] text-xs font-mono bg-background resize-y"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
