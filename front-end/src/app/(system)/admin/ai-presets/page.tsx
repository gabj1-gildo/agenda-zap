"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Settings, Save, Plus, Trash2, ChevronDown, ChevronRight, Wand2 } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FIELDS = [
  { id: "global_presets", name: "Pacotes Globais" },
  { id: "tom_atendimento", name: "Tom de Atendimento" },
  { id: "instrucoes_pagamento", name: "Instruções de Pagamento" },
  { id: "regras_transbordo", name: "Regras de Transbordo" },
  { id: "mensagem_encerramento", name: "Mensagem de Encerramento" },
  { id: "informacoes_gerais", name: "Informações Gerais" },
  { id: "regras_agendamento", name: "Regras de Agendamento" },
  { id: "restricoes", name: "Restrições" }
];

export default function AiPresetsAdminPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [presets, setPresets] = useState<Record<string, { label: string, text: string }[]>>({});

  const token = (session?.user as any)?.accessToken;

  useEffect(() => {
    if (!token) return;
    
    async function fetchPresets() {
      try {
        // Busca do endpoint public/lojista que já devolve com fallback
        const res = await fetch(getBackendUrl("/api/settings/ai-presets"), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        
        if (json.success && json.data) {
          setPresets(json.data);
        }
      } catch (error) {
        toast.error("Erro ao carregar templates da IA");
      } finally {
        setLoading(false);
      }
    }
    
    fetchPresets();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        key: "ai_presets",
        value: JSON.stringify(presets),
        description: "Templates de IA configuráveis (Modelos Prontos)"
      };

      const res = await fetch(getBackendUrl("/api/admin/system-settings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success("Templates da IA salvos com sucesso!");
      } else {
        toast.error(data.message || "Erro ao salvar templates");
      }
    } catch (e) {
      toast.error("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = (field: string, index: number, key: 'label' | 'text', value: string) => {
    setPresets(prev => {
      const fieldList = [...(prev[field] || [])];
      fieldList[index] = { ...fieldList[index], [key]: value };
      return { ...prev, [field]: fieldList };
    });
  };

  const handleRemoveItem = (field: string, index: number) => {
    setPresets(prev => {
      const fieldList = [...(prev[field] || [])];
      fieldList.splice(index, 1);
      return { ...prev, [field]: fieldList };
    });
  };

  const handleAddItem = (field: string) => {
    setPresets(prev => {
      const fieldList = [...(prev[field] || [])];
      if (field === "global_presets") {
        fieldList.push({ id: `pacote_${fieldList.length + 1}`, label: "Novo Pacote", desc: "", config: {} });
      } else {
        fieldList.push({ label: "Novo Modelo", text: "" });
      }
      return { ...prev, [field]: fieldList };
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando templates...</div>;
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wand2 className="w-8 h-8 text-purple-600" />
            Templates da IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os "Modelos Prontos" disponíveis para os lojistas configurarem a Inteligência Artificial.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Alterações Globais"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue={FIELDS[0].id} orientation="vertical" className="flex flex-col md:flex-row min-h-[500px]">
            <TabsList className="flex flex-col shrink-0 h-auto justify-start w-full md:w-64 border-r md:border-b-0 border-b rounded-none bg-transparent p-0">
              {FIELDS.map(f => (
                <TabsTrigger 
                  key={f.id} 
                  value={f.id}
                  className="w-full justify-start rounded-none border-b border-transparent data-[state=active]:border-border data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-6 py-4 font-medium"
                >
                  {f.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex-1 min-w-0 p-6">
              {FIELDS.map(field => (
                <TabsContent key={field.id} value={field.id} className="mt-0 outline-none">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">{field.name}</h2>
                      <p className="text-sm text-muted-foreground">Estes modelos aparecerão como opções prontas para este campo.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleAddItem(field.id)} className="gap-2">
                      <Plus className="w-4 h-4" /> Adicionar Modelo
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {field.id === "global_presets" ? (
                      !(presets[field.id] && presets[field.id].length > 0) ? (
                        <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                          Nenhum modelo global configurado.
                        </div>
                      ) : (
                        presets[field.id].map((item: any, idx: number) => (
                          <div key={idx} className="relative bg-muted/30 border rounded-lg p-4 space-y-4">
                            <div className="absolute top-4 right-4">
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(field.id, idx)} className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-2 pr-12">
                              <Label>ID do Pacote (Apenas Letras/Números, sem espaço)</Label>
                              <Input value={item.id || ""} onChange={(e) => {
                                const list = [...presets[field.id]];
                                list[idx] = { ...list[idx], id: e.target.value };
                                setPresets({ ...presets, [field.id]: list });
                              }} placeholder="ex: salao_beleza" className="bg-background" />
                            </div>
                            <div className="space-y-2">
                              <Label>Nome do Pacote</Label>
                              <Input value={item.label || ""} onChange={(e) => {
                                const list = [...presets[field.id]];
                                list[idx] = { ...list[idx], label: e.target.value };
                                setPresets({ ...presets, [field.id]: list });
                              }} placeholder="ex: Salão / Barbearia" className="bg-background" />
                            </div>
                            <div className="space-y-2">
                              <Label>Descrição Curta</Label>
                              <Input value={item.desc || ""} onChange={(e) => {
                                const list = [...presets[field.id]];
                                list[idx] = { ...list[idx], desc: e.target.value };
                                setPresets({ ...presets, [field.id]: list });
                              }} placeholder="ex: Tom amigável..." className="bg-background" />
                            </div>
                            
                            <div className="p-4 border rounded-md mt-4 space-y-4 bg-background/50">
                              <h3 className="font-semibold text-sm">Textos Injetados pelo Pacote:</h3>
                              {FIELDS.filter(f => f.id !== 'global_presets').map(f => (
                                <div key={f.id} className="space-y-1">
                                  <Label className="text-xs">{f.name}</Label>
                                  <Textarea 
                                    value={item.config?.[f.id] || ""} 
                                    onChange={(e) => {
                                      const list = [...presets[field.id]];
                                      list[idx] = { ...list[idx], config: { ...(list[idx].config || {}), [f.id]: e.target.value } };
                                      setPresets({ ...presets, [field.id]: list });
                                    }} 
                                    className="min-h-[60px] text-xs font-mono bg-background"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      !(presets[field.id] && presets[field.id].length > 0) ? (
                        <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                          Nenhum modelo configurado para este campo.
                        </div>
                      ) : (
                        presets[field.id].map((item: any, idx: number) => (
                          <div key={idx} className="relative bg-muted/30 border rounded-lg p-4 space-y-4">
                            <div className="absolute top-4 right-4">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveItem(field.id, idx)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-2 pr-12">
                              <Label>Nome do Modelo (Exibido no Menu)</Label>
                              <Input 
                                value={item.label || ""} 
                                onChange={(e) => handleUpdateItem(field.id, idx, 'label', e.target.value)} 
                                placeholder="Ex: Padrão, Rígido, Descontraído..."
                                className="bg-background"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Texto do Template (Conteúdo Injetado)</Label>
                              <Textarea 
                                value={item.text || ""} 
                                onChange={(e) => handleUpdateItem(field.id, idx, 'text', e.target.value)} 
                                placeholder="Ex: Instrução de como a IA deve agir..."
                                className="min-h-[100px] bg-background font-mono text-sm"
                              />
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
