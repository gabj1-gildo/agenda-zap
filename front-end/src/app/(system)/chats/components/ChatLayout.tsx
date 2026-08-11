"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewChatModal } from "@/components/NewChatModal";
import { TenantPhoneModal } from "@/components/TenantPhoneModal";
import { getBackendUrl } from "@/lib/api";
import { useChats } from "../hooks/useChats";
import { ChatSidebar } from "./sidebar/ChatSidebar";
import { ChatMainArea } from "./main/ChatMainArea";

interface ChatLayoutProps {
  tenantId: string;
  token: string;
}

export function ChatLayout({ tenantId, token }: ChatLayoutProps) {
  const { data: session } = useSession();
  
  const [tenant, setTenant] = useState<any>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const {
    sessions,
    isLoading: isChatsLoading,
    selectedSession,
    selectedSessionId,
    handleSelectSession,
    isSyncing,
    syncHistory,
    toggleStatus,
    isSending,
    sendMessage,
    handleEditName,
    addNewSession
  } = useChats(tenantId, token);

  const loadTenantData = async () => {
    if (!tenantId) return false;
    try {
      const headers: Record<string, string> = { 'tenant-id': tenantId };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [tenantRes, whatsappRes] = await Promise.all([
        fetch(getBackendUrl('/api/settings/tenant'), { headers, cache: 'no-store' }),
        fetch(getBackendUrl('/api/settings/whatsapp'), { headers, cache: 'no-store' })
      ]);
      
      const tenantData = await tenantRes.json();
      const whatsappData = await whatsappRes.json();
      
      if (tenantData.success) {
        const hasConnectedWhatsapp = 
          (whatsappData.success && Array.isArray(whatsappData.data) && whatsappData.data.some((p: any) => p.evolutionInstanceStatus?.toUpperCase() === 'OPEN' || p.evolutionInstanceStatus?.toUpperCase() === 'CONNECTED')) ||
          tenantData.data?.evolutionInstanceStatus?.toUpperCase() === 'OPEN' ||
          tenantData.data?.evolutionInstanceStatus?.toUpperCase() === 'CONNECTED';

        setTenant({ ...tenantData.data, _hasConnectedWhatsapp: hasConnectedWhatsapp });
        return hasConnectedWhatsapp;
      }
    } catch (err) {
      console.error("Erro ao carregar dados da empresa", err);
    } finally {
      setIsCheckingConnection(false);
    }
    return false;
  };

  useEffect(() => {
    loadTenantData();
  }, [tenantId, token]);

  const hasConnectedWhatsapp = tenant?._hasConnectedWhatsapp ? false 
    : tenant?.whatsappProvider?.toUpperCase() === 'META_CLOUD' ? !(tenant?.whatsappMetaToken && tenant?.whatsappMetaPhoneNumberId)
    : true;

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-120px)] flex bg-card border rounded-2xl overflow-hidden shadow-sm">
      {showPhoneModal && (
        <TenantPhoneModal 
          tenantId={tenantId} 
          onClose={() => {
            setShowPhoneModal(false);
            loadTenantData();
          }} 
        />
      )}

      {showNewChatModal && (
        <NewChatModal
          tenantId={tenantId}
          onClose={() => setShowNewChatModal(false)}
          onSuccess={(newSession) => {
            setShowNewChatModal(false);
            addNewSession(newSession);
          }}
        />
      )}

      {!isCheckingConnection && hasConnectedWhatsapp ? (
        <div className="w-full flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <Smartphone className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold">WhatsApp Desconectado</h3>
          <p className="text-muted-foreground max-w-md">
            Para acessar suas conversas e enviar mensagens, é necessário que o WhatsApp do seu estabelecimento esteja pareado com o sistema.
          </p>
          {(session?.user as any)?.role !== "ATTENDANT" ? (
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button onClick={() => setShowPhoneModal(true)}>
                Conectar WhatsApp Agora
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  const toastId = toast.loading("Sincronizando status...");
                  const isConnected = await loadTenantData();
                  if (isConnected) {
                    toast.success("WhatsApp conectado!", { id: toastId });
                  } else {
                    toast.error("Ainda desconectado.", { id: toastId });
                  }
                }}
              >
                Verificar Conexão
              </Button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-destructive mt-4">
              Solicite ao administrador para conectar o WhatsApp da empresa.
            </p>
          )}
        </div>
      ) : (
        <>
          <ChatSidebar 
            sessions={sessions}
            isLoading={isChatsLoading || isCheckingConnection}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={() => setShowNewChatModal(true)}
          />
          <ChatMainArea 
            session={selectedSession}
            tenantId={tenantId}
            token={token}
            isSyncing={isSyncing}
            onSync={syncHistory}
            onToggleStatus={toggleStatus}
            isSending={isSending}
            onSendMessage={sendMessage}
            onEditName={handleEditName}
          />
        </>
      )}
    </div>
  );
}
