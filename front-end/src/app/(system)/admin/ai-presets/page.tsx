"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Save, Wand2 } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedPreset, GlobalPreset, PRESET_FIELDS } from "./types";
import { GlobalPresetsTab } from "./components/GlobalPresetsTab";
import { AdvancedPresetsTab } from "./components/AdvancedPresetsTab";

export default function AiPresetsAdminPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [globalPresets, setGlobalPresets] = useState<GlobalPreset[]>([]);
  const [advancedPresets, setAdvancedPresets] = useState<Record<string, AdvancedPreset[]>>({});

  const token = (session?.user as any)?.accessToken;

  useEffect(() => {
    if (!token) return;
    
    async function fetchPresets() {
      try {
        const res = await fetch(getBackendUrl("/api/settings/ai-presets"), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        
        if (json.success && json.data) {
          const { global_presets, ...rest } = json.data;
          setGlobalPresets(global_presets || []);
          setAdvancedPresets(rest);
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
        value: JSON.stringify({ ...advancedPresets, global_presets: globalPresets }),
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

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando templates...</div>;
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Alterações Globais"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="global_presets" orientation="vertical" className="flex flex-col md:flex-row min-h-[500px]">
            <TabsList className="flex flex-col shrink-0 h-auto justify-start w-full md:w-64 border-r md:border-b-0 border-b rounded-none bg-transparent p-0">
              <TabsTrigger 
                value="global_presets"
                className="w-full justify-start rounded-none border-b border-transparent data-[state=active]:border-border data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-6 py-4 font-medium"
              >
                Pacotes Globais
              </TabsTrigger>
              {PRESET_FIELDS.map(f => (
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
              <TabsContent value="global_presets" className="mt-0">
                <GlobalPresetsTab 
                  globalPresets={globalPresets} 
                  setGlobalPresets={setGlobalPresets} 
                />
              </TabsContent>
              
              {PRESET_FIELDS.map(field => (
                <TabsContent key={field.id} value={field.id} className="mt-0">
                  <AdvancedPresetsTab 
                    fieldId={field.id} 
                    fieldName={field.name} 
                    presets={advancedPresets[field.id] || []} 
                    setAdvancedPresets={setAdvancedPresets} 
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
