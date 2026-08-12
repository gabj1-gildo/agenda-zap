import { User, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhonePreviewProps {
  tenantName: string;
  message: string;
  mediaUrl: string;
  onRemoveMedia: () => void;
}

export function PhonePreview({ tenantName, message, mediaUrl, onRemoveMedia }: PhonePreviewProps) {
  return (
    <div className="hidden lg:block relative">
      <div className="sticky top-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Preview (Visão do Cliente)</h3>
        
        {/* Simulador de Celular */}
        <div className="relative w-[320px] h-[640px] border-[8px] border-zinc-800 dark:border-zinc-900 bg-[#efeae2] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
          
          {/* Phone Notch/Camera */}
          <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
            <div className="w-24 h-5 bg-zinc-800 dark:bg-zinc-900 rounded-b-xl"></div>
          </div>

          {/* Header do Zap */}
          <div className="bg-[#00a884] px-4 pt-7 pb-3 text-white flex items-center gap-3 shadow-sm z-10 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold text-sm truncate">{tenantName || 'Sua Empresa'}</div>
              <div className="text-[10px] opacity-80 truncate">Conta Comercial</div>
            </div>
          </div>

          {/* Corpo das mensagens */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain', backgroundRepeat: 'repeat' }}>
            
            {/* Balão do Sistema / Aviso de Criptografia */}
            <div className="bg-[#ffeecd] text-[#54656f] text-[10px] text-center p-1.5 rounded-lg max-w-[90%] mx-auto shadow-sm">
              As mensagens são protegidas com a criptografia de ponta a ponta.
            </div>

            {/* Mensagem Pré-visualizada */}
            {(message.trim() || mediaUrl) ? (
              <div className="bg-[#d9fdd3] text-[#111b21] p-2 rounded-lg rounded-tr-none max-w-[85%] self-end shadow-sm relative text-sm mt-2 animate-in slide-in-from-right-4 fade-in">
                
                {mediaUrl && (
                  <div className="mb-2 relative rounded-md overflow-hidden bg-black/5 aspect-video flex items-center justify-center">
                    {mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i) || mediaUrl.includes('image-proxy') ? (
                      <img src={mediaUrl.includes('image-proxy') ? mediaUrl : `/api/image-proxy?url=${encodeURIComponent(mediaUrl)}`} alt="Anexo" className="object-cover w-full h-full" />
                    ) : (
                      <div className="text-xs flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" /> Arquivo Anexado
                      </div>
                    )}
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="w-6 h-6 absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity"
                      onClick={onRemoveMedia}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                
                {message.trim() ? (
                  <div className="whitespace-pre-wrap leading-snug">
                    {message.replace(/{nome}/g, 'João').replace(/{nome_completo}/g, 'João Silva')}
                  </div>
                ) : (
                  <div className="italic text-muted-foreground/60 text-xs text-center py-2">Sem texto</div>
                )}
                
                <div className="text-[10px] text-[#667781] text-right mt-1 font-mono-custom float-right clear-both ml-2">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-muted-foreground/50 bg-white/50 p-3 rounded-xl mt-4 backdrop-blur-sm">
                Digite algo para visualizar
              </div>
            )}
          </div>
        </div>
        {/* Sombra de Reflexo */}
        <div className="absolute -bottom-8 left-4 right-4 h-8 bg-black/20 blur-xl rounded-[100%] opacity-50 -z-10 pointer-events-none"></div>
      </div>
    </div>
  );
}
