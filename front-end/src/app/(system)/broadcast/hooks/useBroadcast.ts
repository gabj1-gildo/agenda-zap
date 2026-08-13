import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { BroadcastTemplate, TargetType, BroadcastTag } from "../types/broadcast.types";

interface UseBroadcastProps {
  tenantId: string;
  token?: string;
  initialTemplates: BroadcastTemplate[];
  initialTags: BroadcastTag[];
}

export function useBroadcast({ tenantId, token, initialTemplates, initialTags }: UseBroadcastProps) {
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const getHeaders = () => {
    return {
      'tenant-id': tenantId,
      ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {})
    };
  };

  const fetcher = async (url: string) => {
    const res = await fetch(getBackendUrl(url), { headers: getHeaders() });
    const json = await res.json();
    return json;
  };

  const { data: templatesData, mutate: mutateTemplates } = useSWR(
    '/api/broadcast/templates',
    fetcher,
    { fallbackData: { success: true, data: initialTemplates } }
  );

  const { data: tagsData } = useSWR(
    '/api/tags',
    fetcher,
    { fallbackData: { success: true, data: initialTags } }
  );

  const templates = templatesData?.success ? templatesData.data : [];
  const tags = tagsData?.success ? tagsData.data : [];
  


  const executeBroadcast = async (
    targetType: TargetType,
    targetIds: string[],
    message: string,
    mediaUrl: string
  ) => {
    if (targetType === 'TAGS' && targetIds.length === 0) {
      toast.error("Selecione pelo menos uma tag.");
      return false;
    }
    if (!message.trim()) {
      toast.error("A mensagem não pode estar vazia.");
      return false;
    }

    setSending(true);
    try {
      const res = await fetch(getBackendUrl("/api/broadcast"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...getHeaders()
        },
        body: JSON.stringify({ 
          message, 
          target: targetType === 'ALL_CLIENTS' ? 'ALL_CLIENTS' : 'CUSTOM',
          targetType,
          targetIds,
          mediaUrl
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Disparo concluído!");
        return true;
      } else {
        toast.error(json.error || json.message || "Erro ao realizar disparo");
        return false;
      }
    } catch (error) {
      toast.error("Erro de conexão");
      return false;
    } finally {
      setSending(false);
    }
  };

  const saveTemplate = async (templateName: string, message: string, mediaUrl: string) => {
    if (!templateName.trim() || !message.trim()) {
      toast.error("Preencha o nome e o texto do template.");
      return false;
    }

    const toastId = toast.loading("Salvando template...");
    try {
      const res = await fetch(getBackendUrl('/api/broadcast/templates'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ name: templateName, content: message, mediaUrl })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Template salvo!", { id: toastId });
        mutateTemplates();
        return true;
      } else {
        toast.error(data.error || "Erro ao salvar template", { id: toastId });
        return false;
      }
    } catch (err) {
      toast.error("Erro de conexão", { id: toastId });
      return false;
    }
  };

  const handleMediaUpload = async (file: File) => {
    setUploadingMedia(true);
    const toastId = toast.loading("Enviando mídia...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "broadcast");

    try {
      const res = await fetch(getBackendUrl('/api/upload'), {
        method: 'POST',
        headers: getHeaders(),
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Mídia enviada com sucesso!", { id: toastId });
        return data.url;
      } else {
        toast.error(data.error || "Erro ao enviar mídia", { id: toastId });
        return null;
      }
    } catch (err) {
      toast.error("Erro na conexão", { id: toastId });
      return null;
    } finally {
      setUploadingMedia(false);
    }
  };

  return {
    sending,
    uploadingMedia,
    templates,
    tags,
    executeBroadcast,
    saveTemplate,
    handleMediaUpload
  };
}
