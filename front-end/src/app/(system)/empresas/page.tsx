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
import { Building2, Plus, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EmpresasPage() {
  const { data: session, update } = useSession();
  const token = (session?.user as any)?.accessToken;
  const role = (session?.user as any)?.role;
  const activeTenantId = (session as any)?.tenantId;
  const tenants = (session?.user as any)?.tenants || [];

  const [loading, setLoading] = useState(false);
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
        // Precisa atualizar a sessão para incluir o novo tenant
        // A forma mais simples é forçar reload se next-auth não rebuscar a lista automaticamente no update()
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
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
        <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2"/> Nova Empresa / Filial</Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tenants.map((t: any) => (
          <Card key={t.id} className={t.id === activeTenantId ? 'border-primary ring-1 ring-primary/20' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <CardDescription>Empresa ID: {t.id.substring(0,8)}...</CardDescription>
                </div>
              </div>
              {t.id === activeTenantId && <Badge>Ativa no momento</Badge>}
              {t.id !== activeTenantId && (
                <Button variant="outline" size="sm" onClick={() => update({ tenantId: t.id })}>
                  Acessar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Phone className="w-4 h-4"/> WhatsApps ({(phonesMap[t.id] || []).length})</h4>
                {phonesMap[t.id]?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {phonesMap[t.id].map(p => (
                      <Badge key={p.id} variant="secondary" className="px-3 py-1">
                        {p.phone} ({p.evolutionInstanceStatus === 'OPEN' ? 'Conectado' : 'Desconectado'})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Para adicionar e gerenciar WhatsApps, acesse a empresa e vá em Configurações &gt; WhatsApp.</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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
