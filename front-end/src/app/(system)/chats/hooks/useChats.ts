import { useState, useEffect } from "react";
import useSWR from "swr";
import { getBackendUrl } from "@/lib/api";
import { ChatSession, Message } from "../types/chats.types";

export function useChats(tenantId: string | undefined, token: string | undefined) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // States for specific actions
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetcher = (url: string) => {
    const headers: Record<string, string> = { 'tenant-id': tenantId || '' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { headers }).then(res => res.json());
  };

  const { data: chatsResponse, isLoading } = useSWR(
    (tenantId && token) ? getBackendUrl('/api/chats') : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  useEffect(() => {
    if (chatsResponse?.success) {
      setSessions(chatsResponse.data);
    }
  }, [chatsResponse]);

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null;

  const handleSelectSession = async (session: ChatSession) => {
    setSelectedSessionId(session.id);
    if (session.hasUnread) {
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, hasUnread: false } : s));
      try {
        await fetch(getBackendUrl(`/api/chats/${session.id}/read`), {
          method: 'POST',
          headers: { 'tenant-id': tenantId || '', 'Authorization': `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
  };

  const syncHistory = async () => {
    if (!selectedSession) return;
    setIsSyncing(true);
    try {
      const response = await fetch(getBackendUrl(`/api/chats/${selectedSession.id}/sync`), {
        method: 'POST',
        headers: { 'tenant-id': tenantId || '', 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (json.success) {
        setSessions(prev => prev.map(s => s.id === selectedSession.id ? json.data : s));
      } else {
        alert("Erro ao sincronizar histórico.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao sincronizar histórico.");
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleStatus = async () => {
    if (!selectedSession) return;
    const newStatus = selectedSession.status === 'ACTIVE' ? 'HUMAN' : 'ACTIVE';
    const newFunnelStage = newStatus === 'HUMAN' ? 'atendimento_humano' : 'atendimento_ia';

    setSessions(prev => prev.map(s => s.id === selectedSession.id ? { 
      ...s, 
      status: newStatus,
      client: { ...s.client, funnelStage: newFunnelStage }
    } : s));

    try {
      const response = await fetch(getBackendUrl(`/api/chats/${selectedSession.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId || '', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await response.json();
      if (!json.success) {
        setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, status: selectedSession.status, client: selectedSession.client } : s));
        alert("Erro ao alterar o status do atendimento.");
      }
    } catch (error) {
      console.error(error);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, status: selectedSession.status, client: selectedSession.client } : s));
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!selectedSession || !messageText.trim()) return;

    setIsSending(true);
    const optimisticMessage: Message = { role: 'system', content: messageText };
    
    setSessions(prev => prev.map(s => {
      if (s.id === selectedSession.id) {
        return { 
          ...s, 
          status: 'HUMAN',
          client: { ...s.client, funnelStage: 'atendimento_humano' },
          history: [...(s.history || []), optimisticMessage] 
        };
      }
      return s;
    }));

    try {
      const response = await fetch(getBackendUrl(`/api/chats/${selectedSession.id}/send`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId || '', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: messageText })
      });
      const json = await response.json();
      if (!json.success) {
        alert("Erro ao enviar mensagem.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  const handleEditName = async () => {
    if (!selectedSession) return;
    const currentName = selectedSession.client?.name || "";
    const newName = window.prompt("Digite o novo nome para este cliente:", currentName);
    
    if (newName && newName.trim() !== "" && newName !== currentName) {
      try {
        const response = await fetch(getBackendUrl(`/api/clients/${selectedSession.client.id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId || '' },
          body: JSON.stringify({ name: newName.trim() })
        });
        const json = await response.json();
        
        if (json.success) {
          setSessions(prev => prev.map(s => 
            s.client.id === selectedSession.client.id 
              ? { ...s, client: { ...s.client, name: newName.trim() } } 
              : s
          ));
        } else {
          alert("Erro ao atualizar o nome do cliente.");
        }
      } catch (error) {
        console.error(error);
        alert("Erro de conexão ao atualizar nome.");
      }
    }
  };

  const addNewSession = (newSession: ChatSession) => {
    setSessions(prev => {
      const existing = prev.find(s => s.id === newSession.id);
      if (existing) {
        return prev.map(s => s.id === newSession.id ? newSession : s);
      }
      return [newSession, ...prev];
    });
    setSelectedSessionId(newSession.id);
  };

  return {
    sessions,
    isLoading,
    selectedSession,
    selectedSessionId,
    handleSelectSession,
    isSyncing,
    syncHistory,
    toggleStatus,
    isSending,
    sendMessage,
    handleEditName,
    addNewSession,
  };
}
