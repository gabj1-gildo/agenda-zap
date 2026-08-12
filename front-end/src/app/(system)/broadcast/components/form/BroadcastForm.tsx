import { useState } from "react";
import { Send, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TargetSelector } from "./TargetSelector";
import { MessageEditor } from "./MessageEditor";
import { TargetType, BroadcastTag } from "../../types/broadcast.types";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";

interface BroadcastFormProps {
  tenant: any;
  tags: BroadcastTag[];
  message: string;
  setMessage: (msg: string | ((prev: string) => string)) => void;
  mediaUrl: string;
  setMediaUrl: (url: string) => void;
  targetType: TargetType;
  setTargetType: (t: TargetType) => void;
  targetIds: string[];
  setTargetIds: (ids: string[]) => void;
  sending: boolean;
  uploadingMedia: boolean;
  onExecute: () => Promise<boolean>;
  onUploadMedia: (file: File) => Promise<string | null>;
  onSaveTemplate: (name: string, content: string, mediaUrl: string) => Promise<boolean>;
  onConnectWhatsapp: () => void;
}

export function BroadcastForm({
  tenant,
  tags,
  message,
  setMessage,
  mediaUrl,
  setMediaUrl,
  targetType,
  setTargetType,
  targetIds,
  setTargetIds,
  sending,
  uploadingMedia,
  onExecute,
  onUploadMedia,
  onSaveTemplate,
  onConnectWhatsapp
}: BroadcastFormProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUploadWrapper = async (file: File) => {
    const url = await onUploadMedia(file);
    if (url) setMediaUrl(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("A mensagem não pode estar vazia.");
      return;
    }
    if (targetType === 'TAGS' && targetIds.length === 0) {
      toast.error("Selecione pelo menos uma tag.");
      return;
    }
    setShowConfirm(true);
  };

  const confirmAndExecute = async () => {
    const success = await onExecute();
    if (success) {
      setMessage("");
      setMediaUrl("");
    }
    setShowConfirm(false);
  };

  const isWhatsappDisconnected = tenant?._hasConnectedWhatsapp ? false 
    : tenant?.whatsappProvider?.toUpperCase() === 'META_CLOUD' ? !(tenant?.whatsappMetaToken && tenant?.whatsappMetaPhoneNumberId)
    : true;

  return (
    <>
      <ConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmar Disparo em Massa"
        description={`Você está prestes a disparar esta mensagem para ${targetType === 'ALL_CLIENTS' ? 'TODOS OS CLIENTES' : 'as TAGS SELECIONADAS'}. Esta ação não pode ser desfeita e consumirá recursos de disparo. Certifique-se de não violar as políticas do WhatsApp contra SPAM.`}
        onConfirm={confirmAndExecute}
        confirmText={sending ? "Enviando..." : "Sim, Disparar Agora"}
      />

      <Card className="p-6 bg-card border-border/50 shadow-sm rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TargetSelector 
            targetType={targetType}
            setTargetType={setTargetType}
            targetIds={targetIds}
            setTargetIds={setTargetIds}
            tags={tags}
          />

          <MessageEditor 
            message={message}
            setMessage={setMessage}
            mediaUrl={mediaUrl}
            uploadingMedia={uploadingMedia}
            onUploadMedia={handleUploadWrapper}
            onSaveTemplate={onSaveTemplate}
          />

          <div className="pt-6">
            {isWhatsappDisconnected ? (
              <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Smartphone className="w-5 h-5" />
                  WhatsApp Desconectado. Conecte para disparar.
                </div>
                <Button type="button" variant="destructive" size="sm" onClick={onConnectWhatsapp}>
                  Conectar Agora
                </Button>
              </div>
            ) : (
              <Button type="submit" size="lg" className="w-full text-base font-bold shadow-md rounded-xl h-12" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando para o WhatsApp...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Disparar Mensagem Agora
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </>
  );
}
