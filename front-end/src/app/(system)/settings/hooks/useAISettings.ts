import { toast } from "sonner";
import useSWR from "swr";
import { getBackendUrl } from "@/lib/api";
import { AIModel, AIPreset } from "../types/settings.types";
import { useSession } from "next-auth/react";

export function useAISettings(targetTenantId: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  
  const fetcher = async (url: string) => {
    if (!targetTenantId) return { modelsData: null, presetsData: null };
    const headers: any = { 'tenant-id': targetTenantId };
    if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }
    
    const [modelsRes, presetsRes] = await Promise.all([
      fetch(getBackendUrl('/api/admin/ai-models'), { headers }),
      fetch(getBackendUrl('/api/settings/ai-presets'), { headers })
    ]);
    
    const modelsData = await modelsRes.json();
    const presetsData = await presetsRes.json();
    
    return {
      availableModels: modelsData.success ? modelsData.data : [],
      aiPresets: presetsData.success ? presetsData.data : null
    };
  };

  const { data, mutate: mutateAIData, isLoading: loading } = useSWR(
    targetTenantId ? "ai-settings" : null,
    fetcher
  );

  const availableModels = data?.availableModels || [];
  const aiPresets = data?.aiPresets || null;

  return {
    availableModels,
    aiPresets,
    loading,
    mutateAIData
  };
}
