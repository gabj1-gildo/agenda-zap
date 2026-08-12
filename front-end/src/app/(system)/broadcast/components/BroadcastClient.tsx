"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TenantPhoneModal } from "@/components/TenantPhoneModal";
import { BroadcastForm } from "./form/BroadcastForm";
import { TemplatesList } from "./templates/TemplatesList";
import { PhonePreview } from "./preview/PhonePreview";
import { useBroadcast } from "../hooks/useBroadcast";
import { BroadcastInitialData, TargetType, BroadcastTemplate } from "../types/broadcast.types";
import { useRouter } from "next/navigation";

interface BroadcastClientProps {
  initialData: BroadcastInitialData;
  tenantId: string;
  token?: string;
}

export function BroadcastClient({ initialData, tenantId, token }: BroadcastClientProps) {
  const router = useRouter();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form State
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("ALL_CLIENTS");
  const [targetIds, setTargetIds] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const savedMessage = localStorage.getItem("broadcast_message");
      const savedMediaUrl = localStorage.getItem("broadcast_mediaUrl");
      const savedTargetType = localStorage.getItem("broadcast_targetType");
      const savedTargetIds = localStorage.getItem("broadcast_targetIds");
      
      if (savedMessage) setMessage(savedMessage);
      if (savedMediaUrl) setMediaUrl(savedMediaUrl);
      if (savedTargetType) setTargetType(savedTargetType as TargetType);
      if (savedTargetIds) setTargetIds(JSON.parse(savedTargetIds));
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("broadcast_message", message);
    localStorage.setItem("broadcast_mediaUrl", mediaUrl);
    localStorage.setItem("broadcast_targetType", targetType);
    localStorage.setItem("broadcast_targetIds", JSON.stringify(targetIds));
  }, [message, mediaUrl, targetType, targetIds, isLoaded]);
  
  const { 
    sending, 
    uploadingMedia, 
    templates, 
    tags,
    executeBroadcast, 
    saveTemplate, 
    handleMediaUpload 
  } = useBroadcast({ tenantId, token, initialTemplates: initialData.templates, initialTags: initialData.tags });

  const handleExecute = async () => {
    return await executeBroadcast(targetType, targetIds, message, mediaUrl);
  };

  const handleSelectTemplate = (tpl: BroadcastTemplate) => {
    setMessage(tpl.content);
    setMediaUrl(tpl.mediaUrl || "");
    toast.success("Template carregado no editor.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 animate-in fade-in zoom-in-95 duration-300">
      
      {showPhoneModal && (
        <TenantPhoneModal 
          tenantId={tenantId} 
          onClose={() => {
            setShowPhoneModal(false);
            router.refresh(); // Refresh SSR to fetch new status
          }} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              <Megaphone className="w-5 h-5" />
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Marketing</p>
          </div>
          <h1 className="font-display font-extrabold text-4xl text-foreground tracking-tight">Disparo em Massa</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Envie mensagens de marketing, avisos e promoções diretamente no WhatsApp dos seus clientes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Abas de Criação e Destinatários */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="nova-mensagem" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="nova-mensagem" className="rounded-lg">Nova Mensagem</TabsTrigger>
              <TabsTrigger value="templates" className="rounded-lg">Meus Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="nova-mensagem" className="space-y-6 mt-6">
              <BroadcastForm 
                tenant={initialData.tenant}
                tags={tags}
                message={message}
                setMessage={setMessage}
                mediaUrl={mediaUrl}
                setMediaUrl={setMediaUrl}
                targetType={targetType}
                setTargetType={setTargetType}
                targetIds={targetIds}
                setTargetIds={setTargetIds}
                sending={sending}
                uploadingMedia={uploadingMedia}
                onExecute={handleExecute}
                onUploadMedia={handleMediaUpload}
                onSaveTemplate={saveTemplate}
                onConnectWhatsapp={() => setShowPhoneModal(true)}
              />
            </TabsContent>

            <TabsContent value="templates" className="mt-6 space-y-4">
              <TemplatesList templates={templates} onSelectTemplate={handleSelectTemplate} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Lado Direito: Preview */}
        <PhonePreview 
          tenantName={initialData.tenant?.name || ""}
          message={message}
          mediaUrl={mediaUrl}
          onRemoveMedia={() => setMediaUrl("")}
        />
      </div>
    </div>
  );
}
