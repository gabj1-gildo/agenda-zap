"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Megaphone, Send, Image as ImageIcon, CheckCircle, Tag, Users, FileText, Smartphone, X, Loader2, User } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TenantPhoneModal } from "@/components/TenantPhoneModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";


export default function BroadcastPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session as any)?.tenantId;

  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Form State
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const [targetType, setTargetType] = useState<"ALL_CLIENTS" | "TAGS">("ALL_CLIENTS");
  const [targetIds, setTargetIds] = useState<string[]>([]);
  
  // Data
  const [tags, setTags] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Template Save State
  const [templateName, setTemplateName] = useState("");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!tenantId) return;
    try {
      const headers: any = { 
        'tenant-id': tenantId,
        ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {})
      };

      const [tenantRes, tagsRes, templatesRes, whatsappRes] = await Promise.all([
        fetch(getBackendUrl('/api/settings/tenant'), { headers }),
        fetch(getBackendUrl('/api/tags'), { headers }),
        fetch(getBackendUrl('/api/broadcast/templates'), { headers }),
        fetch(getBackendUrl('/api/settings/whatsapp'), { headers })
      ]);

      const [tenantData, tagsData, templatesData, whatsappData] = await Promise.all([
        tenantRes.json(), tagsRes.json(), templatesRes.json(), whatsappRes.json()
      ]);

      if (tenantData.success) {
        const hasConnectedWhatsapp = whatsappData.success && whatsappData.data?.some((p: any) => p.evolutionInstanceStatus === 'OPEN');
        setTenant({ ...tenantData.data, _hasConnectedWhatsapp: hasConnectedWhatsapp });
      }
      if (tagsData.success) setTags(tagsData.data);
      if (templatesData.success) setTemplates(templatesData.data);
      
    } catch (err) {
      toast.error("Erro ao carregar dados do disparo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const executeBroadcast = async () => {
    if (targetType === 'TAGS' && targetIds.length === 0) {
      toast.error("Selecione pelo menos uma tag.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(getBackendUrl("/api/broadcast"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "tenant-id": tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {})
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
        setMessage("");
        setMediaUrl("");
      } else {
        toast.error(json.error || json.message || "Erro ao realizar disparo");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setSending(false);
      setShowConfirm(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !message.trim()) {
      toast.error("Preencha o nome e o texto do template.");
      return;
    }

    const toastId = toast.loading("Salvando template...");
    try {
      const res = await fetch(getBackendUrl('/api/broadcast/templates'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: templateName, content: message, mediaUrl })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Template salvo!", { id: toastId });
        setTemplates([data.data, ...templates]);
        setTemplateName("");
      } else {
        toast.error(data.error || "Erro ao salvar template", { id: toastId });
      }
    } catch (err) {
      toast.error("Erro de conexão", { id: toastId });
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingMedia(true);
    const toastId = toast.loading("Enviando mídia...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "broadcast");

    try {
      const headers: any = {};
      if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }
      if (tenantId) headers['tenant-id'] = tenantId;

      const res = await fetch(getBackendUrl('/api/upload'), {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setMediaUrl(data.url);
        toast.success("Mídia enviada com sucesso!", { id: toastId });
      } else {
        toast.error(data.error || "Erro ao enviar mídia", { id: toastId });
      }
    } catch (err) {
      toast.error("Erro na conexão", { id: toastId });
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      toast.error("Nenhuma empresa selecionada.");
      return;
    }
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

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + variable);
  };

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse">Carregando painel de disparo...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 animate-in fade-in zoom-in-95 duration-300">
      
      <ConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmar Disparo em Massa"
        description={`Você está prestes a disparar esta mensagem para ${targetType === 'ALL_CLIENTS' ? 'TODOS OS CLIENTES' : 'as TAGS SELECIONADAS'}. Esta ação não pode ser desfeita e consumirá recursos de disparo. Certifique-se de não violar as políticas do WhatsApp contra SPAM.`}
        onConfirm={executeBroadcast}
        confirmText={sending ? "Enviando..." : "Sim, Disparar Agora"}
      />

      {showPhoneModal && (
        <TenantPhoneModal 
          tenantId={tenantId} 
          onClose={() => {
            setShowPhoneModal(false);
            loadData();
          }} 
        />
      )}



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Abas de Criação e Destinatários */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="nova-mensagem" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="nova-mensagem" className="rounded-lg">Nova Mensagem</TabsTrigger>
              <TabsTrigger value="templates" className="rounded-lg">Meus Templates</TabsTrigger>

            </TabsList>
            
            <TabsContent value="nova-mensagem" className="space-y-6 mt-6">
              
              <Card className="p-6 bg-card border-border/50 shadow-sm rounded-2xl">
                <form onSubmit={handleBroadcast} className="space-y-6">
                  
                  {/* Destinatários */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" /> Público Alvo
                    </Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label 
                        className={`
                          flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200
                          ${targetType === 'ALL_CLIENTS' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="targetType" 
                            checked={targetType === 'ALL_CLIENTS'} 
                            onChange={() => setTargetType('ALL_CLIENTS')}
                            className="w-4 h-4 text-primary accent-primary" 
                          />
                          <div className="font-semibold text-sm">Todos os Clientes</div>
                        </div>
                        <p className="text-xs text-muted-foreground ml-7 mt-1">Disparar para todos os contatos válidos.</p>
                      </label>

                      <label 
                        className={`
                          flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200
                          ${targetType === 'TAGS' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="targetType" 
                            checked={targetType === 'TAGS'} 
                            onChange={() => setTargetType('TAGS')}
                            className="w-4 h-4 text-primary accent-primary" 
                          />
                          <div className="font-semibold text-sm">Filtrar por Tags</div>
                        </div>
                        <p className="text-xs text-muted-foreground ml-7 mt-1">Selecionar grupos específicos.</p>
                      </label>
                    </div>

                    {targetType === 'TAGS' && (
                      <div className="p-4 rounded-xl border bg-muted/20 mt-4 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-sm font-medium mb-3 block">Selecione as Tags (Grupos)</Label>
                        {tags.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Nenhuma tag cadastrada ainda. Crie tags na aba de Clientes.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {tags.map(tag => {
                              const isSelected = targetIds.includes(tag.id);
                              return (
                                <Badge 
                                  key={tag.id}
                                  variant={isSelected ? "default" : "outline"}
                                  className="cursor-pointer text-xs py-1.5 px-3 transition-all"
                                  style={isSelected ? { backgroundColor: tag.color, color: '#fff', borderColor: tag.color } : {}}
                                  onClick={() => {
                                    setTargetIds(prev => 
                                      isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                                    );
                                  }}
                                >
                                  <Tag className="w-3 h-3 mr-1.5 opacity-70" />
                                  {tag.name}
                                </Badge>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Composição da Mensagem */}
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
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,application/pdf" onChange={handleMediaUpload} />
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
                      <Button type="button" variant="secondary" className="h-9 shrink-0" onClick={saveTemplate}>
                        Salvar Template
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6">
                    {(
                      tenant?._hasConnectedWhatsapp ? false 
                      : tenant?.whatsappProvider?.toUpperCase() === 'META_CLOUD' ? !(tenant?.whatsappMetaToken && tenant?.whatsappMetaPhoneNumberId)
                      : true
                    ) ? (
                      <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm font-medium">
                          <Smartphone className="w-5 h-5" />
                          WhatsApp Desconectado. Conecte para disparar.
                        </div>
                        <Button type="button" variant="destructive" size="sm" onClick={() => setShowPhoneModal(true)}>
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
            </TabsContent>

            <TabsContent value="templates" className="mt-6 space-y-4">
              {templates.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-muted/10 text-muted-foreground">
                  Nenhum template salvo ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tpl => (
                    <Card key={tpl.id} className="p-5 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => {
                      setMessage(tpl.content);
                      setMediaUrl(tpl.mediaUrl || "");
                      toast.success("Template carregado no editor.");
                    }}>
                      <div className="font-semibold text-sm mb-2 text-foreground flex justify-between items-start">
                        {tpl.name}
                        <CheckCircle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {tpl.content}
                      </p>
                      {tpl.mediaUrl && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
                          <ImageIcon className="w-3 h-3" /> Contém Mídia
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>


          </Tabs>
        </div>

        {/* Lado Direito: Preview */}
        <div className="hidden lg:block relative">
          <div className="sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Preview (Visão do Cliente)</h3>
            
            {/* Simulador de Celular - Tela Curva Dinâmica */}
            <div className="relative w-[340px] h-[680px]">
              {/* Chassi do Celular (Escuro no Light Mode, Prata no Dark Mode) */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-900 to-black dark:from-zinc-200 dark:via-zinc-400 dark:to-zinc-300 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(255,255,255,0.1)_inset] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(255,255,255,0.5)_inset] flex flex-col p-[3px] box-border overflow-visible transition-colors duration-300">
                
                {/* Botões Físicos */}
                {/* Volume Up */}
                <div className="absolute top-[120px] -left-[3px] w-[4px] h-[40px] bg-gradient-to-r from-zinc-600 to-zinc-800 dark:from-zinc-300 dark:to-zinc-400 rounded-l-md border-y border-l border-zinc-900/50 dark:border-zinc-400/50 transition-colors duration-300"></div>
                {/* Volume Down */}
                <div className="absolute top-[170px] -left-[3px] w-[4px] h-[40px] bg-gradient-to-r from-zinc-600 to-zinc-800 dark:from-zinc-300 dark:to-zinc-400 rounded-l-md border-y border-l border-zinc-900/50 dark:border-zinc-400/50 transition-colors duration-300"></div>
                {/* Power */}
                <div className="absolute top-[150px] -right-[3px] w-[4px] h-[55px] bg-gradient-to-l from-zinc-600 to-zinc-800 dark:from-zinc-300 dark:to-zinc-400 rounded-r-md border-y border-r border-zinc-900/50 dark:border-zinc-400/50 transition-colors duration-300"></div>

                {/* Tela Interna Infinita */}
                <div className="relative w-full flex-1 bg-[#efeae2] rounded-[2.4rem] overflow-hidden flex flex-col ring-1 ring-black/10">
                  
                  {/* Status Bar */}
                  <div className="absolute top-0 inset-x-0 h-9 flex justify-between px-7 items-center z-50 pointer-events-none bg-black/20 backdrop-blur-md">
                    <span className="text-[11px] font-medium text-white tracking-tight mt-0.5">
                      {currentTime ? currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                    </span>
                    <div className="flex gap-1.5 items-center mt-0.5">
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C7.3 3 3.1 5.1 0 8.3L12 21L24 8.3C20.9 5.1 16.7 3 12 3Z"/></svg>
                      <div className="w-5 h-2.5 border border-white/80 rounded-[3px] p-[1px] flex relative">
                        <div className="bg-white w-full h-full rounded-[1.5px]"></div>
                        <div className="absolute -right-1 top-[2.5px] w-[2px] h-1 bg-white/80 rounded-r-sm"></div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Island / Punch Hole Notch */}
                  <div className="absolute top-2.5 inset-x-0 h-6 flex justify-center z-50 pointer-events-none">
                    <div className="w-24 h-6 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md ring-1 ring-white/10">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-blue-500/30 rounded-full blur-[1px]"></div>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-emerald-500/80 shadow-[0_0_4px_#10b981]"></div>
                    </div>
                  </div>

                  {/* Header do Zap */}
                  <div className="bg-[#00a884] px-4 pt-10 pb-3 text-white flex items-center gap-3 shadow-sm z-10 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-semibold text-sm truncate">{tenant?.name || 'Sua Empresa'}</div>
                      <div className="text-[10px] opacity-80 truncate">Conta Comercial</div>
                    </div>
                  </div>

                  {/* Corpo das mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative pb-10" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain', backgroundRepeat: 'repeat' }}>
                    
                    {/* Efeito de Vidro Curvo (Reflexos Laterais Escuros estilo Imagem) */}
                    <div className="absolute inset-0 pointer-events-none z-20 flex justify-between mix-blend-multiply">
                      {/* Reflexo Esquerdo */}
                      <div className="w-4 h-full bg-gradient-to-r from-black/40 to-transparent"></div>
                      {/* Reflexo Direito */}
                      <div className="w-4 h-full bg-gradient-to-l from-black/40 to-transparent"></div>
                    </div>
                    
                    {/* Gradiente de Borda Inferior/Superior da Tela (Profundidade) */}
                    <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_10px_20px_-10px_rgba(0,0,0,0.5),_inset_0_-10px_20px_-10px_rgba(0,0,0,0.5)]"></div>
                
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
                          onClick={() => setMediaUrl("")}
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
              
              {/* Barra de Navegação por Gestos (Samsung Style) */}
              <div className="absolute bottom-1.5 inset-x-0 h-4 flex justify-center items-center pointer-events-none z-50">
                <div className="w-28 h-1 bg-zinc-800/40 backdrop-blur-md rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
          {/* Sombra de Reflexo */}
            <div className="absolute -bottom-8 left-4 right-4 h-8 bg-black/20 blur-xl rounded-[100%] opacity-50 -z-10 pointer-events-none"></div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
