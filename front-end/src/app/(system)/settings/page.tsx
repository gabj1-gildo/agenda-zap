"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Suspense } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Plus, Trash2, ShieldAlert, MonitorSmartphone, Smartphone, Clock, X, FilePenLine, Camera, Eye, ArrowRight, CheckCircle, Wifi, WifiOff, Trash, ChevronDown, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhone } from "@/lib/utils";
import { getBackendUrl } from "@/lib/api";
import { TenantPhoneModal } from "@/components/TenantPhoneModal";
import { PaymentConfig } from "@/components/PaymentConfig";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ServicesSettings } from "@/components/ServicesSettings";
import { ExceptionsSettings } from "@/components/ExceptionsSettings";

import { env } from '@/config/env';

function minsToTime(m: number) {
  if (!m || isNaN(m)) return "00:00";
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function timeToMins(t: string) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h * 60) + (m || 0);
}

function SettingsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const queryTenantId = searchParams?.get("tenant");
  const role = (session?.user as any)?.role;
  const isSuperAdmin = role === "SUPERADMIN";
  // Se o Admin selecionou uma empresa no Header, o tenantId estará na sessão.
  const targetTenantId = queryTenantId || (session as any)?.tenantId;
  const [tenant, setTenant] = useState<any>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean | string>(false);
  const [newLogoUrl, setNewLogoUrl] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [availableAiModels, setAvailableAiModels] = useState<any[]>([]);
  const [aiPresets, setAiPresets] = useState<any>(null);
  const [missingVarsPrompt, setMissingVarsPrompt] = useState<{
    variables: string[];
    values: Record<string, string>;
    template: { isGlobal: boolean, globalId?: string, globalConfig?: any, field?: string, text?: string };
  } | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<string | null>(null);

  const numberInputRef = useRef<HTMLInputElement>(null);
  const [docValidating, setDocValidating] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Form states
  const [newKey, setNewKey] = useState({ 
    name: '', gateway: 'MERCADOPAGO', token: '', pixExpirationTime: '00:30', 
    acceptsPix: true, acceptsCreditCard: true, acceptsBoleto: false 
  });

  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!targetTenantId) return;
      try {
        const token = (session?.user as any)?.accessToken;
        const headers: any = { 'tenant-id': targetTenantId };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const [tenantRes, keysRes, schedRes, presetsRes, modelsRes, whatsappRes] = await Promise.all([
          fetch(getBackendUrl('/api/settings/tenant'), { headers }),
          fetch(getBackendUrl('/api/settings/payment-keys'), { headers }),
          fetch(getBackendUrl('/api/settings/schedules'), { headers }),
          fetch(getBackendUrl('/api/settings/ai-presets'), { headers }),
          fetch(getBackendUrl('/api/admin/ai-models'), { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(getBackendUrl('/api/settings/whatsapp'), { headers })
        ]);
        
        const tenantData = await tenantRes.json();
        const keysData = await keysRes.json();
        const schedData = await schedRes.json();
        const presetsData = await presetsRes.json();
        const modelsData = await modelsRes.json();
        const whatsappData = await whatsappRes.json();

        if (presetsData.success) {
          setAiPresets(presetsData.data);
        }

        if (modelsData.success) {
          setAvailableAiModels(modelsData.data);
        }

        if (whatsappData.success) {
          setWhatsappInstances(whatsappData.data);
        }

        if (tenantData.success) setTenant(tenantData.data);
        if (keysData.success) setKeys(keysData.data);
        if (schedData.success) {
          if (schedData.data.length > 0) {
            setSchedules(schedData.data.map((s: any) => ({ 
              ...s, 
              _isHours: s.slotDuration >= 60 && s.slotDuration % 60 === 0 
            })));
          } else {
            // Default schedules
            const defaultSched = Array.from({ length: 7 }).map((_, i) => ({
              dayOfWeek: i, isActive: i >= 1 && i <= 5, startTime: "09:00", endTime: "18:00", slotDuration: 30, _isHours: false
            }));
            setSchedules(defaultSched);
          }
        }
      } catch (err) {
        toast.error("Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    }
    
    if (targetTenantId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [targetTenantId]);

  function getTenantVarValue(v: string) {
    if (v === 'nome_empresa') return tenant?.name;
    if (v === 'telefone') return tenant?.phone;
    if (v === 'endereco') return tenant?.address_street;
    return tenant?.aiConfig?.customVars?.[v];
  }

  function extractVariables(text: string) {
    const matches = text.match(/{{([^}]+)}}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.replace(/[{}]/g, '').trim())));
  }

  function applyVarsToText(text: string, customValues?: Record<string, string>) {
    let result = text;
    const vars = extractVariables(text);
    for (const v of vars) {
      const val = customValues?.[v] || getTenantVarValue(v) || "";
      result = result.replace(new RegExp(`{{${v}}}`, 'g'), val);
    }
    return result;
  }

  function handleSelectGlobalPreset(preset: any) {
    const allText = Object.values(preset.config || {}).join(" ");
    const vars = extractVariables(allText);
    const missing = vars.filter(v => !getTenantVarValue(v));
    
    if (missing.length > 0) {
      setMissingVarsPrompt({ 
        variables: missing, 
        values: {},
        template: { isGlobal: true, globalId: preset.id, globalConfig: preset.config } 
      });
    } else {
      applyGlobalPreset(preset.id, preset.config);
    }
  }

  function applyGlobalPreset(id: string, config: any, customValues?: Record<string, string>) {
    const finalConfig: any = { preset_id: id };
    for (const [k, v] of Object.entries(config)) {
      if (typeof v === 'string') {
        finalConfig[k] = applyVarsToText(v, customValues);
      } else {
        finalConfig[k] = v;
      }
    }
    setTenant((prev: any) => ({
      ...prev,
      aiConfig: { ...(prev?.aiConfig || {}), ...finalConfig }
    }));
    toast.success("Modelo aplicado! Lembre-se de salvar.");
  }

  function handleSelectAdvancedPreset(field: string, text: string) {
    if (!text) {
      updateAiConfig(field, "");
      return;
    }
    const vars = extractVariables(text);
    const missing = vars.filter(v => !getTenantVarValue(v));
    
    if (missing.length > 0) {
      setMissingVarsPrompt({ 
        variables: missing, 
        values: {},
        template: { isGlobal: false, field, text } 
      });
    } else {
      updateAiConfig(field, applyVarsToText(text));
    }
  }

  const saveGeneral = async () => {
    setSaving(true);
    try {
      const response = await fetch(getBackendUrl('/api/settings/tenant'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'tenant-id': targetTenantId, 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` },
        body: JSON.stringify({ 
          name: tenant.name, 
          phone: tenant.phone, 
          email: tenant.email,
          document: tenant.document,
          description: tenant.description,
          cep: tenant.cep,
          addressStreet: tenant.addressStreet,
          addressNumber: tenant.addressNumber,
          addressComplement: tenant.addressComplement,
          addressNeighborhood: tenant.addressNeighborhood,
          addressCity: tenant.addressCity,
          addressState: tenant.addressState,
          serviceLocationType: tenant.serviceLocationType,
          servicePerimeter: tenant.servicePerimeter,
          acceptPaymentOnSite: tenant.acceptPaymentOnSite,
          schedulingMode: tenant.schedulingMode,
          whatsappProvider: tenant.whatsappProvider,
          whatsappMetaToken: tenant.whatsappMetaToken,
          whatsappMetaPhoneNumberId: tenant.whatsappMetaPhoneNumberId,
          cpfBirthDate: tenant.cpfBirthDate,
          cpfGender: tenant?.cpfGender,
          logoUrl: newLogoUrl || tenant?.logoUrl || tenant?.logo_url,
          aiConfig: tenant?.aiConfig || {}
        })
      });
      const data = await response.json();
      
      if (!data.success) {
        toast.error(data.error || "Erro ao salvar dados");
        return;
      }

      if (newLogoUrl) {
        setTenant((prev: any) => ({ ...prev, logoUrl: newLogoUrl }));
        setNewLogoUrl(null);
      }
      
      if (data.ignoredFields && data.ignoredFields.length > 0) {
        toast.error("Os campos de Serviços e Horário de Funcionamento não são mais editados por aqui — em breve teremos uma tela nova para isso.", { duration: 6000 });
      } else {
        toast.success("Dados salvos com sucesso!");
      }
    } catch (e) {
      toast.error("Erro ao salvar dados");
    } finally {
      setSaving(false);
    }
  };

  const updateAiConfig = (key: string, value: string) => {
    setTenant((prev: any) => ({
      ...prev,
      aiConfig: {
        ...(prev.aiConfig || {}),
        [key]: value
      }
    }));
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "$1.$2.$3-$4").replace(/(-\d{2})\d+?$/, "$1");
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "$1.$2.$3/$4-$5").replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    return rev === parseInt(cpf.charAt(10));
  };

  const validateDocument = async (doc: string) => {
    const raw = doc.replace(/\D/g, '');
    setDocError(null);
    if (!raw) return true;
    
    if (raw.length <= 11) {
      if (!validateCPF(raw)) {
        setDocError("CPF inválido");
        return false;
      }
      
      setDocValidating(true);
      try {
        const res = await fetch(getBackendUrl(`/api/validate/cpf?cpf=${raw}`));
        const data = await res.json();
        if (!res.ok || !data.success) {
          setDocError(data.error || "CPF não encontrado na Receita");
          return false;
        }
        
        if (data.data) {
          const apiPayload = data.data?.data || data.data;
          let birth = apiPayload?.data_nascimento || apiPayload?.nascimento || tenant?.cpfBirthDate;
          if (birth && birth.includes('-') && birth.length === 10) {
            const [y, m, d] = birth.split('-');
            birth = `${d}/${m}/${y}`;
          }
          const newGender = apiPayload?.genero === 'M' ? 'Masculino' : apiPayload?.genero === 'F' ? 'Feminino' : apiPayload?.genero || tenant?.cpfGender;
          
          setTenant((prev: any) => ({
            ...prev,
            name: apiPayload?.nome || prev.name,
            cpfBirthDate: birth,
            cpfGender: newGender
          }));
          toast.success("CPF Validado e dados preenchidos.");
        }
        
        return true;
      } catch (e) {
        setDocError("Erro de conexão ao validar CPF");
        return false;
      } finally {
        setDocValidating(false);
      }
    } else {
      if (raw.length !== 14) {
        setDocError("CNPJ incompleto");
        return false;
      }
      setDocValidating(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${raw}`);
        if (!res.ok) {
          setDocError("CNPJ não encontrado na Receita");
          return false;
        }
        const data = await res.json();
        if (data.descricao_situacao_cadastral !== "ATIVA") {
          setDocError(`CNPJ inativo (${data.descricao_situacao_cadastral})`);
          return false;
        }
        
        setTenant((prev: any) => ({
          ...prev,
          name: data.nome_fantasia || data.razao_social || prev.name,
          cep: data.cep || prev.cep,
          addressStreet: data.logradouro || prev.addressStreet,
          addressNumber: data.numero || prev.addressNumber,
          addressComplement: data.complemento || prev.addressComplement,
          addressNeighborhood: data.bairro || prev.addressNeighborhood,
          addressCity: data.municipio || prev.addressCity,
          addressState: data.uf || prev.addressState
        }));
        toast.success("CNPJ Validado e dados preenchidos.");
        return true;
      } catch (e) {
        setDocError("Erro ao validar CNPJ");
        return false;
      } finally {
        setDocValidating(false);
      }
    }
  };

  const fetchCep = async (cep: string) => {
    const raw = cep.replace(/\D/g, '');
    if (raw.length === 8) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${raw}`);
        if (res.ok) {
          const data = await res.json();
          setTenant((prev: any) => ({
            ...prev,
            addressStreet: data.street || prev.addressStreet,
            addressNeighborhood: data.neighborhood || prev.addressNeighborhood,
            addressCity: data.city || prev.addressCity,
            addressState: data.state || prev.addressState
          }));
          setTimeout(() => numberInputRef.current?.focus(), 100);
        }
      } catch (e) {
        // ignore
      }
    }
  };

  const handleSaveWithValidation = async () => {
    if (tenant?.document) {
      const raw = tenant.document.replace(/\D/g, '');
      if (raw.length > 11) { // CNPJ
        if (!tenant.addressStreet || !tenant.addressNumber || !tenant.addressNeighborhood || !tenant.addressCity || !tenant.addressState || !tenant.cep) {
          toast.error("Para contas PJ (CNPJ), o endereço completo é obrigatório.");
          return;
        }
      }
      const isValid = await validateDocument(tenant.document);
      if (!isValid) {
        toast.error("Corrija os erros no documento antes de salvar.");
        return;
      }
    }
    saveGeneral();
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const toastId = toast.loading("Enviando logo...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "logo");

      try {
        const token = (session?.user as any)?.accessToken;
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          headers['x-authorization'] = `Bearer ${token}`;
        }
        if (targetTenantId) headers['tenant-id'] = targetTenantId;

        const res = await fetch(getBackendUrl('/api/upload'), {
          method: 'POST',
          headers,
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          if (newLogoUrl) {
            await fetch(getBackendUrl('/api/upload'), {
              method: 'DELETE',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: newLogoUrl })
            });
          }
          setNewLogoUrl(data.url);
          toast.success("Logo enviada, salve as alterações para confirmar!", { id: toastId });
        } else {
          toast.error(data.error || "Erro ao enviar logo", { id: toastId });
        }
      } catch (err) {
        toast.error("Erro na conexão ao enviar logo", { id: toastId });
      }
    }
  };

  const addKey = async () => {
    if (!newKey.name || !newKey.token) return toast.error("Preencha nome e token");
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/settings/payment-keys'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'tenant-id': targetTenantId, 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` },
        body: JSON.stringify(newKey)
      });
      const data = await res.json();
      if (data.success) {
        setKeys([data.data, ...keys]);
        setNewKey({ name: '', gateway: 'MERCADOPAGO', token: '', pixExpirationTime: '00:30', acceptsPix: true, acceptsCreditCard: true, acceptsBoleto: false });
        toast.success("Chave adicionada!");
      }
    } catch (e) {
      toast.error("Erro ao adicionar chave");
    } finally {
      setSaving(false);
    }
  };

  const toggleKey = async (id: string, isActive: boolean) => {
    try {
      await fetch(getBackendUrl(`/api/settings/payment-keys/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'tenant-id': targetTenantId, 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` },
        body: JSON.stringify({ isActive })
      });
      setKeys(keys.map(k => ({ ...k, isActive: k.id === id ? isActive : false })));
      toast.success(isActive ? "Chave ativada!" : "Chave desativada!");
    } catch (e) {
      toast.error("Erro ao alterar chave");
    }
  };

  const confirmDeleteKey = async () => {
    if (!deleteKeyId) return;
    try {
      await fetch(getBackendUrl(`/api/settings/payment-keys/${deleteKeyId}`), { 
        method: 'DELETE',
        headers: { 'tenant-id': targetTenantId, 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` }
      });
      setKeys(keys.filter(k => k.id !== deleteKeyId));
      toast.success("Chave excluída!");
    } catch (e) {
      toast.error("Erro ao excluir chave");
    } finally {
      setDeleteKeyId(null);
    }
  };

  const saveSchedules = async () => {
    setSaving(true);
    try {
      await fetch(getBackendUrl('/api/settings/schedules'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'tenant-id': targetTenantId, 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` },
        body: JSON.stringify({ schedules })
      });
      toast.success("Horários salvos com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar horários");
    } finally {
      setSaving(false);
    }
  };

  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const confirmDisconnectWhatsApp = async () => {
    if (!showDisconnectConfirm) return;
    try {
      const res = await fetch(getBackendUrl(`/api/settings/whatsapp/${showDisconnectConfirm}`), {
        method: "DELETE", headers: { 'tenant-id': targetTenantId as string, 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` }
      });
      if (res.ok) {
        toast.success("WhatsApp desconectado!");
        setWhatsappInstances(prev => prev.filter(p => p.id !== showDisconnectConfirm));
      } else {
        toast.error("Falha ao desconectar.");
      }
    } catch (e) {
      toast.error("Erro ao desconectar WhatsApp.");
    } finally {
      setShowDisconnectConfirm(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {showPhoneModal && (
        <TenantPhoneModal 
          tenantId={targetTenantId as string} 
          existingInstanceId={typeof showPhoneModal === 'string' ? showPhoneModal : undefined}
          onClose={() => {
            setShowPhoneModal(false);
            // Reload whatsapp instances
            fetch(getBackendUrl('/api/settings/whatsapp'), { headers: { 'tenant-id': targetTenantId as string, 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` } })
              .then(r => r.json())
              .then(d => { if (d.success) setWhatsappInstances(d.data); });
          }} 
        />
      )}

      <ConfirmModal
        open={!!deleteKeyId}
        onOpenChange={(open) => !open && setDeleteKeyId(null)}
        title="Excluir Chave"
        description="Tem certeza que deseja excluir esta chave de pagamento?"
        onConfirm={confirmDeleteKey}
      />

      <ConfirmModal
        open={!!showDisconnectConfirm}
        onOpenChange={(open) => !open && setShowDisconnectConfirm(null)}
        title="Remover Conexão WhatsApp"
        description="Tem certeza que deseja remover esta conexão? As mensagens automáticas pararão de ser enviadas para este número."
        onConfirm={confirmDisconnectWhatsApp}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações {isSuperAdmin ? "da Empresa" : ""}</h1>
        <p className="text-muted-foreground mt-1">Gerencie as preferências, horários e dados do estabelecimento{isSuperAdmin ? " selecionado" : ""}.</p>
      </div>

            <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 h-auto md:h-10 gap-2">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="notificacoes">WhatsApp</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-6">
          <div className="space-y-8">

            <Card>
            <CardHeader>
              <CardTitle>Dados do Estabelecimento</CardTitle>
              <CardDescription>Essas informações serão exibidas para seus clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-8 p-6 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group w-32 h-32 rounded-2xl border-4 border-background shadow-md overflow-hidden bg-muted flex items-center justify-center transition-all hover:shadow-lg">
                    {(tenant?.logoUrl || tenant?.logo_url) ? (
                      <img src={`/api/image-proxy?url=${encodeURIComponent((tenant.logoUrl || tenant.logo_url) as string)}`} alt="Logo Atual" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-muted-foreground text-xs text-center px-2 font-semibold">Sem Logo</div>
                    )}
                    
                    {/* Hover Overlay para Alterar */}
                    <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Alterar</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    {(tenant?.logoUrl || tenant?.logo_url) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => setViewImage((tenant.logoUrl || tenant.logo_url) as string)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Visualizar
                      </Button>
                    )}
                  </div>
                </div>

                {newLogoUrl && (
                  <>
                    <div className="hidden sm:flex text-muted-foreground/30">
                      <ArrowRight className="w-8 h-8" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-left-4">
                      <div className="relative group w-32 h-32 rounded-2xl border-4 border-emerald-500 shadow-lg overflow-hidden bg-emerald-500/10 flex items-center justify-center ring-4 ring-emerald-500/20">
                        <img src={`/api/image-proxy?url=${encodeURIComponent(newLogoUrl)}`} alt="Nova Logo" className="w-full h-full object-cover" />
                        
                        {/* Hover Overlay para Visualizar a Nova */}
                        <div 
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                          onClick={() => setViewImage(newLogoUrl)}
                        >
                          <Eye className="w-6 h-6" />
                        </div>
                      </div>
                      
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="h-8 text-xs font-semibold shadow-sm"
                        onClick={async () => {
                          if (newLogoUrl) {
                            const token = (session?.user as any)?.accessToken;
                            const headers: any = { 'Content-Type': 'application/json' };
                            if (token) headers['Authorization'] = `Bearer ${token}`;
                            if (targetTenantId) headers['tenant-id'] = targetTenantId as string;
                            await fetch(getBackendUrl('/api/upload'), {
                              method: 'DELETE',
                              headers,
                              body: JSON.stringify({ url: newLogoUrl })
                            });
                          }
                          setNewLogoUrl(null);
                        }}
                      >
                         Descartar Nova Logo
                      </Button>
                    </div>
                  </>
                )}

                {!newLogoUrl && (
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-foreground mb-1">Logo da Empresa</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Clique na imagem para enviar uma nova logo. Recomendamos imagens (ex: 512x512px) em formato JPG ou PNG com fundo transparente.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nome do Estabelecimento</Label>
                <Input 
                  value={tenant?.name || ""} 
                  onChange={e => setTenant({...tenant, name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input 
                  value={tenant?.phone || ""} 
                  onChange={e => setTenant({...tenant, phone: formatPhone(e.target.value)})} 
                  placeholder="+55 (00) 00000-0000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>E-mail de Contato</Label>
                  <Input 
                    type="email"
                    value={tenant?.email || ""} 
                    onChange={e => setTenant({...tenant, email: e.target.value})} 
                    placeholder="contato@empresa.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Documento (CNPJ/CPF)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        value={tenant?.document || ""} 
                        onChange={e => {
                          const formatted = formatDocument(e.target.value);
                          setTenant({...tenant, document: formatted});
                          setDocError(null);
                        }}
                        placeholder="00.000.000/0000-00"
                        className={docError ? "border-red-500 pr-10" : "pr-10"}
                      />
                      {docValidating && (
                        <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      )}
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={() => tenant?.document && validateDocument(tenant.document)}
                      disabled={docValidating || !tenant?.document}
                    >
                      Validar
                    </Button>
                  </div>
                  {docError && <p className="text-xs text-red-500 mt-1">{docError}</p>}
                </div>
              </div>

              {tenant?.document && tenant.document.replace(/\D/g, '').length <= 11 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-2">
                    <Label>Data de Nascimento (CPF)</Label>
                    <Input 
                      value={tenant?.cpfBirthDate || ""} 
                      onChange={e => setTenant({...tenant, cpfBirthDate: e.target.value})} 
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sexo (CPF)</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={tenant?.cpfGender || ''}
                      onChange={e => setTenant({ ...tenant, cpfGender: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Descrição / Bio da Empresa</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={tenant?.description || ""} 
                  onChange={e => setTenant({...tenant, description: e.target.value})} 
                  placeholder="Um pequeno resumo sobre o seu negócio..."
                />
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Modo de Agendamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Como sua empresa divide os horários?</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={tenant?.schedulingMode || 'GERAL'}
                      onChange={e => setTenant({ ...tenant, schedulingMode: e.target.value })}
                    >
                      <option value="GERAL">Modo Geral (A empresa como um todo)</option>
                      <option value="PROFISSIONAL">Por Profissional (Cada um tem sua agenda)</option>
                      <option value="CONSULTORIO">Por Consultório/Sala</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Isso muda como a IA pesquisa a disponibilidade e os menus deste painel.</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="space-y-2 md:col-span-3">
                    <Label>CEP</Label>
                    <Input 
                      value={tenant?.cep || ""} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, "$1-$2");
                        setTenant({...tenant, cep: val});
                        if (val.replace(/\D/g, "").length === 8) {
                          fetchCep(val);
                        }
                      }}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-7">
                    <Label>Rua / Avenida</Label>
                    <Input 
                      value={tenant?.addressStreet || ""} 
                      onChange={e => setTenant({...tenant, addressStreet: e.target.value})} 
                      placeholder="Ex: Avenida Paulista"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Número</Label>
                    <Input 
                      ref={numberInputRef}
                      value={tenant?.addressNumber || ""} 
                      onChange={e => setTenant({...tenant, addressNumber: e.target.value})} 
                      placeholder="Ex: 1000"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-4">
                    <Label>Complemento (Opcional)</Label>
                    <Input 
                      value={tenant?.addressComplement || ""} 
                      onChange={e => setTenant({...tenant, addressComplement: e.target.value})} 
                      placeholder="Ex: Sala 202, Bloco B"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label>Bairro</Label>
                    <Input 
                      value={tenant?.addressNeighborhood || ""} 
                      onChange={e => setTenant({...tenant, addressNeighborhood: e.target.value})} 
                      placeholder="Ex: Centro"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-4">
                    <Label>Cidade</Label>
                    <Input 
                      value={tenant?.addressCity || ""} 
                      onChange={e => setTenant({...tenant, addressCity: e.target.value})} 
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label>UF</Label>
                    <Input 
                      value={tenant?.addressState || ""} 
                      onChange={e => setTenant({...tenant, addressState: e.target.value.toUpperCase()})} 
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-6 mt-4">
                    <Label>Tipo de Atendimento</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={tenant?.serviceLocationType || 'FISICO'}
                      onChange={(e) => setTenant({ ...tenant, serviceLocationType: e.target.value })}
                    >
                      <option value="FISICO">Somente no Local (Físico)</option>
                      <option value="DOMICILIO">Somente a Domicílio</option>
                      <option value="AMBOS">Ambos (Físico e Domicílio)</option>
                    </select>
                  </div>

                  {(tenant?.serviceLocationType === 'DOMICILIO' || tenant?.serviceLocationType === 'AMBOS') && (
                    <div className="space-y-2 md:col-span-6 mt-4">
                      <Label>Perímetro de Atendimento a Domicílio</Label>
                      <Input 
                        value={tenant?.servicePerimeter || ""} 
                        onChange={e => setTenant({...tenant, servicePerimeter: e.target.value})} 
                        placeholder="Ex: Raio de 15km ou lista de bairros"
                      />
                      <p className="text-xs text-muted-foreground">A IA usará esta informação para validar o endereço enviado pelo cliente.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6">
              <Button onClick={handleSaveWithValidation} disabled={saving || docValidating}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
            </CardFooter>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
          <Card>
              <CardHeader>
                <CardTitle>WhatsApp API</CardTitle>
                <CardDescription>Conecte o número do seu estabelecimento para enviar e receber mensagens automaticamente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Uso de Instâncias</span>
                  <Badge variant="outline">
                    {tenant?.whatsappProvider === 'META_CLOUD' ? "Instância Única Meta" : `${whatsappInstances.length} instâncias conectadas`}
                  </Badge>
                </div>

                {tenant && !tenant._isProfileComplete && (
                  <div className="flex flex-col gap-2 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-md text-sm">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldAlert className="w-4 h-4" />
                      Complete seu perfil para ativar a IA
                    </div>
                    <p>Para conectar o WhatsApp e habilitar o atendimento automático, você precisa preencher:</p>
                    <ul className="list-disc list-inside ml-2">
                      {tenant._missingRequirements?.map((req: string, i: number) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {tenant?.whatsappProvider === 'META_CLOUD' ? (
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        WhatsApp Principal (Meta Cloud API)
                        {tenant?.whatsappMetaToken && tenant?.whatsappMetaPhoneNumberId ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">Conectado (Meta)</Badge>
                        ) : (
                          <Badge variant="secondary">Desconectado (Meta)</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                        {(tenant?.whatsappMetaToken && tenant?.whatsappMetaPhoneNumberId) ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4" />}
                        Status: {(tenant?.whatsappMetaToken && tenant?.whatsappMetaPhoneNumberId) ? "Pronto para uso (Meta API)" : "Requer configuração de Token e Phone ID"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => saveGeneral()} disabled={saving || !tenant?._isProfileComplete}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Salvar Configurações Meta
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mt-6 mb-2">
                      <h3 className="font-semibold">Aparelhos Conectados (Evolution API)</h3>
                      <Button size="sm" onClick={() => setShowPhoneModal(true)} disabled={!tenant?._isProfileComplete}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Conexão
                      </Button>
                    </div>
                    
                    {whatsappInstances.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground border rounded-md bg-muted/20">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        Nenhum WhatsApp conectado. Clique em "Nova Conexão" para gerar um QR Code.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {whatsappInstances.map((instance) => (
                          <div key={instance.id} className="flex items-center justify-between p-4 border rounded-md">
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {instance.evolutionInstanceName?.replace('_AgendaZap', '') || "Instância Padrão"}
                                {instance.evolutionInstanceStatus === "OPEN" ? (
                                  <Badge className="bg-green-600 hover:bg-green-700 text-white">Conectado</Badge>
                                ) : (
                                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white">{instance.evolutionInstanceStatus || "Desconectado"}</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                                {instance.evolutionInstanceStatus === "OPEN" ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
                                Número: {instance.phone}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {instance.evolutionInstanceStatus !== "OPEN" && (
                                <Button variant="outline" size="sm" onClick={() => setShowPhoneModal(instance.id)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Reconectar
                                </Button>
                              )}
                              <Button variant="destructive" size="sm" onClick={() => setShowDisconnectConfirm(instance.id)}>
                                <Trash className="w-4 h-4 mr-2" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex flex-col gap-2">
                    <Label className="text-base">Provedor de WhatsApp</Label>
                    <div className="text-sm text-muted-foreground mb-2">
                      A Meta Cloud API é a integração oficial do WhatsApp, indicada para alto volume. Mensagens enviadas dentro de 24h são cobradas pela Meta. A Evolution API utiliza o escaneamento de QR Code com seu número pessoal (sem custo por mensagem).
                    </div>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={tenant?.whatsappProvider || 'EVOLUTION'}
                      onChange={(e) => setTenant({ ...tenant, whatsappProvider: e.target.value })}
                    >
                      <option value="EVOLUTION">Evolution API (QR Code / Pessoal)</option>
                      <option value="META_CLOUD">Meta Cloud API (Oficial / Business)</option>
                    </select>
                  </div>

                  {tenant?.whatsappProvider === 'META_CLOUD' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-muted/30 p-4 rounded-md border">
                      <div className="space-y-2">
                        <Label>Meta Token Permanente</Label>
                        <Input 
                          type="password"
                          value={tenant?.whatsappMetaToken || ''} 
                          onChange={e => setTenant({...tenant, whatsappMetaToken: e.target.value})} 
                          placeholder="EAAI..." 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number ID (ID do Número de Telefone)</Label>
                        <Input 
                          value={tenant?.whatsappMetaPhoneNumberId || ''} 
                          onChange={e => setTenant({...tenant, whatsappMetaPhoneNumberId: e.target.value})} 
                          placeholder="1234567890" 
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 mt-2">
                        <div className="text-xs text-muted-foreground">
                          Após salvar o token, certifique-se de configurar a Webhook na Meta Business apontando para: <br />
                          <code className="bg-muted px-1 rounded select-all">{getBackendUrl('/api/webhooks/whatsapp-meta')}</code>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comportamento da Inteligência Artificial</CardTitle>
              <CardDescription>Defina como a IA deve conversar com seus clientes, seus preços e regras de agendamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {isSuperAdmin && (
                <div className="p-4 bg-muted/50 rounded-lg border border-border mb-8">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <MonitorSmartphone className="w-4 h-4" /> Sobrescrita de Motor de IA (Opcional)
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Se não preenchido, a empresa usará o modelo global definido pelo Superadmin. Preencha aqui para forçar um motor específico para esta empresa. Esta opção é visível apenas para o Superadmin.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Provedor de IA</Label>
                      <select
                        value={tenant?.aiConfig?.ai_provider || ""}
                        onChange={(e) => updateAiConfig('ai_provider', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Usar Padrão Global</option>
                        <option value="gemini">Google Gemini (SDK Nativo)</option>
                        <option value="groq">Groq (OpenAI Compatible)</option>
                        <option value="deepseek">DeepSeek (OpenAI Compatible)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Modelo Específico</Label>
                      <select
                        value={tenant?.aiConfig?.ai_model || ""}
                        onChange={(e) => updateAiConfig('ai_model', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Usar Padrão Global</option>
                        {availableAiModels.filter(m => !tenant?.aiConfig?.ai_provider || m.provider === tenant?.aiConfig?.ai_provider).map(m => (
                          <option key={m.id} value={m.modelId}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Modelo de Negócio (IA)</Label>
                  <p className="text-xs text-muted-foreground mb-4">Escolha o modelo que melhor descreve o seu negócio. A IA será configurada automaticamente com as melhores práticas.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(aiPresets?.global_presets || []).map((preset: any) => (
                      <div 
                        key={preset.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${tenant?.aiConfig?.preset_id === preset.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/50'}`}
                        onClick={() => handleSelectGlobalPreset(preset)}
                      >
                        <div className="font-semibold">{preset.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{preset.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-border rounded-lg overflow-hidden mt-6">
                  <details className="group">
                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-muted/30">
                      <span>Modo Avançado (Personalização Manual)</span>
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <div className="p-4 bg-background border-t space-y-6">
                      <div className="space-y-2">
                        <Label>Tom de Atendimento</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tenant?.aiConfig?.tom_atendimento || ""}
                          onChange={e => handleSelectAdvancedPreset('tom_atendimento', e.target.value)}
                        >
                          <option value="">Selecione um modelo avançado...</option>
                          {aiPresets?.tom_atendimento?.map((opt: any) => (
                            <option key={opt.text} value={opt.text}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Informações Gerais da Empresa</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tenant?.aiConfig?.informacoes_gerais || ""}
                          onChange={e => handleSelectAdvancedPreset('informacoes_gerais', e.target.value)}
                        >
                          <option value="">Selecione um modelo avançado...</option>
                          {aiPresets?.informacoes_gerais?.map((opt: any) => (
                            <option key={opt.text} value={opt.text}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Regras de Agendamento</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tenant?.aiConfig?.regras_agendamento || ""}
                          onChange={e => handleSelectAdvancedPreset('regras_agendamento', e.target.value)}
                        >
                          <option value="">Selecione um modelo avançado...</option>
                          {aiPresets?.regras_agendamento?.map((opt: any) => (
                            <option key={opt.text} value={opt.text}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Instruções de Pagamento</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tenant?.aiConfig?.instrucoes_pagamento || ""}
                          onChange={e => handleSelectAdvancedPreset('instrucoes_pagamento', e.target.value)}
                        >
                          <option value="">Selecione um modelo avançado...</option>
                          {aiPresets?.instrucoes_pagamento?.map((opt: any) => (
                            <option key={opt.text} value={opt.text}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Regras de Transbordo (Humano)</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tenant?.aiConfig?.regras_transbordo || ""}
                          onChange={e => handleSelectAdvancedPreset('regras_transbordo', e.target.value)}
                        >
                          <option value="">Selecione um modelo avançado...</option>
                          {aiPresets?.regras_transbordo?.map((opt: any) => (
                            <option key={opt.text} value={opt.text}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Restrições / Regras Rígidas</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tenant?.aiConfig?.restricoes || ""}
                          onChange={e => handleSelectAdvancedPreset('restricoes', e.target.value)}
                        >
                          <option value="">Selecione um modelo avançado...</option>
                          {aiPresets?.restricoes?.map((opt: any) => (
                            <option key={opt.text} value={opt.text}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Mensagem de Encerramento</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tenant?.aiConfig?.mensagem_encerramento || ""}
                          onChange={e => handleSelectAdvancedPreset('mensagem_encerramento', e.target.value)}
                        >
                          <option value="">Selecione um modelo avançado...</option>
                          {aiPresets?.mensagem_encerramento?.map((opt: any) => (
                            <option key={opt.text} value={opt.text}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6">
              <Button onClick={saveGeneral} disabled={saving}>{saving ? "Salvando..." : "Salvar Configurações da IA"}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Opções de Pagamento</CardTitle>
              <CardDescription>Configurações gerais de recebimento.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acceptOnSite" 
                  checked={tenant?.acceptPaymentOnSite} 
                  onCheckedChange={(c) => setTenant({...tenant, acceptPaymentOnSite: !!c})}
                />
                <Label htmlFor="acceptOnSite">Disponibilizar opção de receber no local (dinheiro/maquininha)</Label>
              </div>
              <Button className="mt-4" variant="outline" onClick={saveGeneral}>Salvar Opção</Button>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gateway Ativo</CardTitle>
              <CardDescription>Selecione qual das suas integrações processará os pagamentos online.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {keys.length === 0 ? (
                <p className="text-muted-foreground text-sm">Você ainda não conectou nenhum gateway na aba de Integrações.</p>
              ) : (
                <div className="space-y-3">
                  {keys.map(k => (
                    <div key={k.id} className={`flex items-center justify-between p-4 border rounded-md ${k.isActive ? 'border-primary bg-primary/5' : ''}`}>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {k.name}
                          {k.isActive && <Badge className="bg-primary">Ativa</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">{k.gateway}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!k.isActive && (
                          <Button variant="outline" size="sm" onClick={() => toggleKey(k.id, true)}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Usar este
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <PaymentConfig tenantId={targetTenantId as string} token={(session?.user as any)?.accessToken} />
          <Card>
              <CardHeader>
                <CardTitle>Google Calendar</CardTitle>
                <CardDescription>Sincronize os agendamentos confirmados com sua agenda do Google.</CardDescription>
              </CardHeader>
              <CardContent>
                {tenant?.googleCalendarToken ? (
                  <div className="flex items-center gap-3 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-4 rounded-md border border-green-200 dark:border-green-900/50">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Google Calendar conectado com sucesso.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Você ainda não conectou sua conta do Google.</p>
                    <Button onClick={() => window.location.href = getBackendUrl(`/api/google/auth?tenantId=${targetTenantId}`)}>
                      Conectar com o Google
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          <Card>
              <CardHeader>
                <CardTitle>Gateways de Pagamento</CardTitle>
                <CardDescription>Conecte ou cadastre chaves de API de processadores de pagamento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4 items-end bg-muted/50 p-4 rounded-md border border-border/50">
                  <div className="flex-1 space-y-1">
                    <Label>Nome (ex: MP Matriz)</Label>
                    <Input value={newKey.name} onChange={e => setNewKey({...newKey, name: e.target.value})} className="bg-background" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label>Gateway</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newKey.gateway} onChange={e => setNewKey({...newKey, gateway: e.target.value})}>
                      <option value="MERCADOPAGO">Mercado Pago</option>
                      <option value="ABACATEPAY">AbacatePay</option>
                      <option value="ASAAS">Asaas</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label>Tempo PIX (hh:mm)</Label>
                    <Input value={newKey.pixExpirationTime} onChange={e => setNewKey({...newKey, pixExpirationTime: e.target.value})} placeholder="00:30" className="bg-background" />
                  </div>
                  
                  {newKey.gateway === 'MERCADOPAGO' ? (
                    <div className="flex-[2]">
                      <Button 
                        className="w-full bg-[#009EE3] hover:bg-[#009EE3]/90 text-white" 
                        onClick={() => window.location.href = getBackendUrl(`/api/mercadopago/auth?tenantId=${targetTenantId}&pixExpirationTime=${newKey.pixExpirationTime}`)}
                      >
                        Conectar com Mercado Pago
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-[2] space-y-1">
                        <Label>Token (Access Token)</Label>
                        <Input value={newKey.token} onChange={e => setNewKey({...newKey, token: e.target.value})} type="password" className="bg-background" />
                      </div>
                      <Button onClick={addKey}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-md border border-border/50">
                  <div className="text-sm font-semibold">Métodos Aceitos:</div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="acceptPix" checked={newKey.acceptsPix} onCheckedChange={(c) => setNewKey({...newKey, acceptsPix: !!c})} />
                    <Label htmlFor="acceptPix">Pix</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="acceptCard" checked={newKey.acceptsCreditCard} onCheckedChange={(c) => setNewKey({...newKey, acceptsCreditCard: !!c})} />
                    <Label htmlFor="acceptCard">Cartão</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="acceptBoleto" checked={newKey.acceptsBoleto} onCheckedChange={(c) => setNewKey({...newKey, acceptsBoleto: !!c})} />
                    <Label htmlFor="acceptBoleto">Boleto</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  {keys.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhuma integração configurada.</p>
                  ) : (
                    keys.map(k => (
                      <div key={k.id} className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {k.name}
                            {k.isActive && <Badge className="bg-primary">Em uso</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{k.gateway} - Conectado (Expira em: {k.pixExpirationTime || '00:30'})</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="destructive" size="icon" onClick={() => setDeleteKeyId(k.id)}>
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        
      </Tabs>
      
      {showPhoneModal && (
        <TenantPhoneModal 
          tenantId={targetTenantId as string} 
          onClose={() => setShowPhoneModal(false)} 
          onSuccess={() => setTenant((prev: any) => prev ? { ...prev, evolutionInstanceStatus: 'OPEN' } : null)}
        />
      )}

      {/* Modal de Visualização de Imagem */}
      {viewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setViewImage(null)}
        >
          <div className="relative max-w-3xl w-full flex flex-col items-center justify-center">
            <button 
              onClick={() => setViewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={`/api/image-proxy?url=${encodeURIComponent(viewImage)}`} 
              alt="Visualização" 
              className="w-auto h-auto max-h-[80vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Modal de Variáveis da IA */}
      <Dialog open={!!missingVarsPrompt} onOpenChange={(o) => !o && setMissingVarsPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informações Faltantes</DialogTitle>
            <DialogDescription>
              O modelo selecionado precisa dos seguintes dados para ser configurado. Preencha-os para continuar:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {missingVarsPrompt?.variables.map(v => (
              <div key={v} className="space-y-2">
                <Label className="capitalize">{v.replace(/_/g, ' ')}</Label>
                <Input 
                  value={missingVarsPrompt.values[v] || ""}
                  onChange={(e) => setMissingVarsPrompt(prev => prev ? {
                    ...prev,
                    values: { ...prev.values, [v]: e.target.value }
                  } : null)}
                  placeholder={`Digite o(a) ${v.replace(/_/g, ' ')}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMissingVarsPrompt(null)}>Cancelar</Button>
            <Button onClick={() => {
              if (missingVarsPrompt?.template.isGlobal) {
                applyGlobalPreset(missingVarsPrompt.template.globalId!, missingVarsPrompt.template.globalConfig, missingVarsPrompt.values);
              } else if (missingVarsPrompt?.template.field) {
                updateAiConfig(missingVarsPrompt.template.field, applyVarsToText(missingVarsPrompt.template.text!, missingVarsPrompt.values));
              }
              // Salvar as variáveis também no tenant para usos futuros
              setTenant((prev: any) => ({
                ...prev,
                aiConfig: {
                  ...(prev?.aiConfig || {}),
                  customVars: { ...(prev?.aiConfig?.customVars || {}), ...missingVarsPrompt?.values }
                }
              }));
              setMissingVarsPrompt(null);
            }}>
              Aplicar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
