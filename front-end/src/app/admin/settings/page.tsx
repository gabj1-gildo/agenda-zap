"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Settings, Save, AlertCircle, Smartphone, RefreshCw } from "lucide-react";
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
        toast.error("Erro ao carregar configuraÃ§Ãµes");
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
        body: JSON.stringify({ key: "whatsapp_default_instance_name", value: instanceName, description: "InstÃ¢ncia padrÃ£o do sistema para envios globais" })
      });
      
      const resKey = await fetch(getBackendUrl("/api/admin/system-settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ key: "whatsapp_default_api_key", value: instanceKey, description: "Token da instÃ¢ncia padrÃ£o" })
      });

      const resAiProvider = await fetch(getBackendUrl("/api/admin/system-settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ key: "global_ai_provider", value: globalAiProvider, description: "Provider global de InteligÃªncia Artificial" })
      });
      
      const resAiModel = await fetch(getBackendUrl("/api/admin/system-settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ key: "global_ai_model", value: globalAiModel, description: "Modelo global de IA padrÃ£o (ex: gemini-2.5-flash)" })
      });

      if (resName.ok && resKey.ok && resAiProvider.ok && resAiModel.ok) {
        toast.success("ConfiguraÃ§Ãµes salvas com sucesso!");
      } else {
        toast.error("Erro ao salvar algumas configuraÃ§Ãµes");
      }
    } catch (error) {
      toast.error("Erro de conexÃ£o");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando configuraÃ§Ãµes...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          ConfiguraÃ§Ãµes Globais do Sistema
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie os parÃ¢metros globais da aplicaÃ§Ã£o.</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                WhatsApp PadrÃ£o
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Esta instÃ¢ncia da Evolution API serÃ¡ usada para envios do sistema (ex: recuperaÃ§Ã£o de senha, avisos globais).
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {connectionStatus === "OPEN" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Desconectado
                  </span>
                )}
                <button
                  onClick={checkLiveStatus}
                  disabled={checkingStatus}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Atualizar Status"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingStatus ? "animate-spin" : ""}`} />
                </button>
              </div>
              <button
                onClick={() => setShowPhoneModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-colors shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                Conectar WhatsApp
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nome da InstÃ¢ncia</label>
                <input
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="Ex: whatsapp-vendas"
                  required
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Global API Key (Token)</label>
                <input
                  type="text"
                  value={instanceKey}
                  onChange={(e) => setInstanceKey(e.target.value)}
                  placeholder="Ex: 665D125A-..."
                  required
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-border mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" /> InteligÃªncia Artificial Global
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Provedor de IA PadrÃ£o</label>
                  <select
                    value={globalAiProvider}
                    onChange={(e) => setGlobalAiProvider(e.target.value)}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="gemini">Google Gemini (SDK Nativo)</option>
                    <option value="groq">Groq (OpenAI Compatible)</option>
                    <option value="deepseek">DeepSeek (OpenAI Compatible)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">A chave de API correspondente (ex: GROQ_API_KEY) deve estar configurada no arquivo .env</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Modelo de IA EspecÃ­fico</label>
                  <select
                    value={globalAiModel}
                    onChange={(e) => setGlobalAiModel(e.target.value)}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">Selecione um modelo...</option>
                    {availableAiModels.filter(m => m.provider === globalAiProvider).map(m => (
                      <option key={m.id} value={m.modelId}>{m.name} {m.isActive ? '' : '(Inativo)'}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os modelos disponÃ­veis sÃ£o gerenciados abaixo.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Gerenciar Modelos de IA
                </h3>
              </div>
              <div className="space-y-4">
                {availableAiModels.map(model => (
                  <div key={model.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border">
                    <div>
                      <p className="font-semibold">{model.name} <span className="text-xs text-muted-foreground ml-2">({model.modelId})</span></p>
                      <p className="text-xs text-muted-foreground">Provedor: {model.provider} | Status: {model.isActive ? 'Ativo' : 'Inativo'}</p>
                    </div>
                    <div className="flex gap-2">
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
                        className="text-xs px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
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
                            toast.success("ExcluÃ­do com sucesso!");
                          }
                        }}
                        className="text-xs px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="p-4 border border-dashed border-border rounded-lg bg-card mt-4">
                  <h4 className="text-sm font-semibold mb-3">Adicionar Novo Modelo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select id="newProvider" className="border border-input rounded-md px-3 py-1.5 text-sm">
                      <option value="gemini">Google Gemini</option>
                      <option value="groq">Groq</option>
                      <option value="deepseek">DeepSeek</option>
                    </select>
                    <input id="newModelId" placeholder="ID (ex: llama-3.1-8b-instant)" className="border border-input rounded-md px-3 py-1.5 text-sm" />
                    <input id="newName" placeholder="Nome (ex: Llama 3.1 8B)" className="border border-input rounded-md px-3 py-1.5 text-sm" />
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
                    className="mt-3 text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 w-full md:w-auto"
                  >
                    Adicionar Modelo
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start gap-3 mt-6">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800">
                AtenÃ§Ã£o: Modificar estes valores impactarÃ¡ o envio de mensagens de sistema para todos os usuÃ¡rios. Certifique-se de que a instÃ¢ncia esteja conectada na Evolution API.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar ConfiguraÃ§Ãµes"}
              </button>
            </div>
          </form>
        </div>
      </div>

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
