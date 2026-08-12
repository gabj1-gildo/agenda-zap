import { useState } from "react";
import { Camera, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoUploadProps {
  currentLogoUrl?: string;
  onUpload: (file: File) => Promise<string | null>;
  onDeleteNew: (url: string) => Promise<void>;
  onNewLogoSelect: (url: string) => void;
}

export function LogoUpload({ currentLogoUrl, onUpload, onDeleteNew, onNewLogoSelect }: LogoUploadProps) {
  const [newLogoUrl, setNewLogoUrl] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await onUpload(file);
      if (url) {
        setNewLogoUrl(url);
        onNewLogoSelect(url);
      }
    }
  };

  const handleDiscard = async () => {
    if (newLogoUrl) {
      await onDeleteNew(newLogoUrl);
      setNewLogoUrl(null);
      onNewLogoSelect("");
    }
  };

  return (
    <>
      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setViewImage(null)}>
          <img src={`/api/image-proxy?url=${encodeURIComponent(viewImage)}`} className="max-w-[90vw] max-h-[90vh] object-contain" />
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-center gap-8 mb-8 p-6 bg-muted/30 rounded-2xl border border-border/50">
        <div className="flex flex-col items-center gap-3">
          <div className="relative group w-32 h-32 rounded-2xl border-4 border-background shadow-md overflow-hidden bg-muted flex items-center justify-center transition-all hover:shadow-lg">
            {currentLogoUrl ? (
              <img src={`/api/image-proxy?url=${encodeURIComponent(currentLogoUrl)}`} alt="Logo Atual" className="w-full h-full object-cover" />
            ) : (
              <div className="text-muted-foreground text-xs text-center px-2 font-semibold">Sem Logo</div>
            )}
            
            <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Alterar</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
          
          <div className="flex gap-2">
            {currentLogoUrl && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setViewImage(currentLogoUrl)}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Visualizar
              </Button>
            )}
          </div>
        </div>

        {newLogoUrl && (
          <>
            <div className="hidden sm:flex text-muted-foreground/30">
              <ArrowRight className="w-8 h-8" />
            </div>
            
            <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-left-4">
              <div className="relative group w-32 h-32 rounded-2xl border-4 border-emerald-500 shadow-lg overflow-hidden bg-emerald-500/10 flex items-center justify-center ring-4 ring-emerald-500/20">
                <img src={`/api/image-proxy?url=${encodeURIComponent(newLogoUrl)}`} alt="Nova Logo" className="w-full h-full object-cover" />
                
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  onClick={() => setViewImage(newLogoUrl)}
                >
                  <Eye className="w-6 h-6" />
                </div>
              </div>
              
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-8 text-xs font-semibold shadow-sm"
                onClick={handleDiscard}
              >
                 Descartar Nova Logo
              </Button>
            </div>
          </>
        )}

        {!newLogoUrl && (
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-foreground mb-1">Logo da Empresa</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Clique na imagem para enviar uma nova logo. Recomendamos imagens (ex: 512x512px) em formato JPG ou PNG com fundo transparente.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
