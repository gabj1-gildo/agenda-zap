import { Users, Tag } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TargetType, BroadcastTag } from "../../types/broadcast.types";

interface TargetSelectorProps {
  targetType: TargetType;
  setTargetType: (t: TargetType) => void;
  targetIds: string[];
  setTargetIds: (ids: string[]) => void;
  tags: BroadcastTag[];
}

export function TargetSelector({ targetType, setTargetType, targetIds, setTargetIds, tags }: TargetSelectorProps) {
  const handleTagToggle = (tagId: string) => {
    if (targetIds.includes(tagId)) {
      setTargetIds(targetIds.filter(id => id !== tagId));
    } else {
      setTargetIds([...targetIds, tagId]);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" /> Público Alvo
      </Label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label 
          className={`
            flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200
            ${targetType === 'ALL_CLIENTS' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'}
          `}
        >
          <div className="flex items-center gap-3">
            <input 
              type="radio" 
              name="targetType" 
              checked={targetType === 'ALL_CLIENTS'} 
              onChange={() => setTargetType('ALL_CLIENTS')}
              className="w-4 h-4 text-primary accent-primary" 
            />
            <div className="font-semibold text-sm">Todos os Clientes</div>
          </div>
          <p className="text-xs text-muted-foreground ml-7 mt-1">Disparar para todos os contatos válidos.</p>
        </label>

        <label 
          className={`
            flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200
            ${targetType === 'TAGS' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'}
          `}
        >
          <div className="flex items-center gap-3">
            <input 
              type="radio" 
              name="targetType" 
              checked={targetType === 'TAGS'} 
              onChange={() => setTargetType('TAGS')}
              className="w-4 h-4 text-primary accent-primary" 
            />
            <div className="font-semibold text-sm">Filtrar por Tags</div>
          </div>
          <p className="text-xs text-muted-foreground ml-7 mt-1">Selecionar grupos específicos.</p>
        </label>
      </div>

      {targetType === 'TAGS' && (
        <div className="p-4 rounded-xl border bg-muted/20 mt-4 animate-in fade-in slide-in-from-top-2">
          <Label className="text-sm font-medium mb-3 block">Selecione as Tags (Grupos)</Label>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhuma tag cadastrada ainda. Crie tags na aba de Clientes.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const isSelected = targetIds.includes(tag.id);
                return (
                  <Badge 
                    key={tag.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1.5 px-3 transition-all"
                    style={isSelected ? { backgroundColor: tag.color, color: '#fff', borderColor: tag.color } : {}}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    <Tag className="w-3 h-3 mr-1.5 opacity-70" />
                    {tag.name}
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
