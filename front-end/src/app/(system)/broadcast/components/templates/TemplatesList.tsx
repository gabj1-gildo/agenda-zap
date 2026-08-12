import { CheckCircle, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BroadcastTemplate } from "../../types/broadcast.types";

interface TemplatesListProps {
  templates: BroadcastTemplate[];
  onSelectTemplate: (template: BroadcastTemplate) => void;
}

export function TemplatesList({ templates, onSelectTemplate }: TemplatesListProps) {
  if (templates.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-muted/10 text-muted-foreground">
        Nenhum template salvo ainda.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map(tpl => (
        <Card 
          key={tpl.id} 
          className="p-5 hover:border-primary/50 transition-colors cursor-pointer group" 
          onClick={() => onSelectTemplate(tpl)}
        >
          <div className="font-semibold text-sm mb-2 text-foreground flex justify-between items-start">
            {tpl.name}
            <CheckCircle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
            {tpl.content}
          </p>
          {tpl.mediaUrl && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
              <ImageIcon className="w-3 h-3" /> Contém Mídia
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
