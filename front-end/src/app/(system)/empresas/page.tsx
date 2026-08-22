"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Plus, Phone, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EmpresasPage() {
  const { data: session, update } = useSession();
  const token = (session?.user as any)?.accessToken;
  const activeTenantId = (session as any)?.tenantId;
  const tenants = (session?.user as any)?.tenants || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [phonesMap, setPhonesMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Fetch whatsapp instances for all tenants
    const fetchPhones = async () => {
      for (const t of tenants) {
        try {
          const res = await fetch(getBackendUrl(`/api/settings/whatsapp?tenantId=${t.id}`), {
            headers: { 'tenant-id': t.id, Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setPhonesMap(prev => ({ ...prev, [t.id]: data.data }));
          }
        } catch (e) {
          // silent
        }
      }
    };
    if (tenants.length > 0) fetchPhones();
  }, [tenants, token]);

  const handleCreate = async () => {
    if (!formData.name) return toast.error("O nome da empresa é obrigatório.");
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl(`/api/tenants`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Empresa criada com sucesso! Atualizando sessão...");
        window.location.reload();
      } else {
        toast.error(data.message || data.error || "Erro ao criar empresa.");
      }
    } catch (e) {
      toast.error("Erro na conexão.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Minhas Empresas / Filiais</h1>
          <p className="text-sm text-muted-foreground">Selecione a empresa que deseja gerenciar ou adicione uma nova filial.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Nova Empresa / Filial
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {tenants.map((t: any) => {
          const isActive = t.id === activeTenantId;
          const phones = phonesMap[t.id] || [];

          return (
            <Card 
              key={t.id} 
              className={`flex flex-col justify-between transition-all hover:shadow-md ${
                isActive ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10' : 'hover:border-primary/40'
              }`}
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {isActive ? (
                      <Badge className="bg-primary text-primary-foreground gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Ativa
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => update({ tenantId: t.id })} className="text-xs">
                        Acessar
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold mt-3 line-clamp-1">{t.name}</CardTitle>
                  <CardDescription className="text-[11px] font-mono">
                    ID: {t.id.substring(0, 10)}...
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mt-2 pt-3 border-t border-border">
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" /> WhatsApps ({phones.length})
                    </h4>
                    {phones.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {phones.map((p: any) => (
                          <Badge key={p.id} variant="secondary" className="px-2 py-0.5 text-[10px] font-mono">
                            {p.phone || p.instanceName} ({p.evolutionInstanceStatus === 'OPEN' ? 'Conectado' : 'Desconectado'})
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Nenhum WhatsApp conectado.</p>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Empresa / Filial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Ex: Minha Empresa Filial" 
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone (Opcional)</Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                placeholder="Ex: 11999999999" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Criando..." : "Criar Empresa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
