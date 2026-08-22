"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Settings, Save, AlertCircle, Smartphone, RefreshCw, Cpu, Key, Radio } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { SystemPhoneModal } from "@/components/SystemPhoneModal";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [instanceKey, setInstanceKey] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("DISCONNECTED");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // IA Settings
  const [globalAiProvider, setGlobalAiProvider] = useState("gemini");
  const [globalAiModel, setGlobalAiModel] = useState("gemini-2.5-flash");
  const [availableAiModels, setAvailableAiModels] = useState<any[]>([]);

  const token = (session?.user as any)?.accessToken;

  useEffect(() => {
    if (!token) return;
    
    async function fetchSettings() {
      try {
        const [res, resModels] = await Promise.all([
          fetch(getBackendUrl("/api/admin/system-settings"), {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(getBackendUrl("/api/admin/ai-models"), {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);
        
        const json = await res.json();
        const jsonModels = await resModels.json();
        
        if (jsonModels.success) {
          setAvailableAiModels(jsonModels.data);
        }
        
        if (json.success && json.data) {
          const nameSetting = json.data.find((s: any) => s.key === "whatsapp_default_instance_name");
          const keySetting = json.data.find((s: any) => s.key === "whatsapp_default_api_key");
          const statusSetting = json.data.find((s: any) => s.key === "whatsapp_default_status");
          
          const aiProviderSetting = json.data.find((s: any) => s.key === "global_ai_provider");
          const aiModelSetting = json.data.find((s: any) => s.key === "global_ai_model");
          
          if (nameSetting) setInstanceName(nameSetting.value);
          if (keySetting) setInstanceKey(keySetting.value);
          if (statusSetting) setConnectionStatus(statusSetting.value);
          if (aiProviderSetting) setGlobalAiProvider(aiProviderSetting.value);
          if (aiModelSetting) setGlobalAiModel(aiModelSetting.value);
        }
      } catch (error) {
        toast.error("Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, [token]);

  const checkLiveStatus = async () => {
    if (!token) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(getBackendUrl("/api/admin/system-settings/phone"), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConnectionStatus(data.data.status);
      }
    } catch (e) {
      // ignore
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    
    try {
      const resName = await fetch(getBackendUrl("/api/admin/system-settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ key: "whatsapp_default_instance_name", value: instanceName, description: "Instância padrão do sistema para envios globais" })
      });
      
      const resKey = await fetch(getBackendUrl("/api/admin/system-settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ key: "whatsapp_default_api_key", value: instanceKey, description: "Token da instância do sistema" })
      });

      const resAiProvider = await fetch(getBackendUrl("/api/admin/system-settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ key: "global_ai_provider", value: globalAiProvider, description: "Provider global de Inteligência Artificial" })
      });
      
      const resAiModel = await fetch(getBackendUrl("/api/admin/system-settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ key: "global_ai_model", value: globalAiModel, description: "Modelo global de IA padrão" })
      });

      if (resName.ok && resKey.ok && resAiProvider.ok && resAiModel.ok) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        toast.error("Erro ao salvar algumas configurações");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando configurações do sistema...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      <form onSubmit={handleSave} className="space-y-8">

        {/* Card 1: Instância de WhatsApp do Sistema */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-500" />
                Instância WhatsApp do Sistema
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Instância utilizada para disparos, avisos de sistema e notificações operacionais.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {connectionStatus === "OPEN" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Desconectado
                  </span>
                )}
                <button
                  type="button"
                  onClick={checkLiveStatus}
                  disabled={checkingStatus}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                  title="Atualizar Status"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingStatus ? "animate-spin" : ""}`} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowPhoneModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-colors shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                Conectar WhatsApp
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Nome da Instância
              </label>
              <input
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Ex: sistema-agenda-zap"
                required
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-primary" /> Token da Instância
              </label>
              <input
                type="text"
                value={instanceKey}
                onChange={(e) => setInstanceKey(e.target.value)}
                placeholder="Ex: B6254EF1-9A32-4781-..."
                required
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background font-mono text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
              />
              <p className="text-[11px] text-muted-foreground">
                Token API da instância comum do WhatsApp configurada na Evolution API.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Inteligência Artificial Global */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              Inteligência Artificial Global
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Defina o provedor e o modelo padrão que atenderão as automações globais.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Provedor de IA Padrão</label>
                <select
                  value={globalAiProvider}
                  onChange={(e) => setGlobalAiProvider(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  <option value="gemini">Google Gemini (SDK Nativo)</option>
                  <option value="groq">Groq (OpenAI Compatible)</option>
                  <option value="deepseek">DeepSeek (OpenAI Compatible)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  A chave de API correspondente deve estar no arquivo .env do servidor.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Modelo de IA Padrão</label>
                <select
                  value={globalAiModel}
                  onChange={(e) => setGlobalAiModel(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Selecione um modelo...</option>
                  {availableAiModels.filter(m => m.provider === globalAiProvider).map(m => (
                    <option key={m.id} value={m.modelId}>{m.name} {m.isActive ? '' : '(Inativo)'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gerenciamento de Modelos */}
            <div className="pt-6 border-t border-border space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Modelos de IA Cadastrados
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableAiModels.map(model => (
                  <div key={model.id} className="p-4 bg-muted/20 border border-border rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-foreground">{model.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{model.modelId}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${model.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                        Provedor: {model.provider} | {model.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button 
                        type="button"
                        onClick={async () => {
                          const res = await fetch(getBackendUrl(`/api/admin/ai-models/${model.id}`), {
                            method: "PUT",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({ ...model, isActive: !model.isActive })
                          });
                          if (res.ok) {
                            setAvailableAiModels(prev => prev.map(m => m.id === model.id ? { ...m, isActive: !m.isActive } : m));
                            toast.success("Status atualizado!");
                          }
                        }}
                        className="text-xs px-3 py-1 rounded-lg border border-border font-semibold hover:bg-muted transition-colors"
                      >
                        {model.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                      <button 
                        type="button"
                        onClick={async () => {
                          if(!confirm("Excluir este modelo?")) return;
                          const res = await fetch(getBackendUrl(`/api/admin/ai-models/${model.id}`), {
                            method: "DELETE",
                            headers: { "Authorization": `Bearer ${token}` }
                          });
                          if (res.ok) {
                            setAvailableAiModels(prev => prev.filter(m => m.id !== model.id));
                            toast.success("Excluído com sucesso!");
                          }
                        }}
                        className="text-xs px-3 py-1 rounded-lg border border-red-500/20 text-red-500 font-semibold hover:bg-red-500/10 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Novo Modelo */}
              <div className="p-4 border border-dashed border-border rounded-xl bg-card">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Adicionar Novo Modelo</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select id="newProvider" className="border border-border rounded-xl px-3 py-2 text-sm bg-background">
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq</option>
                    <option value="deepseek">DeepSeek</option>
                  </select>
                  <input id="newModelId" placeholder="ID (ex: llama-3.1-8b-instant)" className="border border-border rounded-xl px-3 py-2 text-sm bg-background font-mono" />
                  <input id="newName" placeholder="Nome (ex: Llama 3.1 8B)" className="border border-border rounded-xl px-3 py-2 text-sm bg-background" />
                </div>
                <button 
                  type="button"
                  onClick={async () => {
                    const provider = (document.getElementById('newProvider') as HTMLSelectElement).value;
                    const modelId = (document.getElementById('newModelId') as HTMLInputElement).value;
                    const name = (document.getElementById('newName') as HTMLInputElement).value;
                    if(!modelId || !name) return toast.error("Preencha todos os campos");
                    
                    const res = await fetch(getBackendUrl("/api/admin/ai-models"), {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                      body: JSON.stringify({ provider, modelId, name })
                    });
                    if(res.ok) {
                      const newModels = await (await fetch(getBackendUrl("/api/admin/ai-models"), { headers: { "Authorization": `Bearer ${token}` }})).json();
                      setAvailableAiModels(newModels.data);
                      (document.getElementById('newModelId') as HTMLInputElement).value = '';
                      (document.getElementById('newName') as HTMLInputElement).value = '';
                      toast.success("Modelo adicionado!");
                    } else {
                      toast.error("Erro ao adicionar modelo");
                    }
                  }}
                  className="mt-3 text-xs font-bold px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors"
                >
                  Adicionar Modelo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">
            Atenção: Modificar o Token da Instância ou as configurações de IA afetará diretamente a entrega das mensagens do sistema. Verifique a conectividade com a Evolution API.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </form>

      {showPhoneModal && (
        <SystemPhoneModal 
          instanceName={instanceName || "sistema-agenda-zap"} 
          onClose={() => {
            setShowPhoneModal(false);
            checkLiveStatus();
          }} 
        />
      )}
    </div>
  );
}
