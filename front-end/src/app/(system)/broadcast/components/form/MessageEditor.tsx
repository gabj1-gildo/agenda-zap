import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface MessageEditorProps {
  message: string;
  setMessage: (msg: string | ((prev: string) => string)) => void;
  mediaUrl: string;
  uploadingMedia: boolean;
  onUploadMedia: (file: File) => Promise<void>;
  onSaveTemplate: (name: string, content: string, mediaUrl: string) => Promise<boolean>;
}

export function MessageEditor({ 
  message, 
  setMessage, 
  mediaUrl, 
  uploadingMedia, 
  onUploadMedia,
  onSaveTemplate
}: MessageEditorProps) {
  const [templateName, setTemplateName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertVariable = (variable: string) => {
    setMessage((prev: string) => prev + variable);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUploadMedia(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveTemplate = async () => {
    await onSaveTemplate(templateName, message, mediaUrl);
    setTemplateName("");
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Conteúdo da Mensagem
        </Label>
        
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs bg-background"
            onClick={() => insertVariable('{nome}')}
          >
            +{`{nome}`}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs bg-background"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia}
          >
            {uploadingMedia ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2 text-muted-foreground" />}
            Anexar Mídia
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*,application/pdf" 
            onChange={handleFileChange} 
          />
        </div>
      </div>

      <Textarea 
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Olá {nome}, temos uma oferta especial..."
        className="min-h-[160px] text-sm resize-none rounded-xl"
      />

      {/* Área de salvar template */}
      <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
        <Input 
          placeholder="Nome para salvar template (Opcional)" 
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          className="h-9 bg-background"
        />
        <Button type="button" variant="secondary" className="h-9 shrink-0" onClick={handleSaveTemplate}>
          Salvar Template
        </Button>
      </div>
    </div>
  );
}
