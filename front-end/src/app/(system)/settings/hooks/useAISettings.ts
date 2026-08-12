import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";
import { AIModel, AIPreset } from "../types/settings.types";
import { useSession } from "next-auth/react";

export function useAISettings(targetTenantId: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [aiPresets, setAiPresets] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAIData = useCallback(async () => {
    if (!targetTenantId) {
      setLoading(false);
      return;
    }
    try {
      const headers: any = { 'tenant-id': targetTenantId };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const [modelsRes, presetsRes] = await Promise.all([
        fetch(getBackendUrl('/api/admin/ai-models'), { headers }),
        fetch(getBackendUrl('/api/settings/ai-presets'), { headers })
      ]);
      
      const modelsData = await modelsRes.json();
      const presetsData = await presetsRes.json();
      
      if (modelsData.success) {
        setAvailableModels(modelsData.data);
      }
      
      if (presetsData.success) {
        setAiPresets(presetsData.data);
      }
    } catch (err) {
      toast.error("Erro ao carregar configurações de IA");
    } finally {
      setLoading(false);
    }
  }, [targetTenantId, token]);

  return {
    availableModels,
    aiPresets,
    loading,
    loadAIData
  };
}
