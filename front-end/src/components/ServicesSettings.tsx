"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash, Edit } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ServicesSettings({ tenantId, token }: { tenantId: string; token?: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationMinutes: "30",
    isActive: true
  });

  const formatCurrency = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (!v) return "";
    v = (Number(v) / 100).toFixed(2);
    return v.replace(".", ",");
  };

  const minsToTime = (mins: string | number) => {
    const m = Number(mins) || 0;
    const hrs = Math.floor(m / 60).toString().padStart(2, "0");
    const remMins = (m % 60).toString().padStart(2, "0");
    return `${hrs}:${remMins}`;
  };

  const timeToMins = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(":");
    return (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
  };

  useEffect(() => {
    if (!tenantId) return;
    loadServices();
  }, [tenantId]);

  const loadServices = async () => {
    try {
      const res = await fetch(getBackendUrl('/api/settings/services'), {
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setServices(data.data);
      } else {
        toast.error("Erro ao carregar serviços");
      }
    } catch (e) {
      toast.error("Erro de conexão ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", price: "", durationMinutes: "30", isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (svc: any) => {
    setEditingId(svc.id);
    const formattedPrice = formatCurrency((Number(svc.price) * 100).toFixed(0));
    setFormData({
      name: svc.name,
      description: svc.description || "",
      price: formattedPrice,
      durationMinutes: svc.durationMinutes.toString(),
      isActive: svc.isActive
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const parsedPrice = parseFloat(formData.price.replace(/\./g, "").replace(",", "."));
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parsedPrice,
        durationMinutes: parseInt(formData.durationMinutes) || 30,
        isActive: formData.isActive
      };

      if (editingId) {
        const res = await fetch(getBackendUrl('/api/settings/services'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: editingId, ...payload })
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Serviço atualizado com sucesso");
          setServices(services.map(s => s.id === editingId ? data.data : s));
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(getBackendUrl('/api/settings/services'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Serviço cadastrado com sucesso");
          setServices([data.data, ...services]);
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao cadastrar");
        }
      }
    } catch (e) {
      toast.error("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(getBackendUrl(`/api/settings/services?id=${deleteId}`), {
        method: 'DELETE',
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Serviço excluído");
        setServices(services.filter(s => s.id !== deleteId));
      } else {
        toast.error(data.error || "Erro ao excluir");
      }
    } catch (e) {
      toast.error("Erro de conexão ao excluir");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <div className="text-center p-4 text-muted-foreground">Carregando serviços...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Serviços Cadastrados</h3>
          <p className="text-sm text-muted-foreground">Gerencie os serviços e preços que a IA poderá agendar.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Serviço
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum serviço cadastrado. Adicione o seu primeiro serviço para a IA poder agendar.
            </div>
          ) : (
            <div className="divide-y">
              {services.map((svc) => (
                <div key={svc.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{svc.name}</span>
                      {!svc.isActive && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span>R$ {Number(svc.price).toFixed(2).replace('.', ',')}</span>
                      <span>•</span>
                      <span>{minsToTime(svc.durationMinutes)} h</span>
                    </div>
                    {svc.description && <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">{svc.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(svc)}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(svc.id)}>
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            <DialogDescription>Preencha os detalhes do serviço abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Serviço</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Corte de Cabelo"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (Opcional)</Label>
              <Input 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Descreva detalhes do serviço para a IA usar como referência"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
                  <Input 
                    className="pl-8"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: formatCurrency(e.target.value) })}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duração</Label>
                <Input 
                  type="time"
                  value={minsToTime(formData.durationMinutes)}
                  onChange={e => setFormData({ ...formData, durationMinutes: timeToMins(e.target.value).toString() })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label>Serviço Ativo</Label>
                <p className="text-xs text-muted-foreground">Serviços inativos não são oferecidos pela IA.</p>
              </div>
              <Switch 
                checked={formData.isActive}
                onCheckedChange={c => setFormData({ ...formData, isActive: c })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Serviço"
        description="Tem certeza que deseja excluir este serviço? A ação não pode ser desfeita."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
