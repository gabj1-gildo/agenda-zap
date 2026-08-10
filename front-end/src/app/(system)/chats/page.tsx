"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { MessageSquare, Phone, User, Bot, AlertCircle, Send, Play, Pause, Search, RefreshCw, Pencil, Plus, Filter, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; 
import { NewChatModal } from "@/components/NewChatModal";
import { ClientTags } from "@/components/ClientTags";
import { TenantPhoneModal } from "@/components/TenantPhoneModal";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";

type Message = {
  role: "user" | "system" | "model";
  content: string;
};

type Client = {
  id: string;
  name: string;
  whatsappName?: string;
  phone: string;
  status?: string;
  funnelStage?: string;
  clientTags?: any[];
};

type ChatSession = {
  id: string;
  clientId: string;
  status: string; // 'ACTIVE' ou 'HUMAN'
  hasUnread?: boolean;
  history: Message[];
  updatedAt: string;
  client: Client;
};

export default function ChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const { data: session } = useSession();

  const tenantId = (session as any)?.tenantId;
  const token = (session?.user as any)?.accessToken;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getFunnelBadgeColor = (stage?: string) => {
    switch (stage?.toUpperCase()) {
      case 'LEAD': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ATENDIMENTO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'AGENDADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'CONCLUÍDO': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusColor = (status?: string) => {
    return status?.toUpperCase() === 'INATIVO' ? 'bg-rose-500' : 'bg-emerald-500';
  };

  // Auto scroll para o final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedSession?.history]);

  const syncHistory = async () => {
    if (!selectedSession) return;
    setIsSyncing(true);
    try {
      const response = await fetch(getBackendUrl(`/api/chats/${selectedSession.id}/sync`), {
        method: 'POST',
        headers: { 'tenant-id': tenantId, 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (json.success) {
        setSelectedSession(json.data);
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

  const handleEditName = async () => {
    if (!selectedSession) return;
    const currentName = selectedSession.client?.name || "";
    const newName = window.prompt("Digite o novo nome para este cliente:", currentName);
    
    if (newName && newName.trim() !== "" && newName !== currentName) {
      try {
        const response = await fetch(getBackendUrl(`/api/clients/${selectedSession.client.id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId },
          body: JSON.stringify({ name: newName.trim() })
        });
        const json = await response.json();
        
        if (json.success) {
          // Update local state
          setSelectedSession(prev => {
            if (!prev) return null;
            return {
              ...prev,
              client: { ...prev.client, name: newName.trim() }
            };
          });
          
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

  const fetcher = (url: string) => {
    const headers: Record<string, string> = { 'tenant-id': tenantId };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { headers }).then(res => res.json());
  };

  const { data: chatsResponse } = useSWR(
    (tenantId && token) ? getBackendUrl('/api/chats') : null,
    fetcher,
    { refreshInterval: 3000 } // Polling silencioso a cada 3s
  );

  useEffect(() => {
    if (chatsResponse?.success) {
      setSessions(chatsResponse.data);
      setSelectedSession(prev => {
        if (!prev) return null;
        const updated = chatsResponse.data.find((s: ChatSession) => s.id === prev.id);
        return updated || prev;
      });
    }
  }, [chatsResponse]);

  const loadTenantData = async () => {
    if (!tenantId) return;
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
      setLoading(false);
    }
    return false;
  };

  useEffect(() => {
    loadTenantData();
  }, [tenantId, token]);

  const handleSelectSession = async (session: ChatSession) => {
    setSelectedSession(session);
    if (session.hasUnread) {
      // Optimistic update
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, hasUnread: false } : s));
      try {
        await fetch(getBackendUrl(`/api/chats/${session.id}/read`), {
          method: 'POST',
          headers: { 'tenant-id': tenantId, 'Authorization': `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
  };

  const toggleStatus = async () => {
    if (!selectedSession) return;
    const newStatus = selectedSession.status === 'ACTIVE' ? 'HUMAN' : 'ACTIVE';
    const newFunnelStage = newStatus === 'HUMAN' ? 'atendimento_humano' : 'atendimento_ia';

    // Optimistic update
    setSelectedSession(prev => prev ? { 
      ...prev, 
      status: newStatus,
      client: { ...prev.client, funnelStage: newFunnelStage }
    } : null);

    try {
      const response = await fetch(getBackendUrl(`/api/chats/${selectedSession.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await response.json();
      if (!json.success) {
        // Revert on failure
        setSelectedSession(prev => prev ? { ...prev, status: selectedSession.status } : null);
        alert("Erro ao alterar o status do atendimento.");
      }
    } catch (error) {
      console.error(error);
      setSelectedSession(prev => prev ? { ...prev, status: selectedSession.status } : null);
    }
  };

  const sendMessage = async () => {
    if (!selectedSession || !inputText.trim()) return;

    setIsSending(true);
    const messageToSend = inputText.trim();
    setInputText(""); // Limpa o input

    // Optimistic UI update
    const optimisticMessage: Message = { role: 'system', content: messageToSend };
    setSelectedSession(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        status: 'HUMAN',
        client: { ...prev.client, funnelStage: 'atendimento_humano' },
        history: [...(prev.history || []), optimisticMessage] 
      };
    });

    try {
      const response = await fetch(getBackendUrl(`/api/chats/${selectedSession.id}/send`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: messageToSend })
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredSessions = sessions.filter(session => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      session.client.name?.toLowerCase().includes(term) ||
      session.client.phone.includes(term) ||
      session.history.some(msg => msg.content.toLowerCase().includes(term))
    );

    let matchesRead = true;
    if (readFilter === "unread") {
      matchesRead = session.hasUnread === true;
    }

    return matchesSearch && matchesRead;
  });

  const unreadCount = sessions.filter(s => s.hasUnread).length;

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

      {loading ? (
        <div className="w-full flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        (tenant?.whatsappProvider === 'EVOLUTION' || !tenant?.whatsappProvider)
          ? !tenant?._hasConnectedWhatsapp
          : !(tenant?.whatsappMetaToken && tenant?.whatsappMetaPhoneNumberId)
      ) ? (
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
          {showNewChatModal && (
        <NewChatModal
          tenantId={tenantId}
          onClose={() => setShowNewChatModal(false)}
          onSuccess={(newSession) => {
            setShowNewChatModal(false);
            // Append or update session
            setSessions(prev => {
              const existing = prev.find(s => s.id === newSession.id);
              if (existing) {
                return prev.map(s => s.id === newSession.id ? newSession : s);
              }
              return [newSession, ...prev];
            });
            setSelectedSession(newSession);
          }}
        />
      )}

      {/* Sidebar de Chats */}
      <div className="w-80 min-w-[320px] bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-sm shrink-0">
        <div className="p-4 border-b border-border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-foreground">
                Conversas
              </h2>
              <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-widest">
                {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              title="Nova Conversa"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-2 relative">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar cliente..."
                  className="pl-9 h-9 border-muted bg-background/50 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                title="Filtros"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-colors shrink-0 ${
                  showFilterMenu ? 'bg-muted border-muted' : 'border-muted hover:bg-muted/50'
                }`}
              >
                <Filter className="w-4 h-4 text-muted-foreground" />
              </button>

              {showFilterMenu && (
                <div className="absolute top-11 right-0 w-56 bg-card border border-muted rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 text-xs font-bold text-muted-foreground">Filtrar por</div>
                  <div className="flex flex-col">
                    <button className="px-3 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors flex justify-between items-center">
                      <span>👥 Atendentes</span>
                      <span className="text-muted-foreground text-xs">{'>'}</span>
                    </button>
                    <button className="px-3 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors flex justify-between items-center">
                      <span>🏷️ Tags</span>
                      <span className="text-muted-foreground text-xs">{'>'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setReadFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  readFilter === 'all' 
                    ? 'bg-blue-600/10 text-blue-500 border border-blue-500/30' 
                    : 'border border-muted text-muted-foreground hover:bg-muted/50'
                }`}
              >
                Tudo
              </button>
              <button
                onClick={() => setReadFilter('unread')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  readFilter === 'unread' 
                    ? 'bg-blue-600/10 text-blue-500 border border-blue-500/30' 
                    : 'border border-muted text-muted-foreground hover:bg-muted/50'
                }`}
              >
                Não lidas
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex justify-center items-center h-full">
              Carregando...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
              Nenhuma conversa encontrada
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors focus:outline-none ${selectedSession?.id === session.id ? "bg-accent border-l-4 border-primary" : "border-l-4 border-transparent"
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(session.client?.status)}`} />
                      <span className={`font-medium truncate ${session.hasUnread ? 'text-blue-500 font-bold' : ''}`}>
                        {session.client?.name || (session.client?.whatsappName ? `@${session.client.whatsappName}` : "Desconhecido")}
                      </span>
                      {session.hasUnread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm flex items-center justify-between mt-1">
                    <div className="text-muted-foreground flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {session.client?.phone}
                    </div>
                    <div className="flex gap-1">
                      {session.client?.funnelStage && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getFunnelBadgeColor(session.client.funnelStage)}`}>
                          {session.client.funnelStage.toUpperCase()}
                        </span>
                      )}
                      {session.status === 'HUMAN' && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                          HUMANO
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visualizador do Chat */}
      <div className="flex-1 bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-sm min-w-0">
        {selectedSession ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <div className="overflow-hidden min-w-0 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shrink-0 ${getStatusColor(selectedSession.client?.status)}`} title={`Status: ${selectedSession.client?.status || 'Ativo'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                      {selectedSession.client?.name || (selectedSession.client?.whatsappName ? `@${selectedSession.client.whatsappName}` : "Desconhecido")}
                      <button onClick={handleEditName} className="text-muted-foreground hover:text-primary transition-colors" title="Editar nome">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </h3>
                    {selectedSession.client?.funnelStage && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getFunnelBadgeColor(selectedSession.client.funnelStage)}`}>
                        {selectedSession.client.funnelStage.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center mt-1 mb-1">
                    <Phone className="w-3 h-3 mr-1 shrink-0" />
                    <span className="truncate">{selectedSession.client?.phone}</span>
                  </div>
                  <ClientTags 
                    clientId={selectedSession.client.id}
                    tenantId={tenantId}
                    initialTags={selectedSession.client.clientTags?.map((ct: any) => ct.tag) || []}
                  />
                </div>
              </div>

              <button
                onClick={syncHistory}
                disabled={isSyncing}
                title="Sincronizar mensagens da Evolution API"
                className="ml-auto shrink-0 p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
              </button>

              <button
                onClick={toggleStatus}
                className={`ml-3 shrink-0 px-4 py-2 rounded-md font-medium text-sm flex items-center transition-colors ${selectedSession.status === 'ACTIVE'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
              >
                {selectedSession.status === 'ACTIVE' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Assumir Atendimento
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Devolver para IA
                  </>
                )}
              </button>
            </div> {/* <-- CORREÇÃO: DIV FECHADA AQUI */}

            {/* Histórico de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-slate-50/50">
              {selectedSession.history && selectedSession.history.length > 0 ? (
                selectedSession.history.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={index} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[70%] sm:max-w-[80%] rounded-2xl px-4 py-2 shadow-sm break-words ${isUser
                          ? 'bg-white border border-slate-200 rounded-tl-sm text-slate-800'
                          : 'bg-primary/10 text-primary-900 border border-primary/20 rounded-tr-sm'
                          }`}
                      >
                        <div className="flex items-center mb-1 space-x-1 opacity-60">
                          {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            {isUser ? 'Cliente' : (msg.role === 'system' ? 'Você / Bot' : 'Bot')}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sem histórico de mensagens
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Envio de Mensagem */}
            <div className="p-4 border-t border-border bg-white">
              {selectedSession.status === 'ACTIVE' && (
                <div className="mb-2 text-xs text-orange-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Atenção: A IA está ativa. Se você enviar uma mensagem, o cliente vai receber, mas a IA continuará respondendo. Recomendamos "Assumir Atendimento" primeiro.
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem (Enter para enviar, Shift+Enter para quebrar linha)..."
                  className="flex-1 min-h-[44px] max-h-32 p-3 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isSending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shrink-0 h-[44px]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </> // <-- CORREÇÃO: FRAGMENTO FECHADO AQUI
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 bg-slate-50/50">
            <MessageSquare className="w-16 h-16 mb-4 text-slate-300" />
            <p>Selecione uma conversa para visualizar o histórico</p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}