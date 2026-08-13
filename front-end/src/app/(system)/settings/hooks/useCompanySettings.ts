import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { getBackendUrl } from "@/lib/api";
import { TenantConfig } from "../types/settings.types";
import { useSession } from "next-auth/react";

export function useCompanySettings(targetTenantId: string | null) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  
  const fetcher = async (url: string) => {
    if (!targetTenantId) return null;
    const headers: any = { 'tenant-id': targetTenantId };
    if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }
    const res = await fetch(url, { headers });
    const data = await res.json();
    return data.success ? data.data : null;
  };

  const { data: tenant, mutate: mutateTenant, isLoading: loading } = useSWR(
    targetTenantId ? getBackendUrl('/api/settings/tenant') : null,
    fetcher
  );

  const [saving, setSaving] = useState(false);
  const [docValidating, setDocValidating] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const updateTenantLocal = (updates: Partial<TenantConfig>) => {
    mutateTenant((prev: any) => prev ? { ...prev, ...updates } : null, false);
  };

  const saveTenantData = async (payload: Partial<TenantConfig>) => {
    if (!tenant || !targetTenantId) return false;
    setSaving(true);
    try {
      const response = await fetch(getBackendUrl('/api/settings/tenant'), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'tenant-id': targetTenantId, 
          'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (!data.success) {
        toast.error(data.error || "Erro ao salvar dados");
        return false;
      }
      
      if (data.ignoredFields && data.ignoredFields.length > 0) {
        toast.error("Alguns campos foram ignorados e devem ser editados na nova tela.");
      } else {
        toast.success("Dados salvos com sucesso!");
      }
      mutateTenant();
      return true;
    } catch (e) {
      toast.error("Erro ao salvar dados");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!targetTenantId) return null;
    const toastId = toast.loading("Enviando logo...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "logo");

    try {
      const headers: any = {};
      if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }
      headers['tenant-id'] = targetTenantId;

      const res = await fetch(getBackendUrl('/api/upload'), {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Logo enviada, salve as alterações para confirmar!", { id: toastId });
        return data.url;
      } else {
        toast.error(data.error || "Erro ao enviar logo", { id: toastId });
        return null;
      }
    } catch (err) {
      toast.error("Erro na conexão ao enviar logo", { id: toastId });
      return null;
    }
  };

  const deleteLogo = async (url: string) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }
      if (targetTenantId) headers['tenant-id'] = targetTenantId;
      await fetch(getBackendUrl('/api/upload'), {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ url })
      });
    } catch (err) {
      // log
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

  const fetchCep = async (cep: string) => {
    const raw = cep.replace(/\D/g, '');
    if (raw.length === 8) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${raw}`);
        if (res.ok) {
          const data = await res.json();
          updateTenantLocal({
            addressStreet: data.street || tenant?.addressStreet,
            addressNeighborhood: data.neighborhood || tenant?.addressNeighborhood,
            addressCity: data.city || tenant?.addressCity,
            addressState: data.state || tenant?.addressState
          });
        }
      } catch (e) {
        // ignore
      }
    }
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
          
          updateTenantLocal({
            name: apiPayload?.nome || tenant?.name,
            cpfBirthDate: birth,
            cpfGender: newGender
          });
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
        
        updateTenantLocal({
          name: data.nome_fantasia || data.razao_social || tenant?.name,
          cep: data.cep || tenant?.cep,
          addressStreet: data.logradouro || tenant?.addressStreet,
          addressNumber: data.numero || tenant?.addressNumber,
          addressComplement: data.complemento || tenant?.addressComplement,
          addressNeighborhood: data.bairro || tenant?.addressNeighborhood,
          addressCity: data.municipio || tenant?.addressCity,
          addressState: data.uf || tenant?.addressState
        });
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

  return {
    tenant,
    loading,
    saving,
    docValidating,
    docError,
    setDocError,
    mutateTenant,
    updateTenantLocal,
    saveTenantData,
    uploadLogo,
    deleteLogo,
    fetchCep,
    validateDocument
  };
}
