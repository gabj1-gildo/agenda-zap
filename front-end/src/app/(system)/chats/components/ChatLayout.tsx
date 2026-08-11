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
            isDisconnected={hasConnectedWhatsapp}
            isCheckingConnection={isCheckingConnection}
            onConnect={() => setShowPhoneModal(true)}
            onCheckConnection={async () => {
              const toastId = toast.loading("Sincronizando status...");
              const isConnected = await loadTenantData();
              if (isConnected) {
                toast.success("WhatsApp conectado!", { id: toastId });
              } else {
                toast.error("Ainda desconectado.", { id: toastId });
              }
            }}
            userRole={(session?.user as any)?.role}
          />
    </div>
  );
}
